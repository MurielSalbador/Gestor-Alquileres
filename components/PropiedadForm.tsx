"use client";

import { useState } from "react";
import { IconHome } from "@/components/icons";
import { SegmentedRadio } from "@/components/SegmentedRadio";

type PropietarioOption = { id: string; nombre: string };

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15";
const labelClass = "flex flex-col gap-1 text-sm text-neutral-700";

const tipos = [
  { value: "DEPARTAMENTO", label: "Departamento" },
  { value: "CASA", label: "Casa" },
  { value: "LOCAL", label: "Local" },
  { value: "OFICINA", label: "Oficina" },
  { value: "OTRO", label: "Otro" },
] as const;

export function PropiedadForm({
  action,
  propietarios,
}: {
  action: (formData: FormData) => void;
  propietarios: PropietarioOption[];
}) {
  const [tipo, setTipo] = useState<(typeof tipos)[number]["value"]>("DEPARTAMENTO");

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={labelClass}>
        Dirección
        <input name="direccion" required className={inputClass} placeholder="Av. Corrientes 1234, CABA" />
      </label>

      <div className={labelClass}>
        Tipo de propiedad
        <SegmentedRadio name="tipo" value={tipo} onChange={setTipo} options={tipos} cols={3} />
      </div>

      <label className={labelClass}>
        Propietario
        <select name="propietarioId" required className={inputClass}>
          {propietarios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="group flex w-fit items-center gap-2 self-start rounded-lg bg-forest px-5 py-2.5 text-sm font-medium text-cream transition-all duration-200 hover:bg-forest-light hover:shadow-lg hover:shadow-forest/20 active:scale-95"
      >
        <IconHome />
        Agregar propiedad
      </button>
    </form>
  );
}
