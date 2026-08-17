import Link from "next/link";
import { ViewTransition } from "react";
import Meter from "@/components/meter";
import type { Sorteo } from "@/app/data/sorteos";

export default function SorteoCard({ sorteo }: { sorteo: Sorteo }) {
  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden">
      {/* El mismo nombre en la portada del sorteo: al abrir el detalle la foto
          no desaparece y reaparece, se transforma. */}
      <ViewTransition name={`premio-${sorteo.id}`} share="morph">
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
            <span
              className="flex h-full w-full items-center justify-center text-5xl"
              aria-hidden="true"
            >
              {sorteo.emoji}
            </span>
          )}
          {sorteo.destacado && (
            <span className="glass absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium text-white">
              Destacado
            </span>
          )}
        </div>
      </ViewTransition>

      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow">
          {[`Sorteo ${sorteo.numero}`, sorteo.fechaLabel]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h3 className="h-section mt-2 text-xl text-white">{sorteo.premio}</h3>
        <p className="mt-1 text-sm text-secondary">{sorteo.valor}</p>

        <Meter
          vendidos={sorteo.vendidos}
          total={sorteo.totalBoletos}
          className="mt-5"
        />

        <p className="mt-5 text-sm text-secondary">
          Boleto{" "}
          <span className="num font-medium text-white">
            ${sorteo.precioBoleto}
          </span>{" "}
          MXN
        </p>

        <div className="mt-4 flex items-center gap-4 pt-1">
          <Link
            href={`/boletos/${sorteo.id}/comprar`}
            className="btn-accent flex-1 text-sm"
          >
            Comprar
          </Link>
          <Link
            href={`/boletos/${sorteo.id}`}
            transitionTypes={["nav-forward"]}
            className="flex min-h-11 shrink-0 items-center text-sm text-secondary transition-colors hover:text-white"
          >
            Detalles
          </Link>
        </div>
      </div>
    </article>
  );
}
