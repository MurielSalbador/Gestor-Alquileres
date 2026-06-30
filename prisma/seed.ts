import { PrismaClient } from "../app/generated/prisma/client";
import { getSerieIPC } from "../lib/indices/indec";
import { recalcularYGuardarAjustes } from "../lib/ajustes-calc";

const prisma = new PrismaClient();

function addMonths(d: Date, m: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + m);
  return r;
}

/**
 * Serie ICL SINTÉTICA para poder probar el producto de punta a punta sin
 * depender de la red. No son valores reales del BCRA. Antes de usar el
 * sistema con contratos reales, llamar a POST /api/indices/sync (que trae
 * la serie real) o cargar la oficial a mano.
 */
function serieICLSintetica(desde: Date, hasta: Date) {
  const valores: { tipo: "ICL"; fecha: Date; valor: number }[] = [];
  let nivel = 100;
  let cursor = new Date(desde.getFullYear(), desde.getMonth(), 1);
  const limite = new Date(hasta.getFullYear(), hasta.getMonth(), 1);
  while (cursor.getTime() <= limite.getTime()) {
    valores.push({ tipo: "ICL", fecha: new Date(cursor), valor: Math.round(nivel * 1e6) / 1e6 });
    const tasaMensual = cursor.getFullYear() <= 2024 ? 0.035 : 0.02;
    nivel *= 1 + tasaMensual;
    cursor = addMonths(cursor, 1);
  }
  return valores;
}

async function main() {
  console.log("Seed: limpiando datos existentes...");
  await prisma.liquidacion.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.ajuste.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.propiedad.deleteMany();
  await prisma.persona.deleteMany();
  await prisma.valorIndice.deleteMany();

  console.log("Seed: personas...");
  const duenoA = await prisma.persona.create({
    data: { nombre: "María Gómez", tipo: "DUENO", email: "maria@example.com" },
  });
  const duenoB = await prisma.persona.create({
    data: { nombre: "Carlos Pérez", tipo: "DUENO", email: "carlos@example.com" },
  });
  const inquilinoA = await prisma.persona.create({
    data: { nombre: "Lucía Fernández", tipo: "INQUILINO", email: "lucia@example.com" },
  });
  const inquilinoB = await prisma.persona.create({
    data: { nombre: "Tomás Rodríguez", tipo: "INQUILINO", email: "tomas@example.com" },
  });
  const garanteA = await prisma.persona.create({
    data: { nombre: "Jorge Fernández", tipo: "GARANTE", email: "jorge@example.com" },
  });

  console.log("Seed: propiedades...");
  const propiedadA = await prisma.propiedad.create({
    data: { direccion: "Av. Corrientes 1234, CABA", tipo: "DEPARTAMENTO", propietarioId: duenoA.id },
  });
  const propiedadB = await prisma.propiedad.create({
    data: { direccion: "Av. Pueyrredón 567, CABA", tipo: "DEPARTAMENTO", propietarioId: duenoB.id },
  });

  console.log("Seed: valores de índice (ICL sintético + IPC ejemplo)...");
  const hoy = new Date();
  const desdeICL = new Date(hoy.getFullYear() - 2, hoy.getMonth(), 1);
  const icl = serieICLSintetica(desdeICL, hoy);
  for (const v of icl) {
    await prisma.valorIndice.create({ data: v });
  }
  const ipc = getSerieIPC();
  for (const v of ipc) {
    await prisma.valorIndice.create({ data: { tipo: v.tipo, fecha: v.fecha, valor: v.valor } });
  }

  console.log("Seed: contratos...");
  // Contrato viejo, régimen anterior: ajusta por ICL una vez al año.
  const fechaInicioA = new Date(hoy.getFullYear() - 2, hoy.getMonth(), 1);
  const contratoA = await prisma.contrato.create({
    data: {
      propiedadId: propiedadA.id,
      inquilinoId: inquilinoA.id,
      garanteId: garanteA.id,
      fechaInicio: fechaInicioA,
      fechaFin: addMonths(fechaInicioA, 36),
      montoInicial: 300000,
      moneda: "ARS",
      indice: "ICL",
      frecuenciaMeses: 12,
      diaPago: 10,
      comisionPct: 5,
    },
  });

  // Contrato nuevo (DNU 70/2023, libre pacto): ajusta por IPC trimestral.
  const fechaInicioB = new Date("2025-01-01T00:00:00Z");
  const contratoB = await prisma.contrato.create({
    data: {
      propiedadId: propiedadB.id,
      inquilinoId: inquilinoB.id,
      fechaInicio: fechaInicioB,
      fechaFin: addMonths(fechaInicioB, 24),
      montoInicial: 450000,
      moneda: "ARS",
      indice: "IPC",
      frecuenciaMeses: 3,
      diaPago: 5,
      comisionPct: 6,
    },
  });

  console.log("Seed: pagos de ejemplo...");
  for (let i = 2; i >= 0; i--) {
    const periodo = addMonths(new Date(hoy.getFullYear(), hoy.getMonth(), 1), -i);
    await prisma.pago.create({
      data: {
        contratoId: contratoA.id,
        periodo,
        monto: 300000,
        estado: i === 0 ? "pendiente" : "pagado",
        fechaPago: i === 0 ? null : addMonths(periodo, 0),
      },
    });
    await prisma.pago.create({
      data: {
        contratoId: contratoB.id,
        periodo,
        monto: 450000,
        estado: i === 0 ? "pendiente" : i === 1 ? "pagado" : "vencido",
        fechaPago: i === 1 ? periodo : null,
      },
    });
  }

  console.log("Seed: calculando calendario de ajustes...");
  await recalcularYGuardarAjustes(contratoA.id);
  await recalcularYGuardarAjustes(contratoB.id);

  console.log(`Seed listo: contratos ${contratoA.id}, ${contratoB.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
