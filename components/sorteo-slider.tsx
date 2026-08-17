"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Sorteo } from "@/app/data/sorteos";
import Meter from "@/components/meter";
import PremioPlaca from "@/components/premio-placa";
import SorteoModal from "@/components/sorteo-modal";

function Arrow({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Sorteo anterior" : "Sorteo siguiente"}
      className={`glass absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition-colors hover:bg-surface-hover sm:flex ${
        dir === "prev" ? "-left-3" : "-right-3"
      }`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}

export default function SorteoSlider({ sorteos }: { sorteos: Sorteo[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<Sorteo | null>(null);

  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 20 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <Arrow dir="prev" onClick={() => scrollByCard(-1)} />
      <Arrow dir="next" onClick={() => scrollByCard(1)} />

      <ul
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
      >
        {sorteos.map((sorteo) => (
          <li
            key={sorteo.id}
            data-card
            className="card card-hover flex w-[276px] flex-shrink-0 snap-start flex-col overflow-hidden sm:w-[320px]"
          >
            <div className="zoom-marco relative aspect-[16/10] bg-muted">
              {sorteo.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sorteo.imagen}
                  alt={sorteo.premio}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
<PremioPlaca titulo={sorteo.titulo} valor={sorteo.valor} />
              )}
              {sorteo.destacado && (
                <span className="glass absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium text-white">
                  Destacado
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              <p className="eyebrow">
                {[`Sorteo ${sorteo.numero}`, sorteo.fechaLabel]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <h3 className="h-section mt-2 text-lg text-white">
                {sorteo.premio}
              </h3>
              <p className="mt-1 text-sm text-secondary">{sorteo.valor}</p>

              <Meter
                vendidos={sorteo.vendidos}
                total={sorteo.totalBoletos}
                className="mt-5"
              />

              <div className="mt-auto flex items-center gap-4 pt-5">
                <Link
                  href={`/boletos/${sorteo.id}/comprar`}
                  transitionTypes={["nav-forward"]}
                  className="btn-accent flex-1 text-sm"
                >
                  Comprar
                </Link>
                <button
                  type="button"
                  onClick={() => setActive(sorteo)}
                  className="flex min-h-11 shrink-0 items-center text-sm text-secondary transition-colors hover:text-white"
                >
                  Detalles
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <SorteoModal sorteo={active} onClose={() => setActive(null)} />
    </div>
  );
}
