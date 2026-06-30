import { prisma } from "@/lib/db";
import { generarCalendario, type ClausulaAjuste } from "@/lib/motor-ajustes";

/**
 * Recalcula el calendario de ajustes de un contrato contra los valores de
 * índice disponibles en ValorIndice y lo persiste en la tabla Ajuste.
 * Lógica pura de persistencia, sin dependencias de Next.js (server actions,
 * revalidatePath), para poder reusarla tanto desde una server action como
 * desde el script de seed.
 */
export async function recalcularYGuardarAjustes(contratoId: string) {
  const contrato = await prisma.contrato.findUniqueOrThrow({ where: { id: contratoId } });

  const serieDb = await prisma.valorIndice.findMany({ where: { tipo: contrato.indice } });
  const serie = serieDb.map((v) => ({ tipo: v.tipo, fecha: v.fecha, valor: Number(v.valor) }));

  const clausula: ClausulaAjuste = {
    indice: contrato.indice,
    frecuenciaMeses: contrato.frecuenciaMeses,
    porcentajeFijo: contrato.porcentajeFijo ? Number(contrato.porcentajeFijo) : undefined,
  };

  const calendario = generarCalendario(
    {
      id: contrato.id,
      fechaInicio: contrato.fechaInicio,
      fechaFin: contrato.fechaFin,
      montoInicial: Number(contrato.montoInicial),
      clausula,
    },
    serie,
  );

  for (const a of calendario) {
    await prisma.ajuste.upsert({
      where: { contratoId_fecha: { contratoId, fecha: a.fecha } },
      update: {
        montoAnterior: a.montoAnterior,
        coeficiente: a.coeficiente,
        montoNuevo: a.montoNuevo,
        estado: a.estado,
      },
      create: {
        contratoId,
        fecha: a.fecha,
        montoAnterior: a.montoAnterior,
        coeficiente: a.coeficiente,
        montoNuevo: a.montoNuevo,
        estado: a.estado,
      },
    });
  }

  return calendario;
}
