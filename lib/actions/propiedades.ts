"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { TipoPropiedad } from "@prisma/client";

export async function crearPropiedad(formData: FormData) {
  const direccion = String(formData.get("direccion") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "") as TipoPropiedad;
  const propietarioId = String(formData.get("propietarioId") ?? "");

  if (!direccion || !tipo || !propietarioId) {
    throw new Error("Dirección, tipo y propietario son obligatorios");
  }

  await prisma.propiedad.create({ data: { direccion, tipo, propietarioId } });

  revalidatePath("/propietarios");
  revalidatePath("/contratos");
}
