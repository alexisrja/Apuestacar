import Link from "next/link";
import { notFound } from "next/navigation";
import Countdown from "@/components/countdown";
import Reveal from "@/components/reveal";
import { getSorteo } from "@/lib/sorteos";

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
        className="inline-flex items-center gap-1 font-body text-sm text-[#38BDF8] transition-colors hover:text-white"
      >
        ← Volver a sorteos
      </Link>

      <div className="page-fade mt-6 text-center">
        <span className="rounded-full border border-[#1E3A8A] bg-[#16223A]/50 px-4 py-1.5 font-heading text-xs text-[#38BDF8]">
          SORTEO #{sorteo.numero} · {sorteo.titulo}
        </span>
        <div className="mt-6 text-6xl sm:text-7xl" aria-hidden="true">
          {sorteo.emoji}
        </div>
        <h1 className="mt-4 font-heading text-3xl text-white sm:text-5xl">
          <span className="text-gradient">{sorteo.premio}</span>
        </h1>
        <p className="mt-2 font-heading text-2xl text-[#22D3EE] glow-text">
          {sorteo.valor}
        </p>
        <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-[#38BDF8]">
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
        className="mt-10 rounded-xl border border-[#1E3A8A] bg-[#111A2E] p-6"
      >
        <div className="flex justify-between font-body text-sm text-[#38BDF8]">
          <span>
            <span className="font-heading text-white">{pct}%</span> vendido
          </span>
          <span>
            Boleto:{" "}
            <span className="font-heading text-[#22D3EE]">
              ${sorteo.precioBoleto} MXN
            </span>
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#16223A]">
          <div
            className="bar-fill h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#22D3EE]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 font-body text-xs text-[#38BDF8]">
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
