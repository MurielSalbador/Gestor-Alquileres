"use server";

import { revalidatePath } from "next/cache";
import { recalcularYGuardarAjustes } from "@/lib/ajustes-calc";
import { sincronizarIndices } from "@/lib/indices/sync";

/**
 * Server action: recalcula y persiste el calendario de ajustes de un
 * contrato contra los valores de índice ya guardados, y revalida las
 * páginas que lo muestran.
 */
export async function recalcularAjustes(contratoId: string) {
  const calendario = await recalcularYGuardarAjustes(contratoId);

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath("/contratos");
  revalidatePath("/");

  return calendario;
}

/**
 * Server action: baja la serie de índices oficiales (BCRA para ICL) y
 * recalcula el calendario de ajustes del contrato contra esos datos
 * actualizados. Es lo que dispara el botón "Sincronizar y recalcular".
 */
export async function sincronizarYRecalcular(contratoId: string) {
  await sincronizarIndices();
  const calendario = await recalcularYGuardarAjustes(contratoId);

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath("/contratos");
  revalidatePath("/");

  return calendario;
}
