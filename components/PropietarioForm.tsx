"use client";

import { useState } from "react";
import { IconUser, IconCheck } from "@/components/icons";

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15";
const labelClass = "flex flex-col gap-1 text-sm text-neutral-700";

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function PropietarioForm({ action }: { action: (formData: FormData) => void }) {
  const [nombre, setNombre] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      action={action}
      onSubmit={() => {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 1200);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="tipo" value="DUENO" />
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-cream transition-transform duration-300 ${
            nombre ? "scale-105" : "scale-100"
          }`}
        >
          {iniciales(nombre)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-900">{nombre || "Nuevo propietario"}</p>
          <p className="text-xs text-neutral-500">Así se verá en la lista</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Nombre
          <input
            name="nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
            placeholder="María Gómez"
          />
        </label>
        <label className={labelClass}>
          Email
          <input type="email" name="email" className={inputClass} placeholder="maria@example.com" />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Teléfono
          <input name="telefono" className={inputClass} placeholder="11 1234-5678" />
        </label>
      </div>

      <button
        type="submit"
        className="group flex w-fit items-center gap-2 self-start rounded-lg bg-forest px-5 py-2.5 text-sm font-medium text-cream transition-all duration-200 hover:bg-forest-light hover:shadow-lg hover:shadow-forest/20 active:scale-95"
      >
        {submitted ? <IconCheck /> : <IconUser />}
        Agregar propietario
      </button>
    </form>
  );
}
