import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Countdown from "@/components/countdown";
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

  const pct = Math.round((sorteo.vendidos / sorteo.totalBoletos) * 100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <Link
        href="/boletos"
        className="inline-flex items-center gap-1 font-body text-sm text-secondary transition-colors hover:text-white"
      >
        ← Volver a sorteos
      </Link>

      <div className="page-fade mt-6 text-center">
        <span className="rounded-full border border-border bg-muted/50 px-4 py-1.5 font-heading text-xs text-secondary">
          SORTEO #{sorteo.numero} · {sorteo.titulo}
        </span>
        <div className="mt-6 text-6xl sm:text-7xl" aria-hidden="true">
          {sorteo.emoji}
        </div>
        <h1 className="mt-4 font-heading text-3xl text-white sm:text-5xl">
          <span className="text-gradient">{sorteo.premio}</span>
        </h1>
        <p className="mt-2 font-heading text-2xl text-accent glow-text">
          {sorteo.valor}
        </p>
        <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-secondary">
          {sorteo.descripcion}
        </p>
      </div>

      <Reveal delay={80} className="mt-10 flex flex-col items-center">
        <p className="mb-4 font-heading text-sm tracking-widest text-white">
          EL SORTEO TERMINA EN
        </p>
        <Countdown targetDate={sorteo.fecha} />
      </Reveal>

      <Reveal
        delay={120}
        className="mt-10 rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex justify-between font-body text-sm text-secondary">
          <span>
            <span className="font-heading text-white">{pct}%</span> vendido
          </span>
          <span>
            Boleto:{" "}
            <span className="font-heading text-accent">
              ${sorteo.precioBoleto} MXN
            </span>
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="bar-fill h-full rounded-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 font-body text-xs text-secondary">
          {sorteo.vendidos} de {sorteo.totalBoletos} boletos vendidos · sorteo
          el {sorteo.fechaLabel}
        </p>
      </Reveal>

      <Reveal delay={160} className="mt-8 text-center">
        <Link
          href={`/boletos/${sorteo.id}/comprar`}
          className="btn-accent inline-block text-base !py-3 !px-10 glow-accent"
        >
          Comprar Boletos
        </Link>
      </Reveal>
    </div>
  );
}
