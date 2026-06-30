import { prisma } from "@/lib/db";
import { fetchSerieICL } from "@/lib/indices/bcra";
import { getSerieIPC } from "@/lib/indices/indec";

/**
 * Sincroniza ValorIndice con las fuentes oficiales (BCRA para ICL, serie
 * cargada a mano para IPC). El motor de cálculo nunca llama a estas fuentes
 * directamente: siempre lee de ValorIndice, que esta función mantiene al día.
 * La usan tanto el endpoint de cron (app/api/indices/sync) como el botón
 * "Sincronizar y recalcular" del detalle de contrato.
 */
export async function sincronizarIndices() {
  const hace3Anios = new Date();
  hace3Anios.setFullYear(hace3Anios.getFullYear() - 3);

  let icl: Awaited<ReturnType<typeof fetchSerieICL>> = [];
  let errorICL: string | null = null;
  try {
    icl = await fetchSerieICL(hace3Anios, new Date());
  } catch (e) {
    errorICL = e instanceof Error ? e.message : "error desconocido";
  }

  const ipc = getSerieIPC();
  const valores = [...icl, ...ipc];

  let upserted = 0;
  for (const v of valores) {
    await prisma.valorIndice.upsert({
      where: { tipo_fecha: { tipo: v.tipo, fecha: v.fecha } },
      update: { valor: v.valor },
      create: { tipo: v.tipo, fecha: v.fecha, valor: v.valor },
    });
    upserted++;
  }

  return {
    upserted,
    icl: { count: icl.length, error: errorICL },
    ipc: { count: ipc.length },
  };
}
