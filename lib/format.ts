export function formatMoneda(valor: number | string | { toString(): string }, moneda: "ARS" | "USD" = "ARS") {
  const n = typeof valor === "number" ? valor : Number(valor.toString());
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: moneda }).format(n);
}

export function formatFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(fecha);
}

export function formatPeriodo(fecha: Date) {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(fecha);
}
