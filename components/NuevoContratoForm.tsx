"use client";

import { useState } from "react";
import { IconUser, IconCash, IconTrend } from "@/components/icons";
import { SegmentedRadio } from "@/components/SegmentedRadio";

type PropiedadOption = { id: string; direccion: string; propietario: { nombre: string } };
type PersonaOption = { id: string; nombre: string };

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15";
const labelClass = "flex flex-col gap-1 text-sm text-neutral-700";
const fieldsetClass = "flex flex-col gap-3 rounded-xl border border-forest/10 bg-cream/50 p-4";
const legendClass = "mb-1 flex items-center gap-2 text-sm font-semibold text-forest";
const pillIconClass = "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-forest/10 text-forest";

const indices = [
  { value: "ICL", label: "ICL (BCRA)" },
  { value: "IPC", label: "IPC (INDEC)" },
  { value: "CASA_PROPIA", label: "Casa Propia" },
  { value: "FIJO", label: "% Fijo" },
] as const;

export function NuevoContratoForm({
  action,
  propiedades,
  inquilinos,
  garantes,
}: {
  action: (formData: FormData) => void;
  propiedades: PropiedadOption[];
  inquilinos: PersonaOption[];
  garantes: PersonaOption[];
}) {
  const [moneda, setMoneda] = useState<"ARS" | "USD">("ARS");
  const [indice, setIndice] = useState<(typeof indices)[number]["value"]>("ICL");

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>
            <span className={pillIconClass}>
              <IconUser />
            </span>
            Partes del contrato
          </legend>
          <label className={labelClass}>
            Propiedad
            <select name="propiedadId" required className={inputClass}>
              {propiedades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.direccion} ({p.propietario.nombre})
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Inquilino
            <select name="inquilinoId" required className={inputClass}>
              {inquilinos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Garante (opcional)
            <select name="garanteId" className={inputClass}>
              <option value="">—</option>
              {garantes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>
            <span className={pillIconClass}>
              <IconCash />
            </span>
            Montos y moneda
          </legend>
          <div className={labelClass}>
            Moneda
            <SegmentedRadio
              name="moneda"
              value={moneda}
              onChange={setMoneda}
              options={[
                { value: "ARS", label: "ARS" },
                { value: "USD", label: "USD" },
              ]}
            />
          </div>
          <label className={labelClass}>
            Monto inicial
            <input type="number" name="montoInicial" required min={0} step="0.01" className={inputClass} />
          </label>
          <label className={labelClass}>
            Día de pago
            <input type="number" name="diaPago" defaultValue={10} min={1} max={28} className={inputClass} />
          </label>
          <label className={labelClass}>
            Comisión de administración (%)
            <input type="number" name="comisionPct" step="0.01" defaultValue={5} className={inputClass} />
          </label>
        </fieldset>

        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>
            <span className={pillIconClass}>
              <IconTrend />
            </span>
            Vigencia y ajuste
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Fecha de inicio
              <input type="date" name="fechaInicio" required className={inputClass} />
            </label>
            <label className={labelClass}>
              Fecha de fin
              <input type="date" name="fechaFin" required className={inputClass} />
            </label>
          </div>
          <div className={labelClass}>
            Índice de ajuste
            <SegmentedRadio name="indice" value={indice} onChange={setIndice} options={indices} cols={2} />
          </div>
          <label className={labelClass}>
            Frecuencia de ajuste (meses)
            <input type="number" name="frecuenciaMeses" required min={1} defaultValue={3} className={inputClass} />
          </label>
          {indice === "FIJO" ? (
            <label className={labelClass}>
              % fijo por ajuste
              <input type="number" name="porcentajeFijo" step="0.01" required className={inputClass} />
            </label>
          ) : null}
        </fieldset>
      </div>

      <button
        type="submit"
        className="self-start rounded-lg bg-forest px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light"
      >
        Crear contrato
      </button>
    </form>
  );
}
