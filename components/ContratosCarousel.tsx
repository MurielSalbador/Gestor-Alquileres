"use client";

import { useRef } from "react";
import Link from "next/link";
import { IconHome, IconChevronLeft, IconChevronRight } from "@/components/icons";

export type ContratoCard = {
  id: string;
  direccion: string;
  inquilino: string;
  indice: string;
  frecuenciaMeses: number;
  venceLabel: string;
  montoLabel: string;
  vigente: boolean;
};

const navButtonClass =
  "absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-forest/10 bg-white p-2 text-forest shadow-md transition-colors hover:bg-forest/5 sm:flex";

export function ContratosCarousel({ contratos }: { contratos: ContratoCard[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  }

  return (
    <div className="group relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {contratos.map((c) => (
          <Link
            key={c.id}
            href={`/contratos/${c.id}`}
            className="flex w-72 shrink-0 snap-start flex-col gap-2 rounded-xl border border-forest/10 p-3.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-forest/30 hover:shadow-lg hover:shadow-forest/5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest/10 text-forest">
                <IconHome />
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  c.vigente ? "bg-forest/10 text-forest" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {c.vigente ? "Vigente" : "Vencido"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-neutral-900">{c.direccion}</p>
              <p className="truncate text-neutral-500">
                {c.inquilino} · {c.indice} cada {c.frecuenciaMeses}m
              </p>
              <p className="mt-1 text-neutral-500">Vence {c.venceLabel}</p>
              <p className="mt-1 font-medium text-neutral-900">{c.montoLabel}</p>
            </div>
          </Link>
        ))}
      </div>

      <button type="button" aria-label="Ver contratos anteriores" onClick={() => scroll(-1)} className={`${navButtonClass} left-1`}>
        <IconChevronLeft />
      </button>
      <button type="button" aria-label="Ver más contratos" onClick={() => scroll(1)} className={`${navButtonClass} right-1`}>
        <IconChevronRight />
      </button>
    </div>
  );
}
