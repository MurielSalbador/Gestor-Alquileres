import Link from "next/link";
import { prisma } from "@/lib/db";
import { crearPersona } from "@/lib/actions/personas";
import { crearPropiedad } from "@/lib/actions/propiedades";
import { generarLiquidaciones } from "@/lib/actions/liquidaciones";
import { StatCard } from "@/components/StatCard";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BuildingIllustration } from "@/components/BuildingIllustration";
import { PropietarioCard, type PropietarioCardData } from "@/components/PropietarioCard";
import { PropietarioForm } from "@/components/PropietarioForm";
import { PropiedadForm } from "@/components/PropiedadForm";
import { IconUser, IconHome, IconCash, IconReceipt, IconCheck } from "@/components/icons";

const sectionHeaderIconClass = "flex h-8 w-8 items-center justify-center rounded-lg bg-forest/10 text-forest";

export default async function PropietariosPage({
  searchParams,
}: {
  searchParams: Promise<{ liquidadas?: string }>;
}) {
  const sp = await searchParams;
  const liquidadas = sp.liquidadas !== undefined ? Number(sp.liquidadas) : undefined;

  const hoy = new Date();
  const periodo = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [propietariosRaw, propiedadesCount, liquidacionesDelMes] = await Promise.all([
    prisma.persona.findMany({
      where: { tipo: "DUENO" },
      orderBy: { nombre: "asc" },
      include: {
        propiedades: { orderBy: { direccion: "asc" } },
        liquidaciones: { orderBy: { periodo: "desc" }, take: 6 },
      },
    }),
    prisma.propiedad.count(),
    prisma.liquidacion.findMany({ where: { periodo } }),
  ]);

  const propietarios: PropietarioCardData[] = propietariosRaw.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    email: p.email,
    telefono: p.telefono,
    propiedades: p.propiedades.map((prop) => ({ id: prop.id, direccion: prop.direccion, tipo: prop.tipo })),
    liquidaciones: p.liquidaciones.map((l) => ({
      id: l.id,
      periodo: l.periodo.toISOString(),
      bruto: Number(l.bruto),
      comision: Number(l.comision),
      neto: Number(l.neto),
    })),
  }));

  const netoDelMes = liquidacionesDelMes.reduce((acc, l) => acc + Number(l.neto), 0);
  const comisionDelMes = liquidacionesDelMes.reduce((acc, l) => acc + Number(l.comision), 0);

  return (
    <div className="flex flex-col gap-5">
      <section className="animate-scale-in relative overflow-hidden rounded-2xl bg-forest p-5 text-cream sm:p-6">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-md">
            <h1 className="text-xl font-semibold sm:text-2xl">Propietarios</h1>
            <p className="mt-1 text-sm text-cream/90">
              {propietarios.length} {propietarios.length === 1 ? "propietario" : "propietarios"} ·{" "}
              {propiedadesCount} {propiedadesCount === 1 ? "propiedad" : "propiedades"}
            </p>
          </div>
          <form action={generarLiquidaciones}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-cream px-4 py-2.5 text-sm font-medium text-forest transition-all duration-200 hover:bg-white hover:shadow-lg active:scale-95"
            >
              <IconReceipt />
              Generar liquidación del mes
            </button>
          </form>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-72 opacity-90 sm:block lg:w-96">
          <BuildingIllustration />
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
      </section>

      {liquidadas !== undefined && (
        <section
          className={`animate-fade-in-up flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            liquidadas > 0 ? "border-forest/20 bg-forest/5 text-forest" : "border-neutral-200 bg-neutral-50 text-neutral-600"
          }`}
        >
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${liquidadas > 0 ? "bg-forest/15" : "bg-neutral-200"}`}>
            <IconCheck />
          </span>
          {liquidadas > 0
            ? `Se ${liquidadas === 1 ? "generó" : "generaron"} ${liquidadas} ${liquidadas === 1 ? "liquidación nueva" : "liquidaciones nuevas"} para este período.`
            : "No había pagos cobrados nuevos este período — no se generó ninguna liquidación."}
        </section>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<IconUser />}
          label="Propietarios"
          value={<AnimatedNumber value={propietarios.length} />}
          variant="forest"
          delayMs={0}
        />
        <StatCard
          icon={<IconHome />}
          label="Propiedades"
          value={<AnimatedNumber value={propiedadesCount} />}
          variant="terracotta"
          delayMs={60}
        />
        <StatCard
          icon={<IconCash />}
          label="Liquidado este mes"
          value={<AnimatedNumber value={netoDelMes} kind="currency" />}
          sublabel={`${liquidacionesDelMes.length} liquidaciones`}
          variant="neutral"
          delayMs={120}
        />
        <StatCard
          icon={<IconReceipt />}
          label="Comisión retenida"
          value={<AnimatedNumber value={comisionDelMes} kind="currency" />}
          variant="clay"
          delayMs={180}
        />
      </section>

      <section className="animate-fade-in-up rounded-xl border border-forest/10 bg-white" style={{ animationDelay: "40ms" }}>
        <div className="flex items-center gap-2.5 border-b border-forest/10 px-4 py-3">
          <span className={sectionHeaderIconClass}>
            <IconUser />
          </span>
          <h2 className="font-medium text-neutral-900">Propietarios y liquidaciones</h2>
        </div>
        {propietarios.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">Todavía no hay propietarios cargados.</p>
        ) : (
          <div className="flex flex-col gap-2 p-2">
            {propietarios.map((p, i) => (
              <PropietarioCard key={p.id} propietario={p} index={i} />
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <div id="nuevo-propietario" className="animate-fade-in-up scroll-mt-20 rounded-xl border border-forest/10 bg-white" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-2.5 border-b border-forest/10 px-4 py-3">
            <span className={sectionHeaderIconClass}>
              <IconUser />
            </span>
            <h2 className="font-medium text-neutral-900">Agregar propietario</h2>
          </div>
          <div className="p-4">
            <PropietarioForm action={crearPersona} />
          </div>
        </div>

        <div id="nueva-propiedad" className="animate-fade-in-up scroll-mt-20 rounded-xl border border-forest/10 bg-white" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2.5 border-b border-forest/10 px-4 py-3">
            <span className={sectionHeaderIconClass}>
              <IconHome />
            </span>
            <h2 className="font-medium text-neutral-900">Agregar propiedad</h2>
          </div>
          <div className="p-4">
            {propietarios.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Agregá primero un propietario en{" "}
                <Link href="#nuevo-propietario" className="font-medium text-forest hover:underline">
                  el formulario de arriba
                </Link>
                .
              </p>
            ) : (
              <PropiedadForm action={crearPropiedad} propietarios={propietariosRaw.map((p) => ({ id: p.id, nombre: p.nombre }))} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
