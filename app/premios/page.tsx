import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSorteos } from "@/lib/sorteos";
import Reveal from "@/components/reveal";

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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="page-fade text-center">
        <h1 className="font-heading text-3xl text-white sm:text-4xl">
          Nuestros <span className="text-gradient">Premios</span>
        </h1>
        <div className="neon-line" />
        <p className="mx-auto mt-4 max-w-lg font-body text-sm text-secondary">
          Estos son los increíbles premios que puedes ganar en nuestros sorteos
          activos y próximos. ¡Compra tus boletos y participa!
        </p>
      </div>

      {activeSorteos.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
          <p className="font-body text-sm text-secondary">
            Próximamente estaremos anunciando nuevos premios. Vuelve pronto.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeSorteos.map((s, i) => (
            <Reveal key={s.id} delay={i * 80}>
              <div className="card-neon group overflow-hidden">
                <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30">
                  {s.imagen ? (
                    <img
                      src={s.imagen}
                      alt={s.premio}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">{s.emoji}</span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg text-white">
                    {s.premio}
                  </h3>
                  <p className="mt-1 font-body text-sm text-secondary">
                    {s.descripcion || `Sorteo #${s.numero} — ${s.titulo}`}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="glow-text font-heading text-sm text-accent">
                      {s.valor}
                    </span>
                    <Link
                      href={`/boletos/${s.id}`}
                      className="font-body text-xs text-foreground transition-colors hover:text-white"
                    >
                      Comprar boleto →
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="font-body text-sm text-secondary">
          ¿Listo para ganar alguno de estos premios?
        </p>
        <Link href="/boletos" className="btn-accent mt-4 inline-block">
          Comprar Boletos
        </Link>
      </div>
    </div>
  );
}
