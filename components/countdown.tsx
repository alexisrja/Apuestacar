"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const UNIDADES = [
  { key: "days", label: "días" },
  { key: "hours", label: "horas" },
  { key: "minutes", label: "min" },
  { key: "seconds", label: "seg" },
] as const;

export default function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const calcTimeLeft = (): TimeLeft => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    // First value is computed client-side only (avoids SSR hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(calcTimeLeft());
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    // Una sola pieza de material dividida por pelos, en vez de cuatro cajas
    // sueltas: el tiempo es un dato, no cuatro.
    <div
      className="card inline-grid grid-cols-4 divide-x divide-border overflow-hidden"
      aria-label="Tiempo restante para el sorteo"
    >
      {UNIDADES.map(({ key, label }) => {
        const valor = timeLeft?.[key];
        const display =
          valor === undefined ? "--" : String(valor).padStart(2, "0");
        return (
          <div key={key} className="px-4 py-3 text-center sm:px-6 sm:py-4">
            <span
              key={display}
              className="num digit-roll block text-2xl font-medium text-white sm:text-3xl"
            >
              {display}
            </span>
            <span className="mt-1 block text-[0.6875rem] text-secondary">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
