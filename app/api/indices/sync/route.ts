import { NextResponse } from "next/server";
import { sincronizarIndices } from "@/lib/indices/sync";

/**
 * Sincroniza ValorIndice con las fuentes oficiales. Pensado para ser
 * invocado por un cron (ej. Vercel Cron) una vez por día. El motor de
 * cálculo nunca llama a estas fuentes directamente: siempre lee de
 * ValorIndice, que este endpoint mantiene al día.
 */
export async function POST() {
  const resultado = await sincronizarIndices();
  return NextResponse.json(resultado);
}
