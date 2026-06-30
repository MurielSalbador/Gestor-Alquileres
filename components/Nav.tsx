"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconUser } from "@/components/icons";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/contratos", label: "Contratos" },
  { href: "/cobranzas", label: "Cobranzas" },
  { href: "/propietarios", label: "Propietarios" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-forest/10 bg-white">
      <div className="mx-auto flex max-w-[1680px] items-center gap-6 px-6 py-3 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-cream">
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
              <path d="M3 11.5 12 4l9 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-base font-semibold tracking-tight text-forest">Gestor de Alquileres</span>
        </Link>
        <nav className="flex gap-1 text-sm">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  active ? "bg-forest text-cream" : "text-neutral-600 hover:bg-forest/5 hover:text-forest"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-cream">
              <IconUser />
            </span>
            <p className="hidden text-sm font-medium text-neutral-900 sm:block">Mi cuenta</p>
          </div>
        </div>
      </div>
    </header>
  );
}
