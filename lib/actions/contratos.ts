"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { TipoIndice, Moneda } from "@prisma/client";
import { recalcularAjustes } from "@/lib/actions/ajustes";

export async function crearContrato(formData: FormData) {
  const propiedadId = String(formData.get("propiedadId") ?? "");
  const inquilinoId = String(formData.get("inquilinoId") ?? "");
  const garanteId = String(formData.get("garanteId") ?? "") || null;
  const fechaInicio = new Date(String(formData.get("fechaInicio")));
  const fechaFin = new Date(String(formData.get("fechaFin")));
  const montoInicial = Number(formData.get("montoInicial"));
  const moneda = String(formData.get("moneda") ?? "ARS") as Moneda;
  const indice = String(formData.get("indice") ?? "") as TipoIndice;
  const frecuenciaMeses = Number(formData.get("frecuenciaMeses"));
  const porcentajeFijoRaw = String(formData.get("porcentajeFijo") ?? "");
  const porcentajeFijo = porcentajeFijoRaw ? Number(porcentajeFijoRaw) : null;
  const diaPago = Number(formData.get("diaPago") ?? 10);
  const comisionPct = Number(formData.get("comisionPct") ?? 0);

  if (!propiedadId || !inquilinoId || !indice || !frecuenciaMeses) {
    throw new Error("Faltan campos obligatorios del contrato");
  }
  if (!(fechaFin.getTime() > fechaInicio.getTime())) {
    throw new Error("La fecha de fin debe ser posterior a la fecha de inicio");
  }

  const contrato = await prisma.contrato.create({
    data: {
      propiedadId,
      inquilinoId,
      garanteId,
      fechaInicio,
      fechaFin,
      montoInicial,
      moneda,
      indice,
      frecuenciaMeses,
      porcentajeFijo,
      diaPago,
      comisionPct,
    },
  });

  await recalcularAjustes(contrato.id);

  revalidatePath("/contratos");
  revalidatePath("/");
  redirect(`/contratos/${contrato.id}`);
}
