"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Sorteo } from "@/app/data/sorteos";

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

  const pct = Math.round((sorteo.vendidos / sorteo.totalBoletos) * 100);

  return (
    <div
      className="scrim-fade fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sorteo-modal-title"
    >
      <div
        className="modal-pop card-neon relative max-h-[90dvh] w-full max-w-md overflow-y-auto p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#4C1D95] text-[#A78BFA] transition-colors hover:border-[#7C3AED] hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center">
          <span className="rounded-full border border-[#4C1D95] bg-[#27273B]/50 px-3 py-1 font-heading text-xs text-[#A78BFA]">
            SORTEO #{sorteo.numero} · {sorteo.titulo}
          </span>
          <div className="mt-4 text-5xl" aria-hidden="true">
            {sorteo.emoji}
          </div>
          <h2
            id="sorteo-modal-title"
            className="mt-3 font-heading text-2xl text-white"
          >
            <span className="text-gradient">{sorteo.premio}</span>
          </h2>
          <p className="mt-1 font-heading text-xl text-[#F43F5E] glow-text">
            {sorteo.valor}
          </p>
        </div>

        <p className="mt-4 font-body text-sm leading-relaxed text-[#A78BFA]">
          {sorteo.descripcion}
        </p>

        <div className="mt-5">
          <div className="flex justify-between font-body text-xs text-[#A78BFA]">
            <span>
              <span className="font-heading text-white">{pct}%</span> vendido
            </span>
            <span>
              Boleto:{" "}
              <span className="font-heading text-[#F43F5E]">
                ${sorteo.precioBoleto} USD
              </span>
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#27273B]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#F43F5E]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 font-body text-xs text-[#A78BFA]">
            Sorteo el {sorteo.fechaLabel}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/boletos/${sorteo.id}/comprar`}
            className="btn-accent text-center text-sm glow-accent"
            onClick={onClose}
          >
            Comprar Boletos
          </Link>
          <Link
            href={`/boletos/${sorteo.id}`}
            className="btn-outline text-center text-sm"
            onClick={onClose}
          >
            Ver sorteo completo
          </Link>
        </div>
      </div>
    </div>
  );
}
