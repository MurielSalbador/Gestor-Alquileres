import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { recalcularAjustes, sincronizarYRecalcular } from "@/lib/actions/ajustes";
import { marcarPagado, marcarVencido, marcarPendiente, registrarPago } from "@/lib/actions/pagos";
import { formatFecha, formatMoneda } from "@/lib/format";
import { RegistrarPagoForm } from "@/components/RegistrarPagoForm";
import { IconCash, IconTrend, IconClock, IconRefresh } from "@/components/icons";

const estadoLabel: Record<string, string> = {
  aplicado: "Aplicado",
  pendiente: "Pendiente",
  sin_datos: "Sin datos de índice",
};

const estadoColor: Record<string, string> = {
  aplicado: "text-forest bg-forest/10",
  pendiente: "text-amber-700 bg-amber-50",
  sin_datos: "text-neutral-500 bg-neutral-100",
};

const pagoEstadoColor: Record<string, string> = {
  pagado: "text-forest bg-forest/10",
  pendiente: "text-amber-700 bg-amber-50",
  vencido: "text-clay bg-clay/10",
};

const sectionHeaderIconClass = "flex h-8 w-8 items-center justify-center rounded-lg bg-forest/10 text-forest";

export default async function ContratoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contrato = await prisma.contrato.findUnique({
    where: { id },
    include: {
      propiedad: { include: { propietario: true } },
      inquilino: true,
      garante: true,
      ajustes: { orderBy: { fecha: "asc" } },
      pagos: { orderBy: { periodo: "desc" } },
    },
  });

  if (!contrato) notFound();

  const vigente = contrato.fechaFin > new Date();
  const contratoId = contrato.id;
  const hayAjustesSinDatos = contrato.ajustes.some((a) => a.estado === "sin_datos");
  const ultimoAjusteAplicado = [...contrato.ajustes].reverse().find((a) => a.estado === "aplicado");
  const montoVigente = Number(ultimoAjusteAplicado?.montoNuevo ?? contrato.montoInicial);
  const indiceSinFuenteDeSync = contrato.indice === "CASA_PROPIA";

  async function recalcular() {
    "use server";
    await recalcularAjustes(contratoId);
  }
  async function sincronizar() {
    "use server";
    await sincronizarYRecalcular(contratoId);
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="animate-scale-in rounded-2xl bg-forest p-5 text-cream sm:p-6">
        <Link href="/contratos" className="text-sm text-cream/70 hover:text-cream hover:underline">
          ← Contratos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold sm:text-2xl">{contrato.propiedad.direccion}</h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              vigente ? "bg-white/15 text-cream" : "bg-white/10 text-cream/70"
            }`}
          >
            {vigente ? "Vigente" : "Vencido"}
          </span>
        </div>
        <p className="mt-1 text-sm text-cream/90">
          Propietario: {contrato.propiedad.propietario.nombre} · Inquilino: {contrato.inquilino.nombre}
          {contrato.garante ? ` · Garante: ${contrato.garante.nombre}` : ""}
        </p>
      </section>

      <section className="animate-fade-in-up grid grid-cols-1 gap-3 rounded-xl border border-forest/10 bg-white p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-neutral-500">Monto inicial</p>
          <p className="font-medium text-neutral-900">{formatMoneda(contrato.montoInicial, contrato.moneda)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Índice</p>
          <p className="font-medium text-neutral-900">
            {contrato.indice} cada {contrato.frecuenciaMeses} {contrato.frecuenciaMeses === 1 ? "mes" : "meses"}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Vigencia</p>
          <p className="font-medium text-neutral-900">
            {formatFecha(contrato.fechaInicio)} – {formatFecha(contrato.fechaFin)}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Comisión administración</p>
          <p className="font-medium text-neutral-900">{Number(contrato.comisionPct)}%</p>
        </div>
      </section>

      <section className="animate-fade-in-up rounded-xl border border-forest/10 bg-white" style={{ animationDelay: "40ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-forest/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className={sectionHeaderIconClass}>
              <IconTrend />
            </span>
            <h2 className="font-medium text-neutral-900">Línea de tiempo de ajustes</h2>
          </div>
          <div className="flex gap-2">
            <form action={recalcular}>
              <button
                type="submit"
                className="rounded-lg border border-forest/20 px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest/5"
              >
                Recalcular
              </button>
            </form>
            <form action={sincronizar}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-forest px-3 py-1.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light"
              >
                <IconRefresh />
                Sincronizar y recalcular
              </button>
            </form>
          </div>
        </div>
        <p className="border-b border-forest/10 bg-cream/40 px-4 py-2 text-xs text-neutral-500">
          Los ajustes se calculan automáticamente a partir de la serie de índices ({contrato.indice}) guardada en el
          sistema — no se cargan a mano. &quot;Recalcular&quot; usa los datos ya guardados; &quot;Sincronizar y
          recalcular&quot; primero baja la serie oficial del BCRA y después recalcula.
        </p>
        {hayAjustesSinDatos ? (
          <p className="border-b border-forest/10 bg-amber-50 px-4 py-2 text-xs text-amber-700">
            {indiceSinFuenteDeSync
              ? 'El índice Casa Propia todavía no tiene una fuente de sincronización automática en este sistema (solo ICL y IPC se sincronizan solos) — "Sincronizar y recalcular" no va a traer datos nuevos para este contrato hasta que se cargue esa serie.'
              : 'Hay ajustes sin datos de índice todavía publicados. Probá "Sincronizar y recalcular".'}
          </p>
        ) : null}
        {contrato.ajustes.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">
            Todavía no se calculó ningún ajuste. Tocá &quot;Recalcular&quot; o &quot;Sincronizar y recalcular&quot;.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {contrato.ajustes.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-forest/[0.03]">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900">{formatFecha(a.fecha)}</p>
                  <p className="text-neutral-500">
                    coeficiente {Number(a.coeficiente).toFixed(4)} ·{" "}
                    {formatMoneda(a.montoAnterior, contrato.moneda)} → {formatMoneda(a.montoNuevo, contrato.moneda)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${estadoColor[a.estado]}`}>
                  {estadoLabel[a.estado]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="animate-fade-in-up rounded-xl border border-forest/10 bg-white" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center justify-between gap-2.5 border-b border-forest/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className={sectionHeaderIconClass}>
              <IconCash />
            </span>
            <h2 className="font-medium text-neutral-900">Pagos</h2>
          </div>
          <div className="flex items-center gap-3">
            <RegistrarPagoForm action={registrarPago} contratoId={contrato.id} montoSugerido={montoVigente} />
            <Link
              href={`/cobranzas?contratoId=${contrato.id}`}
              className="text-sm font-medium text-forest hover:underline"
            >
              Ver en Cobranzas →
            </Link>
          </div>
        </div>
        {contrato.pagos.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">
            Todavía no hay pagos registrados. Usá &quot;Registrar pago&quot; arriba para cargar uno para un período
            específico, o generá el del mes actual para todos los contratos vigentes desde{" "}
            <Link href="/cobranzas" className="font-medium text-forest hover:underline">
              Cobranzas
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {contrato.pagos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-forest/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-forest/10 text-forest">
                    <IconClock />
                  </span>
                  <div>
                    <p className="text-neutral-900">{formatFecha(p.periodo)}</p>
                    {p.fechaPago ? <p className="text-xs text-neutral-500">Pagado el {formatFecha(p.fechaPago)}</p> : null}
                  </div>
                </div>
                <p className="font-medium text-neutral-900">{formatMoneda(p.monto, contrato.moneda)}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${pagoEstadoColor[p.estado]}`}>
                  {p.estado}
                </span>
                <div className="flex shrink-0 gap-2">
                  {p.estado !== "pagado" ? (
                    <form action={marcarPagado}>
                      <input type="hidden" name="pagoId" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-forest/20 px-2.5 py-1 text-xs font-medium text-forest transition-colors hover:bg-forest/5"
                      >
                        Marcar pagado
                      </button>
                    </form>
                  ) : (
                    <form action={marcarPendiente}>
                      <input type="hidden" name="pagoId" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                      >
                        Revertir a pendiente
                      </button>
                    </form>
                  )}
                  {p.estado === "pendiente" ? (
                    <form action={marcarVencido}>
                      <input type="hidden" name="pagoId" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-clay/30 px-2.5 py-1 text-xs font-medium text-clay transition-colors hover:bg-clay/5"
                      >
                        Marcar vencido
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
