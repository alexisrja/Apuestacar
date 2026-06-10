"use client";

import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

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

  const units = [
    { label: "DÍAS", value: timeLeft?.days },
    { label: "HORAS", value: timeLeft?.hours },
    { label: "MINUTOS", value: timeLeft?.minutes },
    { label: "SEGUNDOS", value: timeLeft?.seconds },
  ];

  return (
    <div className="flex gap-3 sm:gap-6">
      {units.map((unit, i) => {
        const display =
          unit.value === undefined
            ? "--"
            : String(unit.value).padStart(2, "0");
        return (
          <div
            key={unit.label}
            className="countdown-cell flex flex-col items-center"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="card-neon flex h-16 w-16 items-center justify-center overflow-hidden sm:h-20 sm:w-20">
              <span
                key={display}
                className="digit-roll font-heading text-xl text-white glow-text sm:text-2xl"
              >
                {display}
              </span>
            </div>
            <span className="mt-1 font-body text-xs text-secondary">
              {unit.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
