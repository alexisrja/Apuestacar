import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { getSorteos } from "@/lib/sorteos";
import Reveal from "@/components/reveal";
import Meter from "@/components/meter";

export const metadata: Metadata = {
  title: "Premios y Rifas Activas",
  description:
    "Descubre todos los premios y rifas activas de RIFAS JAPS: autos, motos y dinero en efectivo. Compra tus boletos y participa.",
  alternates: { canonical: "/premios" },
};

export default async function PremiosPage() {
  const sorteos = await getSorteos();
  const activeSorteos = sorteos.filter(
    (s) => s.estado === "activo" || s.estado === "proximo",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="page-fade">
        <p className="eyebrow">Premios</p>
        <h1 className="display mt-3 text-3xl text-white sm:text-5xl">
          Lo que está en juego
        </h1>
        <p className="measure mt-3 text-sm text-secondary">
          Premios de los sorteos activos y de los que abren próximamente.
        </p>
      </header>

      {activeSorteos.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="h-section text-lg text-white">
            Todavía no hay premios publicados
          </p>
          <p className="measure mx-auto mt-2 text-sm text-secondary">
            Estamos cerrando los premios del siguiente sorteo. Vuelve pronto.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeSorteos.map((s, i) => (
            <Reveal key={s.id} delay={i * 80}>
              <article className="card card-hover flex h-full flex-col overflow-hidden">
                <ViewTransition name={`premio-${s.id}`} share="morph">
                  <div className="zoom-marco relative aspect-[16/10] bg-muted">
                    {s.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.imagen}
                        alt={s.premio}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-full w-full items-center justify-center text-5xl"
                        aria-hidden="true"
                      >
                        {s.emoji}
                      </span>
                    )}
                    {s.estado === "proximo" && (
                      <span className="glass absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium text-white">
                        Próximamente
                      </span>
                    )}
                  </div>
                </ViewTransition>

                <div className="flex flex-1 flex-col p-5">
                  <p className="eyebrow">
                    {[`Sorteo ${s.numero}`, s.fechaLabel]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <h2 className="h-section mt-2 text-lg text-white">
                    {s.premio}
                  </h2>
                  <p className="mt-1.5 text-sm text-secondary">
                    {s.descripcion || s.titulo}
                  </p>
                  <p className="num mt-3 text-sm font-medium text-white">
                    {s.valor}
                  </p>

                  {s.estado === "activo" && (
                    <Meter
                      vendidos={s.vendidos}
                      total={s.totalBoletos}
                      className="mt-5"
                    />
                  )}

                  <div className="mt-auto pt-5">
                    <Link
                      href={`/boletos/${s.id}`}
                      transitionTypes={["nav-forward"]}
                      className="btn-outline w-full text-sm"
                    >
                      Ver el sorteo
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}

      <div className="card glass-thick mt-14 p-8 text-center sm:p-12">
        <h2 className="h-section text-2xl text-white">
          ¿Ya sabes cuál quieres?
        </h2>
        <p className="measure mx-auto mt-2 text-sm text-secondary">
          Elige tus números y aparta tus boletos. No necesitas cuenta.
        </p>
        <Link href="/boletos" className="btn-accent mt-6">
          Comprar boletos
        </Link>
      </div>
    </div>
  );
}
