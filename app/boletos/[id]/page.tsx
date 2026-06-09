import Link from "next/link";
import { notFound } from "next/navigation";
import Countdown from "@/components/countdown";
import Reveal from "@/components/reveal";
import { sorteos, getSorteo } from "@/app/data/sorteos";

export function generateStaticParams() {
  return sorteos.map((s) => ({ id: s.id }));
}

export default async function SorteoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sorteo = getSorteo(id);
  if (!sorteo) notFound();

  const pct = Math.round((sorteo.vendidos / sorteo.totalBoletos) * 100);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <Link
        href="/boletos"
        className="inline-flex items-center gap-1 font-body text-sm text-[#A78BFA] transition-colors hover:text-white"
      >
        ← Volver a sorteos
      </Link>

      <div className="page-fade mt-6 text-center">
        <span className="rounded-full border border-[#4C1D95] bg-[#27273B]/50 px-4 py-1.5 font-heading text-xs text-[#A78BFA]">
          SORTEO #{sorteo.numero} · {sorteo.titulo}
        </span>
        <div className="mt-6 text-6xl sm:text-7xl" aria-hidden="true">
          {sorteo.emoji}
        </div>
        <h1 className="mt-4 font-heading text-3xl text-white sm:text-5xl">
          <span className="text-gradient">{sorteo.premio}</span>
        </h1>
        <p className="mt-2 font-heading text-2xl text-[#F43F5E] glow-text">
          {sorteo.valor}
        </p>
        <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-[#A78BFA]">
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
        className="mt-10 rounded-xl border border-[#4C1D95] bg-[#1A1A35] p-6"
      >
        <div className="flex justify-between font-body text-sm text-[#A78BFA]">
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
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#27273B]">
          <div
            className="bar-fill h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#F43F5E]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 font-body text-xs text-[#A78BFA]">
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
