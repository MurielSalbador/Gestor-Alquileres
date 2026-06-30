import Link from "next/link";
import { prisma } from "@/lib/db";
import { crearContrato } from "@/lib/actions/contratos";
import { crearPersona, actualizarPersona, eliminarPersona } from "@/lib/actions/personas";
import { formatFecha, formatMoneda } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BuildingIllustration } from "@/components/BuildingIllustration";
import { NuevoContratoForm } from "@/components/NuevoContratoForm";
import { PersonaForm } from "@/components/PersonaForm";
import { PersonaRow } from "@/components/PersonaRow";
import { ContratosCarousel } from "@/components/ContratosCarousel";
import { IconDoc, IconUser, IconClock, IconAlert, IconCash } from "@/components/icons";

const sectionHeaderIconClass = "flex h-8 w-8 items-center justify-center rounded-lg bg-forest/10 text-forest";

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default async function ContratosPage() {
  const [contratos, propiedades, inquilinos, garantes, personasInquilinosGarantes] = await Promise.all([
    prisma.contrato.findMany({
      orderBy: { createdAt: "desc" },
      include: { propiedad: true, inquilino: true },
    }),
    prisma.propiedad.findMany({ include: { propietario: true }, orderBy: { direccion: "asc" } }),
    prisma.persona.findMany({ where: { tipo: "INQUILINO" }, orderBy: { nombre: "asc" } }),
    prisma.persona.findMany({ where: { tipo: "GARANTE" }, orderBy: { nombre: "asc" } }),
    prisma.persona.findMany({
      where: { tipo: { in: ["INQUILINO", "GARANTE"] } },
      orderBy: { nombre: "asc" },
      include: { _count: { select: { contratosInquilino: true, contratosGarante: true } } },
    }),
  ]);

  const personasRows = personasInquilinosGarantes.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    tipo: p.tipo as "INQUILINO" | "GARANTE",
    email: p.email,
    telefono: p.telefono,
    contratosCount: p._count.contratosInquilino + p._count.contratosGarante,
  }));

  const hoy = new Date();
  const en60dias = addDays(hoy, 60);
  const vigentes = contratos.filter((c) => c.fechaFin > hoy);
  const porVencer = vigentes.filter((c) => c.fechaFin <= en60dias);
  const vencidos = contratos.filter((c) => c.fechaFin <= hoy);
  const totalesPorMoneda = vigentes.reduce<Record<string, number>>((acc, c) => {
    acc[c.moneda] = (acc[c.moneda] ?? 0) + Number(c.montoInicial);
    return acc;
  }, {});

  const contratosCarousel = contratos.map((c) => ({
    id: c.id,
    direccion: c.propiedad.direccion,
    inquilino: c.inquilino.nombre,
    indice: c.indice,
    frecuenciaMeses: c.frecuenciaMeses,
    venceLabel: formatFecha(c.fechaFin),
    montoLabel: formatMoneda(c.montoInicial, c.moneda),
    vigente: c.fechaFin > hoy,
  }));

  return (
    <div className="flex flex-col gap-5">
      <section className="animate-scale-in relative overflow-hidden rounded-2xl bg-forest p-5 text-cream sm:p-6">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-xl font-semibold sm:text-2xl">Contratos</h1>
          <p className="mt-3 text-sm text-cream/90">
            {contratos.length} {contratos.length === 1 ? "contrato registrado" : "contratos registrados"} ·{" "}
            {vigentes.length} {vigentes.length === 1 ? "vigente" : "vigentes"}
          </p>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-72 opacity-90 sm:block lg:w-96">
          <BuildingIllustration />
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<IconDoc />}
          label="Vigentes"
          value={<AnimatedNumber value={vigentes.length} />}
          variant="forest"
          delayMs={0}
        />
        <StatCard
          icon={<IconClock />}
          label="Vencen en 60 días"
          value={<AnimatedNumber value={porVencer.length} />}
          variant="terracotta"
          delayMs={60}
        />
        <StatCard
          icon={<IconAlert />}
          label="Vencidos"
          value={<AnimatedNumber value={vencidos.length} />}
          variant="clay"
          delayMs={120}
        />
        <StatCard
          icon={<IconCash />}
          label="Monto mensual (vigentes)"
          value={
            Object.entries(totalesPorMoneda).length === 0
              ? formatMoneda(0)
              : Object.entries(totalesPorMoneda)
                  .map(([moneda, monto]) => formatMoneda(monto, moneda as "ARS" | "USD"))
                  .join(" + ")
          }
          variant="neutral"
          delayMs={180}
        />
      </section>

      <section className="animate-fade-in-up rounded-xl border border-forest/10 bg-white">
        <div className="flex items-center gap-2.5 border-b border-forest/10 px-4 py-3">
          <span className={sectionHeaderIconClass}>
            <IconDoc />
          </span>
          <h2 className="font-medium text-neutral-900">Listado de contratos</h2>
        </div>
        {contratos.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">Todavía no hay contratos cargados.</p>
        ) : (
          <ContratosCarousel contratos={contratosCarousel} />
        )}
      </section>

      <section
        id="inquilinos-garantes"
        className="animate-fade-in-up scroll-mt-20 rounded-xl border border-forest/10 bg-white"
        style={{ animationDelay: "40ms" }}
      >
        <div className="flex items-center gap-2.5 border-b border-forest/10 px-4 py-3">
          <span className={sectionHeaderIconClass}>
            <IconUser />
          </span>
          <h2 className="font-medium text-neutral-900">Inquilinos y garantes</h2>
        </div>
        {personasRows.length > 0 && (
          <div className="flex flex-col gap-1 border-b border-forest/10 p-2">
            {personasRows.map((p) => (
              <PersonaRow key={p.id} persona={p} actualizarAction={actualizarPersona} eliminarAction={eliminarPersona} />
            ))}
          </div>
        )}
        <div className="p-4">
          <PersonaForm action={crearPersona} />
        </div>
      </section>

      <section
        id="nuevo-contrato"
        className="animate-fade-in-up scroll-mt-20 rounded-xl border border-forest/10 bg-white"
        style={{ animationDelay: "80ms" }}
      >
        <div className="flex items-center gap-2.5 border-b border-forest/10 px-4 py-3">
          <span className={sectionHeaderIconClass}>
            <IconDoc />
          </span>
          <h2 className="font-medium text-neutral-900">Nuevo contrato</h2>
        </div>
        <div className="p-4">
          {propiedades.length === 0 || inquilinos.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Necesitás al menos una propiedad (con propietario) y un inquilino cargados. Agregá
              propietarios y propiedades desde la pantalla{" "}
              <Link href="/propietarios" className="font-medium text-forest hover:underline">
                Propietarios
              </Link>
              , y un inquilino más arriba.
            </p>
          ) : (
            <NuevoContratoForm
              action={crearContrato}
              propiedades={propiedades}
              inquilinos={inquilinos}
              garantes={garantes}
            />
          )}
        </div>
      </section>
    </div>
  );
}
