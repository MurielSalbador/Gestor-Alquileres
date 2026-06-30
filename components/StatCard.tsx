import type { ReactNode } from "react";

const variants = {
  forest: "bg-forest/10 text-forest",
  terracotta: "bg-terracotta/10 text-terracotta",
  clay: "bg-clay/10 text-clay",
  neutral: "bg-neutral-100 text-neutral-700",
};

export function StatCard({
  icon,
  label,
  value,
  sublabel,
  variant = "neutral",
  delayMs = 0,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sublabel?: string;
  variant?: keyof typeof variants;
  delayMs?: number;
}) {
  return (
    <div
      className="animate-fade-in-up flex items-center gap-2.5 rounded-xl border border-forest/10 bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest/5"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${variants[variant]}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-tight text-neutral-900">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
        {sublabel ? <p className="text-[11px] text-neutral-400">{sublabel}</p> : null}
      </div>
    </div>
  );
}
