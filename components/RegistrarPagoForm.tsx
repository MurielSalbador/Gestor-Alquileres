"use client";

import { useState } from "react";
import { IconPlus, IconX } from "@/components/icons";

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15";
const labelClass = "flex flex-col gap-1 text-sm text-neutral-700";

function periodoActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

export function RegistrarPagoForm({
  action,
  contratoId,
  montoSugerido,
}: {
  action: (formData: FormData) => void;
  contratoId: string;
  montoSugerido: number;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex items-center gap-1.5 rounded-lg border border-forest/20 px-3 py-1.5 text-sm font-medium text-forest transition-all duration-200 hover:bg-forest/5"
      >
        <IconPlus />
        Registrar pago
      </button>
    );
  }

  return (
    <form
      action={action}
      onSubmit={() => setOpen(false)}
      className="animate-fade-in-up flex flex-wrap items-end gap-3 rounded-lg border border-forest/20 bg-cream/40 p-3"
    >
      <input type="hidden" name="contratoId" value={contratoId} />
      <label className={labelClass}>
        Período
        <input type="month" name="periodo" required defaultValue={periodoActual()} className={inputClass} />
      </label>
      <label className={labelClass}>
        Monto
        <input type="number" name="monto" required min={0} step="0.01" defaultValue={montoSugerido} className={inputClass} />
      </label>
      <label className={labelClass}>
        Estado
        <select name="estado" defaultValue="pendiente" className={inputClass}>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          <option value="vencido">Vencido</option>
        </select>
      </label>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-forest-light">
          Guardar pago
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <IconX />
        </button>
      </div>
    </form>
  );
}
