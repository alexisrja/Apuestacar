"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Sorteo } from "@/app/data/sorteos";
import Meter from "@/components/meter";
import PremioPlaca from "@/components/premio-placa";

interface Props {
  sorteo: Sorteo | null;
  onClose: () => void;
}

export default function SorteoModal({ sorteo, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sorteo) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // move focus into dialog
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sorteo, onClose]);

  if (!sorteo) return null;

  return (
    // Tarea modal: el fondo se atenúa y se empuja hacia atrás para que sólo
    // haya una cosa que atender.
    <div
      className="scrim-fade fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sorteo-modal-title"
    >
      <div
        className="modal-pop glass-thick relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-muted">
          {sorteo.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sorteo.imagen}
              alt={sorteo.premio}
              className="h-full w-full object-cover"
            />
          ) : (
<PremioPlaca titulo={sorteo.titulo} valor={sorteo.valor} />
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="glass absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="eyebrow">
            {[`Sorteo ${sorteo.numero}`, sorteo.fechaLabel]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h2
            id="sorteo-modal-title"
            className="h-section mt-2 text-2xl text-white"
          >
            {sorteo.premio}
          </h2>
          <p className="mt-1 text-sm text-secondary">{sorteo.valor}</p>

          {sorteo.descripcion && (
            <p className="mt-4 text-sm leading-relaxed text-secondary">
              {sorteo.descripcion}
            </p>
          )}

          <Meter
            vendidos={sorteo.vendidos}
            total={sorteo.totalBoletos}
            className="mt-6"
          />

          <p className="mt-4 text-sm text-secondary">
            Boleto{" "}
            <span className="num font-medium text-white">
              ${sorteo.precioBoleto}
            </span>{" "}
            MXN
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/boletos/${sorteo.id}/comprar`}
              className="btn-accent w-full text-sm"
              onClick={onClose}
            >
              Comprar boletos
            </Link>
            <Link
              href={`/boletos/${sorteo.id}`}
              className="btn-outline w-full text-sm"
              onClick={onClose}
            >
              Ver el sorteo completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
