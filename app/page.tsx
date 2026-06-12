import Link from "next/link";
import Countdown from "@/components/countdown";
import PrizeCard from "@/components/prize-card";
import TestimonialCard from "@/components/testimonial-card";
import Reveal from "@/components/reveal";
import SorteoSlider from "@/components/sorteo-slider";
import AnimatedText from "@/components/animated-text";
import { getSorteos } from "@/lib/sorteos";
import type { Sorteo } from "@/app/data/sorteos";

function toPrize(s: Sorteo) {
  return {
    title: s.premio,
    description: s.descripcion || `Sorteo #${s.numero} — ${s.titulo}`,
    value: s.valor,
    image: s.imagen || s.emoji,
  };
}

const testimonials = [
  {
    name: "Carlos M.",
    text: "Nunca pensé que ganaría. Compré un boleto por diversión y terminé llevándome el auto. ¡Increíble!",
    prize: "Auto Deportivo",
    avatar: "CM",
  },
  {
    name: "Ana G.",
    text: "Participé en la rifa del viaje a Dubai y gané. Fue la mejor experiencia de mi vida. 100% recomendado.",
    prize: "Viaje a Dubai",
    avatar: "AG",
  },
  {
    name: "Roberto L.",
    text: "Ya he ganado dos veces con RIFAS JAPS. Son legales, transparentes y los premios se entregan rápido.",
    prize: "$50,000 MXN",
    avatar: "RL",
  },
];

export default async function Home() {
  const sorteos = await getSorteos();
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15)_0%,transparent_60%)]" />
        <div className="page-fade relative mx-auto max-w-5xl text-center">
          <Link
            href="/boletos/12"
            className="mb-6 inline-block rounded-full border border-border bg-muted/50 px-4 py-1.5 font-body text-xs text-secondary transition-colors hover:border-primary hover:text-white"
          >
            🏆 Sorteo #12 — Gran Premio Final · Ver detalles →
          </Link>
          <h1 className="font-heading text-4xl leading-tight text-white sm:text-6xl sm:leading-tight">
            <span className="text-gradient">¡GANA EN GRANDE!</span>
            <br />
            Con RIFAS JAPS
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-base leading-relaxed text-secondary sm:text-lg">
            Compra tus boletos y participa en la rifa más emocionante. Premios
            increíbles, resultados transparentes y diversión asegurada.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/boletos" className="btn-accent text-base py-3! px-8!">
              Comprar Boletos Ahora
            </Link>
            <Link href="/premios" className="btn-outline text-base py-3! px-8!">
              Ver Premios
            </Link>
          </div>

          <div className="mt-12 flex flex-col items-center">
            <p className="mb-4 font-heading text-sm tracking-widest text-white">
              PRÓXIMO SORTEO
            </p>
            <Countdown targetDate="2026-07-15T20:00:00" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="section-title text-white">
            <AnimatedText
              segments={[
                { text: "Sorteos " },
                { text: "Activos", className: "text-gradient" },
              ]}
            />
          </h2>
          <div className="neon-line" />
          <p className="mx-auto mt-4 max-w-xl text-center font-body text-sm text-secondary">
            Desliza para explorar los sorteos. Toca{" "}
            <span className="font-heading text-primary">Ver Detalles</span>{" "}
            para más información.
          </p>
          <div className="mt-10">
            <SorteoSlider sorteos={sorteos} />
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="section-title text-white">
            ¿Cómo funciona?
          </h2>
          <div className="neon-line" />
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Elige tus números",
                desc: "Selecciona los números de la suerte que más te gusten.",
              },
              {
                step: "02",
                title: "Compra tu boleto",
                desc: "Paga de forma segura con tu método de pago favorito.",
              },
              {
                step: "03",
                title: "Gana premios",
                desc: "Espera el sorteo y descubre si eres el ganador.",
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 90}>
                <div className="card-neon p-6 text-center">
                  <span className="font-heading text-3xl text-primary glow-text">
                    {item.step}
                  </span>
                  <h3 className="mt-3 font-heading text-lg text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-body text-sm text-secondary">
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="section-title text-white">
            Premios del Sorteo
          </h2>
          <div className="neon-line" />
          <p className="mx-auto mt-4 max-w-xl text-center font-body text-sm text-secondary">
            Estos son los increíbles premios que puedes ganar en nuestro
            próximo sorteo.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {sorteos.filter(s => s.estado === "activo" || s.estado === "proximo").slice(0, 3).map((s, i) => (
              <Reveal key={s.id} delay={i * 90}>
                <PrizeCard {...toPrize(s)} />
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/premios" className="btn-outline">
              Ver Todos los Premios
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="section-title text-white">
            Ganadores Recientes
          </h2>
          <div className="neon-line" />
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 90}>
                <TestimonialCard {...t} />
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/resultados" className="btn-outline">
              Ver Todos los Resultados
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 px-4 py-16 sm:py-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="section-title text-white">
            ¿Listo para ganar?
          </h2>
          <div className="neon-line" />
          <p className="mt-4 font-body text-base text-secondary">
            No dejes pasar la oportunidad de cambiar tu vida. Compra tus boletos
            ahora y participa en el próximo sorteo.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/boletos"
              className="btn-accent text-base py-3! px-10! glow-accent"
            >
              Comprar Boletos
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
