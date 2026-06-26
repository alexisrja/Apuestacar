import Link from "next/link";
import Countdown from "@/components/countdown";
import PrizeCard from "@/components/prize-card";
import TestimonialCard from "@/components/testimonial-card";
import Reveal from "@/components/reveal";
import SorteoSlider from "@/components/sorteo-slider";
import AnimatedText from "@/components/animated-text";
import { getSorteos, getProximaFecha } from "@/lib/sorteos";
import { getTestimonios } from "@/lib/testimonios";
import { PROMOS } from "@/lib/promos";
import type { Sorteo } from "@/app/data/sorteos";

function toPrize(s: Sorteo) {
  return {
    title: s.premio,
    description: s.descripcion || `Sorteo #${s.numero} — ${s.titulo}`,
    value: s.valor,
    image: s.imagen || s.emoji,
  };
}

export default async function Home() {
  const [sorteos, testimonios, proximaFecha] = await Promise.all([
    getSorteos(),
    getTestimonios(),
    getProximaFecha(),
  ]);
  // Las promos son globales: las dirigimos al sorteo destacado activo (o al
  // primer sorteo activo disponible) para que el comprador caiga directo en el
  // selector con la promo aplicada.
  const promoSorteo =
    sorteos.find((s) => s.destacado && s.estado === "activo") ??
    sorteos.find((s) => s.estado === "activo") ??
    sorteos[0];
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15)_0%,transparent_60%)]" />
        <div className="page-fade relative mx-auto max-w-5xl text-center">
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
            {proximaFecha ? (
              <Countdown targetDate={proximaFecha} />
            ) : (
              <p className="font-body text-sm text-secondary/60">
                Próximamente anunciaremos la fecha del próximo sorteo.
              </p>
            )}
          </div>
        </div>
      </section>

      {promoSorteo && (
        <section className="px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="section-title text-white">
              <AnimatedText
                segments={[
                  { text: "Promociones " },
                  { text: "Especiales", className: "text-gradient" },
                ]}
              />
            </h2>
            <div className="neon-line" />
            <p className="mx-auto mt-4 max-w-xl text-center font-body text-sm text-secondary">
              Más boletos, más oportunidades de ganar. Aprovecha estos paquetes
              por tiempo limitado.
            </p>
            <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
              {PROMOS.map((promo, i) => {
                const precioNormal = promo.cantidad * promoSorteo.precioBoleto;
                const ahorro = precioNormal - promo.precio;
                const popular = i === PROMOS.length - 1;
                return (
                  <Reveal key={promo.cantidad} delay={i * 90}>
                    <Link
                      href={`/boletos/${promoSorteo.id}/comprar?promo=${promo.cantidad}`}
                      className={`group relative block overflow-hidden rounded-2xl border p-7 text-center transition-all duration-300 hover:-translate-y-1 ${
                        popular
                          ? "border-accent bg-gradient-to-br from-accent/15 to-primary/10 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
                          : "border-primary/50 bg-gradient-to-br from-primary/15 to-surface"
                      }`}
                    >
                      {popular && (
                        <span className="absolute right-3 top-3 rounded-full bg-accent px-3 py-1 font-heading text-[10px] tracking-wider text-black">
                          MÁS POPULAR
                        </span>
                      )}
                      <div className="text-4xl">🎁</div>
                      <p className="mt-3 font-heading text-2xl text-white">
                        {promo.cantidad} BOLETOS
                      </p>
                      <p className="mt-1 font-heading text-5xl text-accent glow-text">
                        ${promo.precio}
                        <span className="ml-1 text-base text-secondary">MXN</span>
                      </p>
                      {ahorro > 0 && (
                        <p className="mt-2 font-body text-sm text-secondary">
                          <span className="line-through">${precioNormal}</span>{" "}
                          <span className="font-heading text-primary">
                            ¡Ahorras ${ahorro}!
                          </span>
                        </p>
                      )}
                      <span className="btn-accent mt-5 inline-block w-full text-sm">
                        ¡Lo quiero!
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
            {testimonios.slice(0, 3).map((t, i) => (
              <Reveal key={t.id} delay={i * 90}>
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
