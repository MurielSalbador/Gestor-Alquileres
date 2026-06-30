"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { EstadoPago } from "@/app/generated/prisma/enums";

export async function marcarPagado(formData: FormData) {
  const pagoId = String(formData.get("pagoId") ?? "");
  if (!pagoId) throw new Error("Falta el pago");

  const pago = await prisma.pago.update({
    where: { id: pagoId },
    data: { estado: "pagado", fechaPago: new Date() },
  });

  revalidatePath("/cobranzas");
  revalidatePath(`/contratos/${pago.contratoId}`);
  revalidatePath("/");
}

export async function marcarVencido(formData: FormData) {
  const pagoId = String(formData.get("pagoId") ?? "");
  if (!pagoId) throw new Error("Falta el pago");

  const pago = await prisma.pago.update({ where: { id: pagoId }, data: { estado: "vencido" } });

  revalidatePath("/cobranzas");
  revalidatePath(`/contratos/${pago.contratoId}`);
  revalidatePath("/");
}

export async function marcarPendiente(formData: FormData) {
  const pagoId = String(formData.get("pagoId") ?? "");
  if (!pagoId) throw new Error("Falta el pago");

  const pago = await prisma.pago.update({
    where: { id: pagoId },
    data: { estado: "pendiente", fechaPago: null },
  });

  revalidatePath("/cobranzas");
  revalidatePath(`/contratos/${pago.contratoId}`);
  revalidatePath("/");
}

/**
 * Genera el pago del período actual para todos los contratos vigentes que
 * todavía no lo tengan, usando el monto vigente (último ajuste aplicado o
 * el monto inicial si no hubo ajustes todavía).
 */
export async function generarPagosDelMes(formData: FormData) {
  const hoy = new Date();
  const periodo = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const contratos = await prisma.contrato.findMany({
    where: { fechaInicio: { lte: hoy }, fechaFin: { gt: hoy } },
    include: {
      ajustes: { where: { estado: "aplicado" }, orderBy: { fecha: "desc" }, take: 1 },
    },
  });

  let generados = 0;
  for (const c of contratos) {
    const existente = await prisma.pago.findUnique({
      where: { contratoId_periodo: { contratoId: c.id, periodo } },
    });
    if (existente) continue;
    const monto = c.ajustes[0]?.montoNuevo ?? c.montoInicial;
    await prisma.pago.create({ data: { contratoId: c.id, periodo, monto, estado: "pendiente" } });
    generados++;
  }

  revalidatePath("/cobranzas");
  revalidatePath("/");

  const sp = new URLSearchParams();
  for (const key of ["q", "estado", "contratoId"]) {
    const v = String(formData.get(key) ?? "");
    if (v) sp.set(key, v);
  }
  sp.set("generados", String(generados));
  redirect(`/cobranzas?${sp.toString()}`);
}

/**
 * Registra (o sobrescribe) el pago de un contrato para un período puntual.
 * A diferencia de "Generar pagos del mes" — que es un batch para el período
 * actual de todos los contratos vigentes — esto permite cargar un pago
 * específico desde el detalle del contrato: un período pasado, futuro, o
 * simplemente uno que el batch todavía no generó.
 */
export async function registrarPago(formData: FormData) {
  const contratoId = String(formData.get("contratoId") ?? "");
  const periodoStr = String(formData.get("periodo") ?? ""); // "YYYY-MM"
  const monto = Number(formData.get("monto") ?? "");
  const estado = String(formData.get("estado") ?? "pendiente") as EstadoPago;

  if (!contratoId || !periodoStr || !Number.isFinite(monto) || monto <= 0) {
    throw new Error("Contrato, período y monto son obligatorios");
  }

  const [anio, mes] = periodoStr.split("-").map(Number);
  const periodo = new Date(anio, mes - 1, 1);
  const fechaPago = estado === "pagado" ? new Date() : null;

  await prisma.pago.upsert({
    where: { contratoId_periodo: { contratoId, periodo } },
    update: { monto, estado, fechaPago },
    create: { contratoId, periodo, monto, estado, fechaPago },
  });

  revalidatePath("/cobranzas");
  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath("/");
}
