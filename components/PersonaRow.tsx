"use client";

import { useState } from "react";
import { IconPencil, IconTrash, IconX } from "@/components/icons";
import { SegmentedRadio } from "@/components/SegmentedRadio";

export type PersonaRowData = {
  id: string;
  nombre: string;
  tipo: "INQUILINO" | "GARANTE";
  email: string | null;
  telefono: string | null;
  contratosCount: number;
};

const tipoOptions = [
  { value: "INQUILINO", label: "Inquilino" },
  { value: "GARANTE", label: "Garante" },
] as const;

const tipoBadgeClass: Record<PersonaRowData["tipo"], string> = {
  INQUILINO: "bg-forest/10 text-forest",
  GARANTE: "bg-terracotta/10 text-terracotta",
};

const avatarClass: Record<PersonaRowData["tipo"], string> = {
  INQUILINO: "bg-forest",
  GARANTE: "bg-terracotta",
};

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15";

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function PersonaRow({
  persona,
  actualizarAction,
  eliminarAction,
}: {
  persona: PersonaRowData;
  actualizarAction: (formData: FormData) => void;
  eliminarAction: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tipo, setTipo] = useState<PersonaRowData["tipo"]>(persona.tipo);

  if (editing) {
    return (
      <form
        action={actualizarAction}
        onSubmit={() => setEditing(false)}
        className="animate-fade-in-up flex flex-col gap-2.5 rounded-lg border border-forest/20 bg-cream/40 p-3"
      >
        <input type="hidden" name="id" value={persona.id} />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <input name="nombre" defaultValue={persona.nombre} required placeholder="Nombre" className={inputClass} />
          <input type="email" name="email" defaultValue={persona.email ?? ""} placeholder="Email" className={inputClass} />
          <input name="telefono" defaultValue={persona.telefono ?? ""} placeholder="Teléfono" className={inputClass} />
          <SegmentedRadio name="tipo" value={tipo} onChange={setTipo} options={tipoOptions} cols={2} />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-forest px-3 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-forest-light"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <IconX />
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-forest/[0.03]">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-cream ${avatarClass[persona.tipo]}`}>
          {iniciales(persona.nombre)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{persona.nombre}</p>
          <p className="truncate text-xs text-neutral-500">
            {persona.email ?? "Sin email"}
            {persona.telefono ? ` · ${persona.telefono}` : ""}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tipoBadgeClass[persona.tipo]}`}>
          {persona.tipo === "INQUILINO" ? "Inquilino" : "Garante"}
        </span>
        {persona.contratosCount > 0 && (
          <span className="hidden text-xs text-neutral-400 sm:inline">
            {persona.contratosCount} {persona.contratosCount === 1 ? "contrato" : "contratos"}
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Editar"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-forest/10 hover:text-forest"
        >
          <IconPencil />
        </button>
        {persona.contratosCount === 0 ? (
          <form action={eliminarAction}>
            <input type="hidden" name="id" value={persona.id} />
            <button
              type="submit"
              title="Eliminar"
              onClick={(e) => {
                if (!confirm(`¿Eliminar a ${persona.nombre}?`)) e.preventDefault();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-clay/10 hover:text-clay"
            >
              <IconTrash />
            </button>
          </form>
        ) : (
          <span
            title="No se puede eliminar: tiene contratos asociados"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-300"
          >
            <IconTrash />
          </span>
        )}
      </div>
    </div>
  );
}
