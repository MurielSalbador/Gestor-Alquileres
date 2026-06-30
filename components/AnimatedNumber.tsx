"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  kind = "number",
  moneda = "ARS",
  durationMs = 700,
}: {
  value: number;
  kind?: "number" | "currency";
  moneda?: "ARS" | "USD";
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const start = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, durationMs]);

  const rounded = Math.round(display);

  if (kind === "currency") {
    return <>{new Intl.NumberFormat("es-AR", { style: "currency", currency: moneda }).format(rounded)}</>;
  }
  return <>{new Intl.NumberFormat("es-AR").format(rounded)}</>;
}
