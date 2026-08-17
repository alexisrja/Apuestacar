import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import Countdown from "@/components/countdown";
import Meter from "@/components/meter";
import PremioPlaca from "@/components/premio-placa";
import Reveal from "@/components/reveal";
import { getSorteo } from "@/lib/sorteos";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sorteo = await getSorteo(id);
  if (!sorteo) {
    return { title: "Sorteo no encontrado" };
  }

  const title = `${sorteo.premio} (${sorteo.valor}) - Sorteo #${sorteo.numero}`;
  const description = `${sorteo.descripcion} Compra tus boletos para el sorteo #${sorteo.numero} de RIFAS JAPS por ${sorteo.precioBoleto} cada uno. Sorteo: ${sorteo.fechaLabel}.`;
  const image = sorteo.imagen ?? "/icon.png";

  return {
    title,
    description,
    alternates: { canonical: `/boletos/${sorteo.id}` },
    openGraph: {
      title,
      description,
      url: `/boletos/${sorteo.id}`,
      images: [{ url: image, alt: sorteo.premio }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SorteoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sorteo = await getSorteo(id);
  if (!sorteo) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Link
        href="/boletos"
        transitionTypes={["nav-back"]}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-secondary transition-colors hover:text-white"
      >
        <span aria-hidden="true">←</span> Todos los sorteos
      </Link>

      <div className="mt-4 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Mismo nombre que en la tarjeta: la foto se transforma al entrar. */}
        <ViewTransition name={`premio-${sorteo.id}`} share="morph">
          <div className="card overflow-hidden lg:order-2">
            <div className="aspect-[4/3] bg-muted">
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
            </div>
          </div>
        </ViewTransition>

        <div className="lg:order-1">
          <p className="entra entra-1 eyebrow">
            {[`Sorteo ${sorteo.numero}`, sorteo.titulo]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1 className="entra entra-2 display mt-4 text-4xl text-white sm:text-5xl">
            {sorteo.premio}
          </h1>
          <p className="entra entra-3 mt-3 text-lg text-secondary">
            {sorteo.valor} · boleto{" "}
            <span className="num font-medium text-white">
              ${sorteo.precioBoleto}
            </span>{" "}
            MXN
          </p>
          <p className="entra entra-3 measure mt-4 text-sm leading-relaxed text-secondary">
            {sorteo.descripcion}
          </p>

          <Meter
            vendidos={sorteo.vendidos}
            total={sorteo.totalBoletos}
            className="entra entra-4 mt-8 max-w-md"
          />

          <Link
            href={`/boletos/${sorteo.id}/comprar`}
            transitionTypes={["nav-forward"]}
            className="btn-accent entra entra-5 mt-8"
          >
            Comprar boletos
          </Link>

          <Reveal delay={80} className="mt-10">
            <p className="eyebrow">
              {sorteo.fechaLabel ? `Cierra el ${sorteo.fechaLabel}` : "Cierra en"}
            </p>
            <div className="mt-3">
              <Countdown targetDate={sorteo.fecha} />
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
