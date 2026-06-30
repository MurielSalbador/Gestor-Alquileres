import Link from "next/link";
import { prisma } from "@/lib/db";
import { generarPagosDelMes } from "@/lib/actions/pagos";
import { generarLiquidaciones } from "@/lib/actions/liquidaciones";
import { formatFecha, formatMoneda, formatPeriodo } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BuildingIllustration } from "@/components/BuildingIllustration";
import { IconDoc, IconHome, IconUser, IconCash, IconReceipt, IconClock, IconAlert, IconTrend } from "@/components/icons";

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const quickActionClass =
  "animate-fade-in-up flex flex-col items-center gap-1 rounded-xl border border-forest/10 bg-white p-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-forest/30 hover:shadow-lg hover:shadow-forest/5";
const quickActionIconClass =
  "flex h-8 w-8 items-center justify-center rounded-lg bg-forest/10 text-forest transition-transform duration-200 group-hover:scale-110";

export default async function DashboardPage() {
  const hoy = new Date();
  const en30dias = addDays(hoy, 30);
  const en60dias = addDays(hoy, 60);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const inicioMesSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

  const [
    contratosActivos,
    proximosAjustes,
    pagosDelMes,
    contratosPorVencerCount,
    contratosRecientes,
    pagosVencidosTotal,
    pagosRecientes,
    ajustesAplicadosRecientes,
    propiedadesCount,
    inquilinosCount,
  ] = await Promise.all([
    prisma.contrato.findMany({
      where: { fechaInicio: { lte: hoy }, fechaFin: { gt: hoy } },
      include: { ajustes: { where: { estado: "aplicado" }, orderBy: { fecha: "desc" }, take: 1 } },
    }),
    prisma.ajuste.findMany({
      where: { estado: "pendiente", fecha: { gte: hoy, lte: en30dias } },
      orderBy: { fecha: "asc" },
      include: { contrato: { include: { propiedad: true, inquilino: true } } },
    }),
    prisma.pago.findMany({
      where: { periodo: { gte: inicioMes, lt: inicioMesSiguiente } },
    }),
    prisma.contrato.count({
      where: { fechaFin: { gte: hoy, lte: en60dias } },
    }),
    prisma.contrato.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        propiedad: true,
        inquilino: true,
        ajustes: { where: { estado: "aplicado" }, orderBy: { fecha: "desc" }, take: 1 },
      },
    }),
    prisma.pago.count({ where: { estado: "vencido" } }),
    prisma.pago.findMany({
      where: { estado: "pagado", fechaPago: { not: null } },
      orderBy: { fechaPago: "desc" },
      take: 4,
      include: { contrato: { include: { inquilino: true, propiedad: true } } },
    }),
    prisma.ajuste.findMany({
      where: { estado: "aplicado" },
      orderBy: { fecha: "desc" },
      take: 4,
      include: { contrato: { include: { propiedad: true } } },
    }),
    prisma.propiedad.count(),
    prisma.persona.count({ where: { tipo: "INQUILINO" } }),
  ]);

  const cobrados = pagosDelMes.filter((p) => p.estado === "pagado");
  const pendientes = pagosDelMes.filter((p) => p.estado === "pendiente");
  const vencidos = pagosDelMes.filter((p) => p.estado === "vencido");
  const sumar = (xs: typeof pagosDelMes) => xs.reduce((acc, p) => acc + Number(p.monto), 0);
  const sumCobrado = sumar(cobrados);
  const sumPendiente = sumar(pendientes);
  const sumVencido = sumar(vencidos);
  const totalMes = sumCobrado + sumPendiente + sumVencido;
  const pctCobrado = totalMes ? (sumCobrado / totalMes) * 100 : 0;
  const pctPendiente = totalMes ? (sumPendiente / totalMes) * 100 : 0;
  const boundary = pctCobrado + pctPendiente;

  const montoActual = (c: { montoInicial: unknown; ajustes: { montoNuevo: unknown }[] }) =>
    Number(c.ajustes[0]?.montoNuevo ?? c.montoInicial);

  const totalesPorMoneda = contratosActivos.reduce<Record<string, number>>((acc, c) => {
    acc[c.moneda] = (acc[c.moneda] ?? 0) + montoActual(c);
    return acc;
  }, {});
  const indicesUsados = Array.from(new Set(contratosActivos.map((c) => c.indice)));

  const periodoLabel = formatPeriodo(hoy);
  const periodoCap = periodoLabel.charAt(0).toUpperCase() + periodoLabel.slice(1);

  type Evento = { date: Date; node: React.ReactNode };
  const actividad: Evento[] = [
    ...pagosRecientes.map((p) => ({
      date: p.fechaPago as Date,
      node: (
        <>
          <p className="text-sm font-medium text-neutral-900">Pago recibido de {p.contrato.inquilino.nombre}</p>
          <p className="text-xs text-neutral-500">
            {p.contrato.propiedad.direccion} · {formatMoneda(p.monto, p.contrato.moneda)}
          </p>
        </>
      ),
    })),
    ...ajustesAplicadosRecientes.map((a) => ({
      date: a.fecha,
      node: (
        <>
          <p className="text-sm font-medium text-neutral-900">Ajuste aplicado en {a.contrato.propiedad.direccion}</p>
          <p className="text-xs text-neutral-500">
            {formatMoneda(a.montoAnterior, a.contrato.moneda)} → {formatMoneda(a.montoNuevo, a.contrato.moneda)}
          </p>
        </>
      ),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <section className="animate-scale-in relative overflow-hidden rounded-2xl bg-forest p-5 text-cream sm:p-6">
        <div className="relative z-10 max-w-md">
          <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
          <p className="mt-1 text-sm text-cream/70">{periodoCap}</p>
          <p className="mt-3 text-sm text-cream/90">
            {contratosActivos.length} contratos activos · {propiedadesCount} propiedades · {inquilinosCount} inquilinos
          </p>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-64 opacity-90 sm:block">
          <BuildingIllustration />
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
      </section>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <Link href="/contratos#nuevo-contrato" className={`${quickActionClass} group`} style={{ animationDelay: "0ms" }}>
          <span className={quickActionIconClass}>
            <IconDoc />
          </span>
          <span className="text-xs font-medium text-neutral-700">Nuevo contrato</span>
        </Link>
        <Link href="/propietarios#nueva-propiedad" className={`${quickActionClass} group`} style={{ animationDelay: "60ms" }}>
          <span className={quickActionIconClass}>
            <IconHome />
          </span>
          <span className="text-xs font-medium text-neutral-700">Nueva propiedad</span>
        </Link>
        <Link href="/propietarios#nuevo-propietario" className={`${quickActionClass} group`} style={{ animationDelay: "120ms" }}>
          <span className={quickActionIconClass}>
            <IconUser />
          </span>
          <span className="text-xs font-medium text-neutral-700">Nuevo propietario</span>
        </Link>
        <form action={generarPagosDelMes} className="contents">
          <button type="submit" className={`${quickActionClass} group`} style={{ animationDelay: "180ms" }}>
            <span className={quickActionIconClass}>
              <IconCash />
            </span>
            <span className="text-xs font-medium text-neutral-700">Generar pagos del mes</span>
          </button>
        </form>
        <form action={generarLiquidaciones} className="contents">
          <button type="submit" className={`${quickActionClass} group`} style={{ animationDelay: "240ms" }}>
            <span className={quickActionIconClass}>
              <IconReceipt />
            </span>
            <span className="text-xs font-medium text-neutral-700">Generar liquidaciones</span>
          </button>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<IconDoc />}
          label="Contratos activos"
          value={<AnimatedNumber value={contratosActivos.length} />}
          variant="forest"
          delayMs={0}
        />
        <StatCard
          icon={<IconCash />}
          label="Cobrado este mes"
          value={<AnimatedNumber value={sumCobrado} kind="currency" />}
          sublabel={`${cobrados.length} pagos`}
          variant="forest"
          delayMs={60}
        />
        <StatCard
          icon={<IconClock />}
          label="Pendiente este mes"
          value={<AnimatedNumber value={sumPendiente} kind="currency" />}
          sublabel={`${pendientes.length} pagos`}
          variant="terracotta"
          delayMs={120}
        />
        <StatCard
          icon={<IconAlert />}
          label="Vencido este mes"
          value={<AnimatedNumber value={sumVencido} kind="currency" />}
          sublabel={`${vencidos.length} pagos`}
          variant="clay"
          delayMs={180}
        />
      </section>

      <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="flex flex-col gap-3.5 lg:col-span-2">
          <div id="proximos-ajustes" className="animate-fade-in-up scroll-mt-20 rounded-xl border border-forest/10 bg-white">
            <div className="border-b border-forest/10 px-3.5 py-2.5">
              <h2 className="font-medium text-neutral-900">Próximos ajustes (30 días)</h2>
            </div>
            {proximosAjustes.length === 0 ? (
              <p className="px-3.5 py-5 text-sm text-neutral-500">No hay ajustes pendientes en los próximos 30 días.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
                      <th className="px-3.5 py-2 font-medium">Fecha</th>
                      <th className="px-3.5 py-2 font-medium">Contrato</th>
                      <th className="px-3.5 py-2 font-medium">Índice</th>
                      <th className="px-3.5 py-2 font-medium text-right">Nuevo monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {proximosAjustes.map((a) => (
                      <tr key={a.id} className="transition-colors hover:bg-forest/[0.03]">
                        <td className="px-3.5 py-2.5 text-neutral-500">{formatFecha(a.fecha)}</td>
                        <td className="px-3.5 py-2.5">
                          <Link href={`/contratos/${a.contratoId}`} className="font-medium hover:underline">
                            {a.contrato.propiedad.direccion}
                          </Link>
                          <p className="text-xs text-neutral-500">{a.contrato.inquilino.nombre}</p>
                        </td>
                        <td className="px-3.5 py-2.5 text-neutral-500">{a.contrato.indice}</td>
                        <td className="px-3.5 py-2.5 text-right font-medium">{formatMoneda(a.montoNuevo, a.contrato.moneda)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="animate-fade-in-up rounded-xl border border-forest/10 bg-white" style={{ animationDelay: "80ms" }}>
            <div className="border-b border-forest/10 px-3.5 py-2.5">
              <h2 className="font-medium text-neutral-900">Contratos recientes</h2>
            </div>
            {contratosRecientes.length === 0 ? (
              <p className="px-3.5 py-5 text-sm text-neutral-500">Todavía no hay contratos cargados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
                      <th className="px-3.5 py-2 font-medium">Propiedad</th>
                      <th className="px-3.5 py-2 font-medium">Inquilino</th>
                      <th className="px-3.5 py-2 font-medium">Inicio</th>
                      <th className="px-3.5 py-2 font-medium">Vencimiento</th>
                      <th className="px-3.5 py-2 font-medium text-right">Monto actual</th>
                      <th className="px-3.5 py-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {contratosRecientes.map((c) => {
                      const vigente = c.fechaFin > hoy;
                      return (
                        <tr key={c.id} className="transition-colors hover:bg-forest/[0.03]">
                          <td className="px-3.5 py-2.5">
                            <Link href={`/contratos/${c.id}`} className="font-medium hover:underline">
                              {c.propiedad.direccion}
                            </Link>
                          </td>
                          <td className="px-3.5 py-2.5 text-neutral-500">{c.inquilino.nombre}</td>
                          <td className="px-3.5 py-2.5 text-neutral-500">{formatFecha(c.fechaInicio)}</td>
                          <td className="px-3.5 py-2.5 text-neutral-500">{formatFecha(c.fechaFin)}</td>
                          <td className="px-3.5 py-2.5 text-right font-medium">{formatMoneda(montoActual(c), c.moneda)}</td>
                          <td className="px-3.5 py-2.5">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                vigente ? "bg-forest/10 text-forest" : "bg-neutral-100 text-neutral-500"
                              }`}
                            >
                              {vigente ? "Vigente" : "Vencido"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="animate-fade-in-up rounded-xl border border-forest/10 bg-white p-3.5" style={{ animationDelay: "140ms" }}>
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="font-medium text-neutral-900">Cobranzas del mes</h2>
              <Link href="/cobranzas" className="text-xs text-neutral-500 hover:underline">
                Ver detalle
              </Link>
            </div>
            {totalMes === 0 ? (
              <p className="text-sm text-neutral-500">Todavía no hay pagos generados para {periodoLabel}.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div
                  className="animate-scale-in relative h-28 w-28 shrink-0 rounded-full transition-transform duration-300 hover:scale-105"
                  style={{
                    backgroundImage: `conic-gradient(var(--color-forest) 0% ${pctCobrado}%, var(--color-terracotta) ${pctCobrado}% ${boundary}%, var(--color-clay) ${boundary}% 100%)`,
                  }}
                >
                  <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white text-center">
                    <span className="text-[10px] text-neutral-400">Total</span>
                    <span className="text-sm font-semibold text-neutral-900">{formatMoneda(totalMes)}</span>
                  </div>
                </div>
                <ul className="flex flex-1 flex-col gap-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-neutral-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-forest" /> Cobrado
                    </span>
                    <span className="font-medium">{Math.round(pctCobrado)}%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-neutral-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-terracotta" /> Pendiente
                    </span>
                    <span className="font-medium">{Math.round(pctPendiente)}%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-neutral-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-clay" /> Vencido
                    </span>
                    <span className="font-medium">{Math.round(100 - pctCobrado - pctPendiente)}%</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="animate-fade-in-up rounded-xl border border-forest/10 bg-white" style={{ animationDelay: "40ms" }}>
            <div className="border-b border-forest/10 px-3.5 py-2.5">
              <h2 className="font-medium text-neutral-900">Recordatorios</h2>
            </div>
            <ul className="divide-y divide-neutral-100">
              <li>
                <Link href="#proximos-ajustes" className="group flex items-center gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-forest/5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-forest/10 text-forest transition-transform duration-200 group-hover:scale-110">
                    <IconTrend />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-neutral-900">{proximosAjustes.length} contratos ajustan</p>
                    <p className="text-xs text-neutral-500">En los próximos 30 días</p>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/contratos" className="group flex items-center gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-terracotta/5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta transition-transform duration-200 group-hover:scale-110">
                    <IconClock />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-neutral-900">{contratosPorVencerCount} vencimientos próximos</p>
                    <p className="text-xs text-neutral-500">En los próximos 60 días</p>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/cobranzas" className="group flex items-center gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-clay/5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-clay/10 text-clay transition-transform duration-200 group-hover:scale-110">
                    <IconAlert />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-neutral-900">{pagosVencidosTotal} pagos vencidos</p>
                    <p className="text-xs text-neutral-500">Total histórico</p>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div className="animate-fade-in-up rounded-xl border border-forest/10 bg-white" style={{ animationDelay: "160ms" }}>
            <div className="border-b border-forest/10 px-3.5 py-2.5">
              <h2 className="font-medium text-neutral-900">Actividad reciente</h2>
            </div>
            {actividad.length === 0 ? (
              <p className="px-3.5 py-5 text-sm text-neutral-500">Todavía no hay actividad registrada.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {actividad.map((e, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-forest/[0.03]">
                    {e.node}
                    <span className="shrink-0 text-xs text-neutral-400">{formatFecha(e.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section
        className="animate-fade-in-up grid grid-cols-2 gap-y-4 divide-forest/10 rounded-xl border border-forest/10 bg-white p-3.5 sm:grid-cols-4 sm:divide-x"
        style={{ animationDelay: "200ms" }}
      >
        <div className="flex items-center justify-center gap-3 px-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white">
            <IconHome />
          </span>
          <div>
            <p className="text-lg font-semibold text-neutral-900">
              <AnimatedNumber value={propiedadesCount} />
            </p>
            <p className="text-sm text-neutral-500">Propiedades</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 px-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta text-white">
            <IconUser />
          </span>
          <div>
            <p className="text-lg font-semibold text-neutral-900">
              <AnimatedNumber value={inquilinosCount} />
            </p>
            <p className="text-sm text-neutral-500">Inquilinos</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 px-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay text-white">
            <IconCash />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-neutral-900">
              {Object.entries(totalesPorMoneda).length === 0
                ? formatMoneda(0)
                : Object.entries(totalesPorMoneda)
                    .map(([moneda, monto]) => formatMoneda(monto, moneda as "ARS" | "USD"))
                    .join(" + ")}
            </p>
            <p className="text-sm text-neutral-500">Alquiler mensual cartera</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 px-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-light text-white">
            <IconTrend />
          </span>
          <div>
            <p className="text-lg font-semibold text-neutral-900">{indicesUsados.length ? indicesUsados.join(" · ") : "—"}</p>
            <p className="text-sm text-neutral-500">Índices en uso</p>
          </div>
        </div>
      </section>
    </div>
  );
}
