import Link from "next/link";
import type { Sorteo } from "@/app/data/sorteos";

export default function SorteoCard({ sorteo }: { sorteo: Sorteo }) {
  const pct = Math.round((sorteo.vendidos / sorteo.totalBoletos) * 100);

  return (
    <div className="card-neon flex flex-col p-6">
      <div className="flex items-start justify-between">
        <span className="rounded-full border border-[#1E3A8A] bg-[#16223A]/50 px-3 py-1 font-heading text-xs text-[#38BDF8]">
          SORTEO #{sorteo.numero}
        </span>
        {sorteo.destacado && (
          <span className="rounded-full bg-[#22D3EE]/20 px-3 py-1 font-heading text-xs text-[#22D3EE]">
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
          <p className="font-body text-xs text-[#38BDF8]">{sorteo.titulo}</p>
        </div>
      </div>

      <p className="mt-3 font-heading text-2xl text-[#22D3EE] glow-text">
        {sorteo.valor}
      </p>

      <div className="mt-4">
        <div className="flex justify-between font-body text-xs text-[#38BDF8]">
          <span>{pct}% vendido</span>
          <span>{sorteo.fechaLabel}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#16223A]">
          <div
            className="bar-fill h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#22D3EE]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href={`/boletos/${sorteo.id}`}
          className="btn-outline flex-1 text-center text-sm !py-2.5"
        >
          Ver Detalles
        </Link>
        <Link
          href={`/boletos/${sorteo.id}/comprar`}
          className="btn-accent flex-1 text-center text-sm !py-2.5"
        >
          Comprar
        </Link>
      </div>
    </div>
  );
}
