"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Sorteo } from "@/app/data/sorteos";
import SorteoModal from "@/components/sorteo-modal";

export default function SorteoSlider({ sorteos }: { sorteos: Sorteo[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Sorteo | null>(null);

  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label="Anterior"
        className="absolute -left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 text-white backdrop-blur-md transition-all hover:border-primary hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] sm:flex"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label="Siguiente"
        className="absolute -right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 text-white backdrop-blur-md transition-all hover:border-primary hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] sm:flex"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-4"
      >
        {sorteos.map((sorteo) => {
          const pct = Math.round(
            (sorteo.vendidos / sorteo.totalBoletos) * 100,
          );
          return (
            <div
              key={sorteo.id}
              data-card
              className="card-neon flex w-[280px] flex-shrink-0 snap-center flex-col p-6 sm:w-[320px]"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-full border border-border bg-muted/50 px-3 py-1 font-heading text-xs text-secondary">
                  SORTEO #{sorteo.numero}
                </span>
                {sorteo.destacado && (
                  <span className="rounded-full bg-accent/20 px-3 py-1 font-heading text-xs text-accent">
                    DESTACADO
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4">
                <span className="text-4xl" aria-hidden="true">
                  {sorteo.emoji}
                </span>
                <div>
                  <h3 className="font-heading text-lg leading-tight text-white">
                    {sorteo.premio}
                  </h3>
                  <p className="font-body text-xs text-secondary">
                    {sorteo.titulo}
                  </p>
                </div>
              </div>

              <p className="mt-3 font-heading text-2xl text-accent glow-text">
                {sorteo.valor}
              </p>

              <div className="mt-4">
                <div className="flex justify-between font-body text-xs text-secondary">
                  <span>{pct}% vendido</span>
                  <span>{sorteo.fechaLabel}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActive(sorteo)}
                  className="btn-outline flex-1 text-center text-sm !py-2.5"
                >
                  Ver Detalles
                </button>
                <Link
                  href={`/boletos/${sorteo.id}/comprar`}
                  className="btn-accent flex-1 text-center text-sm !py-2.5"
                >
                  Comprar
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <SorteoModal sorteo={active} onClose={() => setActive(null)} />
    </div>
  );
}
