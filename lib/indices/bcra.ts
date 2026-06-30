import type { ValorIndice } from "@/lib/motor-ajustes";

const BCRA_API_BASE = "https://api.bcra.gob.ar/estadisticas/v3.0/monetarias";
const DESCRIPCION_ICL = "Índice para Contratos de Locación";

interface BcraVariable {
  idVariable: number;
  descripcion: string;
}

interface BcraDato {
  fecha: string; // YYYY-MM-DD
  valor: number;
}

/**
 * El BCRA no expone un id fijo y documentado para el ICL: hay que ubicarlo
 * buscando la variable cuya descripción coincide. Esto evita hardcodear un
 * idVariable que puede cambiar entre relevamientos.
 */
async function buscarIdVariableICL(): Promise<number> {
  const res = await fetch(BCRA_API_BASE, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) {
    throw new Error(`BCRA: no se pudo listar variables monetarias (HTTP ${res.status})`);
  }
  const body = (await res.json()) as { results: BcraVariable[] };
  const variable = body.results.find((v) => v.descripcion.includes(DESCRIPCION_ICL));
  if (!variable) {
    throw new Error("BCRA: no se encontró la variable ICL en /monetarias");
  }
  return variable.idVariable;
}

/**
 * Baja la serie diaria del ICL publicada por el BCRA entre dos fechas y la
 * normaliza al formato ValorIndice que consume el motor de cálculo.
 *
 * Fuente: https://api.bcra.gob.ar/estadisticas/v3.0/monetarias
 * (equivalente en datos a los XLS públicos iclAAAA.xls / diar_icl.xls)
 */
export async function fetchSerieICL(desde: Date, hasta: Date): Promise<ValorIndice[]> {
  const idVariable = await buscarIdVariableICL();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const url = `${BCRA_API_BASE}/${idVariable}?desde=${fmt(desde)}&hasta=${fmt(hasta)}`;
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 12 } });
  if (!res.ok) {
    throw new Error(`BCRA: no se pudo obtener la serie ICL (HTTP ${res.status})`);
  }
  const body = (await res.json()) as { results: BcraDato[] };

  return body.results.map((d) => ({
    tipo: "ICL" as const,
    fecha: new Date(`${d.fecha}T00:00:00Z`),
    valor: d.valor,
  }));
}
