"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { TipoPersona } from "@/app/generated/prisma/enums";

export async function crearPersona(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "") as TipoPersona;
  const email = String(formData.get("email") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;

  if (!nombre || !tipo) {
    throw new Error("Nombre y tipo son obligatorios");
  }

  await prisma.persona.create({ data: { nombre, tipo, email, telefono } });

  revalidatePath("/propietarios");
  revalidatePath("/contratos");
}

export async function actualizarPersona(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "") as TipoPersona;
  const email = String(formData.get("email") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;

  if (!id || !nombre || !tipo) {
    throw new Error("Nombre y tipo son obligatorios");
  }

  await prisma.persona.update({ where: { id }, data: { nombre, tipo, email, telefono } });

  revalidatePath("/propietarios");
  revalidatePath("/contratos");
}

/**
 * Elimina una persona (inquilino o garante) siempre que no tenga contratos
 * asociados. Si los tiene, no hace nada: la UI ya oculta el botón de borrar
 * en ese caso, esto es solo el resguardo del lado del servidor.
 */
export async function eliminarPersona(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta la persona");

  const enUso = await prisma.contrato.count({
    where: { OR: [{ inquilinoId: id }, { garanteId: id }] },
  });
  if (enUso > 0) return;

  await prisma.persona.delete({ where: { id } });

  revalidatePath("/propietarios");
  revalidatePath("/contratos");
}
