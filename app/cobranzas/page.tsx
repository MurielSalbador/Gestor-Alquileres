import Link from "next/link";
import { prisma } from "@/lib/db";
import { marcarPagado, marcarVencido, generarPagosDelMes } from "@/lib/actions/pagos";
import { formatFecha, formatMoneda, formatPeriodo } from "@/lib/format";
import { IconCash, IconCard, IconHome, IconSearch, IconCheck } from "@/components/icons";
import type { EstadoPago } from "@prisma/client";

const ESTADOS: EstadoPago[] = ["pendiente", "pagado", "vencido"];

const estadoLabel: Record<EstadoPago, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  vencido: "Vencido",
};

const estadoBadgeColor: Record<EstadoPago, string> = {
  pagado: "text-forest bg-forest/10",
  pendiente: "text-terracotta bg-terracotta/10",
  vencido: "text-clay bg-clay/10",
};

const estadoIconColor: Record<EstadoPago, string> = {
  pagado: "bg-forest/10 text-forest",
  pendiente: "bg-terracotta/10 text-terracotta",
  vencido: "bg-clay/10 text-clay",
};

function buildHref(params: { q?: string; estado?: string; contratoId?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.estado) sp.set("estado", params.estado);
  if (params.contratoId) sp.set("contratoId", params.contratoId);
  const qs = sp.toString();
  return qs ? `/cobranzas?${qs}` : "/cobranzas";
}

export default async function CobranzasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; contratoId?: string; generados?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const estado = sp.estado && (ESTADOS as string[]).includes(sp.estado) ? (sp.estado as EstadoPago) : undefined;
  const contratoId = sp.contratoId || undefined;
  const hayFiltros = Boolean(q || estado || contratoId);
  const generados = sp.generados !== undefined ? Number(sp.generados) : undefined;

  const baseWhere = {
    ...(contratoId ? { contratoId } : {}),
    ...(q
      ? {
          OR: [
            { contrato: { propiedad: { direccion: { contains: q, mode: "insensitive" as const } } } },
            { contrato: { inquilino: { nombre: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [pagos, contratosOptions, estadoGroups] = await Promise.all([
    prisma.pago.findMany({
      where: { ...baseWhere, ...(estado ? { estado } : {}) },
      orderBy: [{ periodo: "desc" }, { estado: "asc" }],
      include: { contrato: { include: { propiedad: true, inquilino: true } } },
    }),
    prisma.contrato.findMany({
      orderBy: { propiedad: { direccion: "asc" } },
      include: { propiedad: true, inquilino: true },
    }),
    prisma.pago.groupBy({ by: ["estado"], where: baseWhere, _count: { _all: true } }),
  ]);

  const counts: Record<EstadoPago, number> = { pendiente: 0, pagado: 0, vencido: 0 };
  for (const g of estadoGroups) counts[g.estado] = g._count._all;
  const total = counts.pendiente + counts.pagado + counts.vencido;

  const tabs: { label: string; estado?: EstadoPago; count: number }[] = [
    { label: "Todos", count: total },
    { label: estadoLabel.pendiente, estado: "pendiente", count: counts.pendiente },
    { label: estadoLabel.pagado, estado: "pagado", count: counts.pagado },
    { label: estadoLabel.vencido, estado: "vencido", count: counts.vencido },
  ];

  return (
    <div className="flex flex-col gap-5">
      <section className="animate-scale-in flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest/10 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-forest/10 text-forest">
            <IconCash />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Cobranzas</h1>
            <p className="text-sm text-neutral-500">
              {total} {total === 1 ? "pago registrado" : "pagos registrados"}
            </p>
          </div>
        </div>
        <form action={generarPagosDelMes}>
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="estado" value={estado ?? ""} />
          <input type="hidden" name="contratoId" value={contratoId ?? ""} />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light"
          >
            <IconCard />
            Generar pagos del mes
          </button>
        </form>
      </section>

      {generados !== undefined && (
        <section
          className={`animate-fade-in-up flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            generados > 0 ? "border-forest/20 bg-forest/5 text-forest" : "border-neutral-200 bg-neutral-50 text-neutral-600"
          }`}
        >
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${generados > 0 ? "bg-forest/15" : "bg-neutral-200"}`}>
            <IconCheck />
          </span>
          {generados > 0
            ? `Se ${generados === 1 ? "generó" : "generaron"} ${generados} ${generados === 1 ? "pago nuevo" : "pagos nuevos"} para el período actual.`
            : "Ya estaban generados todos los pagos del período actual — no había nada nuevo para crear."}
        </section>
      )}

      <section className="animate-fade-in-up rounded-xl border border-forest/10 bg-white" style={{ animationDelay: "40ms" }}>
        <div className="flex flex-col gap-3 border-b border-forest/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <form action="/cobranzas" className="flex flex-1 flex-wrap items-center gap-2">
            <input type="hidden" name="estado" value={estado ?? ""} />
            <div className="relative min-w-[220px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <IconSearch />
              </span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar por dirección o inquilino..."
                className="w-full rounded-lg border border-neutral-200 bg-cream/40 py-2 pl-9 pr-3 text-sm text-neutral-900 outline-none transition-colors focus:border-forest/40"
              />
            </div>
            <select
              name="contratoId"
              defaultValue={contratoId ?? ""}
              className="rounded-lg border border-neutral-200 bg-cream/40 py-2 px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-forest/40"
            >
              <option value="">Todos los contratos</option>
              {contratosOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.propiedad.direccion} · {c.inquilino.nombre}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-forest/20 px-3 py-2 text-sm font-medium text-forest transition-colors hover:bg-forest/5"
            >
              Buscar
            </button>
            {hayFiltros && (
              <Link
                href="/cobranzas"
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50"
              >
                Limpiar
              </Link>
            )}
          </form>
        </div>
        <div className="flex flex-wrap gap-1.5 border-b border-forest/10 px-4 py-2.5">
          {tabs.map((t) => {
            const active = estado === t.estado;
            return (
              <Link
                key={t.label}
                href={buildHref({ q, contratoId, estado: t.estado })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "bg-forest text-cream" : "bg-cream/60 text-neutral-600 hover:bg-forest/10 hover:text-forest"
                }`}
              >
                {t.label} · {t.count}
              </Link>
            );
          })}
        </div>

        {pagos.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">
            {hayFiltros
              ? "No se encontraron pagos con esos filtros."
              : 'Todavía no hay pagos. Tocá "Generar pagos del mes" para crear el período actual de cada contrato vigente.'}
          </p>
        ) : (
          <div>
            <div className="hidden grid-cols-[1fr_140px_160px_220px] gap-4 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-400 sm:grid">
              <span>Contrato / Inquilino</span>
              <span>Monto</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            <ul className="divide-y divide-neutral-100">
              {pagos.map((p) => (
                <li
                  key={p.id}
                  className="grid grid-cols-1 items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-forest/[0.03] sm:grid-cols-[1fr_140px_160px_220px] sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${estadoIconColor[p.estado]}`}>
                      <IconHome />
                    </span>
                    <div className="min-w-0">
                      <Link href={`/contratos/${p.contratoId}`} className="truncate font-medium text-neutral-900 hover:underline">
                        {p.contrato.propiedad.direccion}
                      </Link>
                      <p className="truncate text-neutral-500">
                        {p.contrato.inquilino.nombre} · {formatPeriodo(p.periodo)}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-neutral-900">{formatMoneda(p.monto, p.contrato.moneda)}</p>
                  <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${estadoBadgeColor[p.estado]}`}>
                    {p.estado}
                    {p.fechaPago ? ` · ${formatFecha(p.fechaPago)}` : ""}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    {p.estado !== "pagado" && (
                      <>
                        <form action={marcarPagado}>
                          <input type="hidden" name="pagoId" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-forest/20 px-2.5 py-1 text-xs font-medium text-forest transition-colors hover:bg-forest/5"
                          >
                            Marcar pagado
                          </button>
                        </form>
                        {p.estado === "pendiente" && (
                          <form action={marcarVencido}>
                            <input type="hidden" name="pagoId" value={p.id} />
                            <button
                              type="submit"
                              className="rounded-lg border border-clay/30 px-2.5 py-1 text-xs font-medium text-clay transition-colors hover:bg-clay/5"
                            >
                              Marcar vencido
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
