import type { ValorIndice } from "@/lib/motor-ajustes";

/**
 * INDEC no tiene una API pública estable para el IPC (nivel general). La
 * serie se publica como planilla a mediados del mes siguiente:
 * https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31
 *
 * Hasta tener un scraper/cron que la mantenga al día, esta serie se carga a
 * mano acá. IMPORTANTE: los valores de ejemplo de abajo son ILUSTRATIVOS
 * para poder probar el motor end-to-end — antes de usarlos para facturar a
 * un inquilino real hay que reemplazarlos por la tabla oficial de INDEC
 * (variación mensual del nivel general, en %).
 */
export interface VariacionMensualIPC {
  /** Primer día del mes al que corresponde la variación. */
  fecha: string; // YYYY-MM-01
  /** Variación mensual del nivel general, en porcentaje (ej: 4.2). */
  valor: number;
}

// TODO: reemplazar por la serie real de INDEC antes de pasar a producción.
export const SERIE_IPC_EJEMPLO: VariacionMensualIPC[] = [
  { fecha: "2025-01-01", valor: 2.2 },
  { fecha: "2025-02-01", valor: 2.4 },
  { fecha: "2025-03-01", valor: 3.7 },
  { fecha: "2025-04-01", valor: 2.8 },
  { fecha: "2025-05-01", valor: 1.5 },
  { fecha: "2025-06-01", valor: 1.6 },
];

export function getSerieIPC(): ValorIndice[] {
  return SERIE_IPC_EJEMPLO.map((v) => ({
    tipo: "IPC" as const,
    fecha: new Date(`${v.fecha}T00:00:00Z`),
    valor: v.valor,
  }));
}
