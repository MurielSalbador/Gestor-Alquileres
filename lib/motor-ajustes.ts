/**
 * Motor de cálculo de ajustes de alquiler — ICL, IPC y porcentaje fijo.
 *
 * El motor calcula SIEMPRE contra valores de índice ya almacenados en la
 * base (tabla ValorIndice), nunca contra una API en vivo. Un proceso de
 * sincronización (lib/indices) baja las series del BCRA (ICL) e INDEC (IPC)
 * y las guarda; este módulo solo lee. Es código puro y determinístico, sin
 * I/O, para poder testearlo contra una calculadora oficial.
 */

export type TipoIndice = "ICL" | "IPC" | "CASA_PROPIA" | "FIJO";

export interface ClausulaAjuste {
  indice: TipoIndice;
  /** 1 = mensual, 3 = trimestral, 4 = cuatrimestral, 6 = semestral, 12 = anual */
  frecuenciaMeses: number;
  /** Solo para indice === 'FIJO'. Ej: 8 = 8% por período. */
  porcentajeFijo?: number;
}

export interface ContratoCalculo {
  id: string;
  fechaInicio: Date;
  fechaFin: Date;
  montoInicial: number;
  clausula: ClausulaAjuste;
}

/**
 * Valor del índice tal como se guarda en la tabla ValorIndice.
 * - ICL / CASA_PROPIA: `valor` es el NIVEL del índice en esa fecha (serie diaria).
 * - IPC: `valor` es la VARIACIÓN MENSUAL en % (ej: 6.2 = 6.2%), con `fecha`
 *   apuntando al primer día del mes al que corresponde.
 */
export interface ValorIndice {
  tipo: TipoIndice;
  fecha: Date;
  valor: number;
}

export type EstadoAjuste = "aplicado" | "pendiente" | "sin_datos";

export interface Ajuste {
  fecha: Date;
  montoAnterior: number;
  coeficiente: number;
  montoNuevo: number;
  estado: EstadoAjuste;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function addMonths(d: Date, m: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + m);
  return r;
}

function mismoMes(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Último valor de una serie de NIVEL (ICL/Casa Propia) en o antes de `fecha`. */
function nivelAsOf(serie: ValorIndice[], tipo: TipoIndice, fecha: Date): number | null {
  let mejor: ValorIndice | null = null;
  for (const v of serie) {
    if (v.tipo !== tipo) continue;
    if (v.fecha.getTime() <= fecha.getTime()) {
      if (!mejor || v.fecha.getTime() > mejor.fecha.getTime()) mejor = v;
    }
  }
  return mejor ? mejor.valor : null;
}

/**
 * ICL / Casa Propia: coeficiente = nivel(fechaHasta) / nivel(fechaDesde).
 * Devuelve null si falta algún extremo de la serie (todavía no publicado).
 */
function coeficientePorNivel(
  serie: ValorIndice[],
  tipo: TipoIndice,
  desde: Date,
  hasta: Date,
): number | null {
  const nDesde = nivelAsOf(serie, tipo, desde);
  const nHasta = nivelAsOf(serie, tipo, hasta);
  if (nDesde == null || nHasta == null || nDesde === 0) return null;
  return nHasta / nDesde;
}

/**
 * IPC: coeficiente = Π (1 + variacion_mes/100) para los meses del período
 * [desde, hasta). Requiere tener TODAS las variaciones mensuales del tramo;
 * si falta alguna (mes aún no publicado por INDEC) devuelve null.
 */
function coeficientePorIPC(serie: ValorIndice[], desde: Date, hasta: Date): number | null {
  const meses: Date[] = [];
  let cursor = new Date(desde.getFullYear(), desde.getMonth(), 1);
  const limite = new Date(hasta.getFullYear(), hasta.getMonth(), 1);
  while (cursor.getTime() < limite.getTime()) {
    meses.push(new Date(cursor));
    cursor = addMonths(cursor, 1);
  }
  let factor = 1;
  for (const mes of meses) {
    const v = serie.find((x) => x.tipo === "IPC" && mismoMes(x.fecha, mes));
    if (!v) return null; // falta un mes -> no se puede calcular todavía
    factor *= 1 + v.valor / 100;
  }
  return factor;
}

function coeficiente(
  clausula: ClausulaAjuste,
  serie: ValorIndice[],
  desde: Date,
  hasta: Date,
): number | null {
  switch (clausula.indice) {
    case "ICL":
    case "CASA_PROPIA":
      return coeficientePorNivel(serie, clausula.indice, desde, hasta);
    case "IPC":
      return coeficientePorIPC(serie, desde, hasta);
    case "FIJO":
      return 1 + (clausula.porcentajeFijo ?? 0) / 100;
  }
}

/**
 * Genera el calendario completo de ajustes de un contrato.
 *
 * @param contrato  Contrato con su cláusula de ajuste.
 * @param serie     Valores de índice disponibles (tabla ValorIndice).
 * @param hoy       Fecha de referencia para marcar aplicado vs pendiente.
 */
export function generarCalendario(
  contrato: ContratoCalculo,
  serie: ValorIndice[],
  hoy: Date = new Date(),
): Ajuste[] {
  const { fechaInicio, fechaFin, montoInicial, clausula } = contrato;
  const ajustes: Ajuste[] = [];

  let inicioPeriodo = new Date(fechaInicio);
  let montoVigente = montoInicial;
  let k = 1;

  for (;;) {
    const fechaAjuste = addMonths(fechaInicio, k * clausula.frecuenciaMeses);
    if (fechaAjuste.getTime() >= fechaFin.getTime()) break;

    const coef = coeficiente(clausula, serie, inicioPeriodo, fechaAjuste);

    if (coef == null) {
      ajustes.push({
        fecha: fechaAjuste,
        montoAnterior: round2(montoVigente),
        coeficiente: 0,
        montoNuevo: round2(montoVigente),
        estado: "sin_datos",
      });
    } else {
      const montoNuevo = round2(montoVigente * coef);
      ajustes.push({
        fecha: fechaAjuste,
        montoAnterior: round2(montoVigente),
        coeficiente: round2(coef),
        montoNuevo,
        estado: fechaAjuste.getTime() <= hoy.getTime() ? "aplicado" : "pendiente",
      });
      montoVigente = montoNuevo;
      inicioPeriodo = fechaAjuste;
    }
    k++;
  }

  return ajustes;
}

/** Monto vigente del contrato a una fecha dada (después de aplicar ajustes). */
export function montoVigenteAl(
  contrato: ContratoCalculo,
  serie: ValorIndice[],
  fecha: Date,
): number {
  const calendario = generarCalendario(contrato, serie, fecha);
  const aplicados = calendario.filter(
    (a) => a.estado === "aplicado" && a.fecha.getTime() <= fecha.getTime(),
  );
  return aplicados.length ? aplicados[aplicados.length - 1].montoNuevo : contrato.montoInicial;
}
