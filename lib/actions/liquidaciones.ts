"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

/**
 * Genera la liquidación del mes en curso para cada propietario: suma los
 * pagos cobrados (estado "pagado") del período sobre todos sus contratos,
 * descuenta la comisión de administración de cada contrato y guarda el neto.
 */
export async function generarLiquidaciones() {
  const hoy = new Date();
  const periodo = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const periodoSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

  const propietarios = await prisma.persona.findMany({
    where: { tipo: "DUENO" },
    include: {
      propiedades: {
        include: {
          contratos: {
            include: {
              pagos: {
                where: { estado: "pagado", periodo: { gte: periodo, lt: periodoSiguiente } },
              },
            },
          },
        },
      },
    },
  });

  let generadas = 0;
  for (const propietario of propietarios) {
    let bruto = 0;
    let comision = 0;
    for (const propiedad of propietario.propiedades) {
      for (const contrato of propiedad.contratos) {
        for (const pago of contrato.pagos) {
          const montoPago = Number(pago.monto);
          bruto += montoPago;
          comision += montoPago * (Number(contrato.comisionPct) / 100);
        }
      }
    }

    if (bruto === 0) continue;

    const existente = await prisma.liquidacion.findUnique({
      where: { propietarioId_periodo: { propietarioId: propietario.id, periodo } },
    });
    if (!existente) generadas++;

    await prisma.liquidacion.upsert({
      where: { propietarioId_periodo: { propietarioId: propietario.id, periodo } },
      update: { bruto, comision, neto: bruto - comision },
      create: { propietarioId: propietario.id, periodo, bruto, comision, neto: bruto - comision },
    });
  }

  revalidatePath("/propietarios");
  redirect(`/propietarios?liquidadas=${generadas}`);
}
