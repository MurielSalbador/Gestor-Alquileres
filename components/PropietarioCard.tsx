"use client";

import { useState } from "react";
import { IconChevronDown, IconHome, IconReceipt } from "@/components/icons";
import { formatMoneda, formatPeriodo } from "@/lib/format";

export type PropietarioCardData = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  propiedades: { id: string; direccion: string; tipo: string }[];
  liquidaciones: { id: string; periodo: string; bruto: number; comision: number; neto: number }[];
};

const avatarVariants = ["bg-forest", "bg-terracotta", "bg-clay", "bg-forest-light"];

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function PropietarioCard({ propietario, index }: { propietario: PropietarioCardData; index: number }) {
  const [open, setOpen] = useState(false);
  const avatarColor = avatarVariants[index % avatarVariants.length];
  const totalNeto = propietario.liquidaciones.reduce((acc, l) => acc + l.neto, 0);

  return (
    <div
      className="animate-fade-in-up overflow-hidden rounded-xl border border-forest/10 bg-white transition-shadow duration-200 hover:shadow-md hover:shadow-forest/5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-forest/[0.03]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-cream ${avatarColor}`}>
            {iniciales(propietario.nombre)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">{propietario.nombre}</p>
            <p className="truncate text-xs text-neutral-500">
              {propietario.email ? propietario.email : "Sin email"}
              {propietario.telefono ? ` · ${propietario.telefono}` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-1 text-xs font-medium text-forest">
            <IconHome />
            {propietario.propiedades.length} {propietario.propiedades.length === 1 ? "propiedad" : "propiedades"}
          </span>
          {totalNeto > 0 && (
            <span className="hidden rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-neutral-600 sm:inline-flex">
              {formatMoneda(totalNeto)} liquidado
            </span>
          )}
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-transform duration-300 ${open ? "rotate-180 bg-forest/10 text-forest" : ""}`}>
            <IconChevronDown />
          </span>
        </div>
      </button>

      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="border-t border-forest/10 px-4 py-3.5">
            {propietario.propiedades.length > 0 && (
              <div className="mb-3.5 flex flex-wrap gap-1.5">
                {propietario.propiedades.map((p) => (
                  <span
                    key={p.id}
                    className="flex items-center gap-1.5 rounded-lg border border-forest/10 bg-cream/50 px-2.5 py-1.5 text-xs text-neutral-700"
                  >
                    <IconHome />
                    {p.direccion}
                  </span>
                ))}
              </div>
            )}

            {propietario.liquidaciones.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-neutral-500">
                <IconReceipt />
                Sin liquidaciones generadas todavía.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {propietario.liquidaciones.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-forest/[0.03]"
                  >
                    <span className="font-medium text-neutral-900">{formatPeriodo(new Date(l.periodo))}</span>
                    <span className="text-xs text-neutral-500">bruto {formatMoneda(l.bruto)}</span>
                    <span className="text-xs text-neutral-500">comisión {formatMoneda(l.comision)}</span>
                    <span className="font-medium text-forest">neto {formatMoneda(l.neto)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
