"use client";

import { useState } from "react";

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15";
const labelClass = "flex flex-col gap-1 text-sm text-neutral-700";

const tipos = [
  { value: "INQUILINO", label: "Inquilino" },
  { value: "GARANTE", label: "Garante" },
] as const;

export function PersonaForm({ action }: { action: (formData: FormData) => void }) {
  const [tipo, setTipo] = useState<(typeof tipos)[number]["value"]>("INQUILINO");

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Nombre
          <input name="nombre" required className={inputClass} />
        </label>
        <div className={labelClass}>
          Tipo
          <div className="grid grid-cols-2 gap-1.5">
            {tipos.map((t) => (
              <label key={t.value}>
                <input
                  type="radio"
                  name="tipo"
                  value={t.value}
                  checked={tipo === t.value}
                  onChange={() => setTipo(t.value)}
                  className="peer sr-only"
                />
                <span className="block cursor-pointer rounded-lg border border-neutral-300 px-3 py-2 text-center text-sm font-medium text-neutral-600 transition-colors peer-checked:border-forest peer-checked:bg-forest peer-checked:text-cream peer-focus-visible:ring-2 peer-focus-visible:ring-forest/30">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        <label className={labelClass}>
          Email
          <input type="email" name="email" className={inputClass} />
        </label>
        <label className={labelClass}>
          Teléfono
          <input name="telefono" className={inputClass} />
        </label>
      </div>
      <button
        type="submit"
        className="self-start rounded-lg border border-forest/20 px-5 py-2.5 text-sm font-medium text-forest transition-colors hover:bg-forest/5"
      >
        Agregar persona
      </button>
    </form>
  );
}
