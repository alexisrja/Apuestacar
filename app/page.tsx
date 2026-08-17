import Link from "next/link";
import Countdown from "@/components/countdown";
import Meter from "@/components/meter";
import PrizeCard from "@/components/prize-card";
import TestimonialCard from "@/components/testimonial-card";
import Reveal from "@/components/reveal";
import SorteoSlider from "@/components/sorteo-slider";
import { getSorteos, getProximaFecha } from "@/lib/sorteos";
import { getTestimonios } from "@/lib/testimonios";
import { PROMOS } from "@/lib/promos";
import type { Sorteo } from "@/app/data/sorteos";

function toPrize(s: Sorteo) {
  return {
    title: s.premio,
    description: s.descripcion || `Sorteo ${s.numero} — ${s.titulo}`,
    value: s.valor,
    image: s.imagen || s.emoji,
  };
}

/** Encabezado de sección: qué es esto, y luego el título. */
function SectionHead({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h-section mt-3 text-2xl text-white sm:text-3xl">
        {title}
      </h2>
      {desc && <p className="measure mt-3 text-sm text-secondary">{desc}</p>}
    </div>
  );
}

const PASOS = [
  {
    n: "01",
    title: "Elige tus números",
    desc: "Escoges uno por uno o dejas que el sistema te asigne los que quedan libres.",
  },
  {
    n: "02",
    title: "Apartamos tu boleto",
    desc: "Tus números quedan reservados una hora mientras confirmas el pago por WhatsApp.",
  },
  {
    n: "03",
    title: "Esperas el sorteo",
    desc: "Publicamos el número ganador y el nombre del ganador en Resultados.",
  },
];

export default async function Home() {
  const [sorteos, testimonios, proximaFecha] = await Promise.all([
    getSorteos(),
    getTestimonios(),
    getProximaFecha(),
  ]);

  // El sorteo que abre la página: el destacado activo, o el primero activo.
  // Las promos son globales y apuntan a ese mismo sorteo.
  const principal =
    sorteos.find((s) => s.destacado && s.estado === "activo") ??
    sorteos.find((s) => s.estado === "activo") ??
    sorteos[0];

  return (
    <>
      {/* ------------------------------------------------------------------
       * Portada — el sorteo abierto, con su estado real. La promesa de la
       * marca va debajo del hecho, no encima de él.
       * ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8">
        {principal ? (
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              {/* Entrada en cascada: el ojo lee etiqueta, premio, precio,
                  disponibilidad y acción en ese orden. */}
              <p className="entra entra-1 eyebrow">
                Sorteo {principal.numero} · {principal.fechaLabel}
              </p>
              <h1 className="entra entra-2 display mt-4 text-4xl text-white sm:text-6xl">
                {principal.premio}
              </h1>
              <p className="entra entra-3 mt-3 text-lg text-secondary">
                {principal.valor} · boleto{" "}
                <span className="num font-medium text-white">
                  ${principal.precioBoleto}
                </span>{" "}
                MXN
              </p>

              <Meter
                vendidos={principal.vendidos}
                total={principal.totalBoletos}
                className="entra entra-4 mt-8 max-w-md"
              />

              <div className="entra entra-5 mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={`/boletos/${principal.id}/comprar`}
                  transitionTypes={["nav-forward"]}
                  className="btn-accent"
                >
                  Comprar boletos
                </Link>
                <Link
                  href={`/boletos/${principal.id}`}
                  transitionTypes={["nav-forward"]}
                  className="btn-outline"
                >
                  Ver el sorteo
                </Link>
              </div>

              {proximaFecha && (
                <div className="entra entra-5 mt-10">
                  <p className="eyebrow">Cierra en</p>
                  <div className="mt-3">
                    <Countdown targetDate={proximaFecha} />
                  </div>
                </div>
              )}
            </div>

            <div className="entra entra-2 card overflow-hidden">
              <div className="zoom-marco aspect-[4/3] bg-muted">
                {principal.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={principal.imagen}
                    alt={principal.premio}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center text-7xl"
                    aria-hidden="true"
                  >
                    {principal.emoji}
                  </span>
                )}
              </div>
              {principal.descripcion && (
                <p className="p-5 text-sm text-secondary">
                  {principal.descripcion}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="page-fade card mx-auto max-w-xl p-10 text-center">
            <h1 className="display text-3xl text-white sm:text-4xl">
              Aún no hay un sorteo abierto
            </h1>
            <p className="mt-3 text-sm text-secondary">
              Estamos preparando el siguiente. Revisa los resultados de los
              sorteos anteriores mientras tanto.
            </p>
            <Link href="/resultados" className="btn-outline mt-6">
              Ver resultados
            </Link>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------
       * Paquetes
       * ---------------------------------------------------------------- */}
      {principal && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHead
            eyebrow="Paquetes"
            title="Más boletos, menos por boleto"
            desc="El precio por boleto baja al comprar en paquete. Se aplica solo al llegar a la cantidad exacta."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
            {PROMOS.map((promo, i) => {
              const precioNormal = promo.cantidad * principal.precioBoleto;
              const ahorro = precioNormal - promo.precio;
              const porBoleto = Math.round(promo.precio / promo.cantidad);
              const mejor = i === PROMOS.length - 1;
              return (
                <Reveal key={promo.cantidad} delay={i * 80}>
                  <Link
                    href={`/boletos/${principal.id}/comprar?promo=${promo.cantidad}`}
                    className="card card-hover flex h-full flex-col p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="eyebrow">{promo.cantidad} boletos</p>
                      {mejor && (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[0.6875rem] font-medium text-white">
                          Mejor precio
                        </span>
                      )}
                    </div>
                    <p className="num mt-4 text-4xl font-medium text-white">
                      ${promo.precio}
                      <span className="ml-1.5 text-base font-normal text-secondary">
                        MXN
                      </span>
                    </p>
                    <p className="num mt-2 text-sm text-secondary">
                      ${porBoleto} por boleto
                      {ahorro > 0 && ` · ahorras $${ahorro}`}
                    </p>
                    <span className="btn-accent mt-6 w-full text-sm">
                      Elegir paquete
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------
       * Sorteos activos
       * ---------------------------------------------------------------- */}
      {sorteos.length > 0 && (
        <section className="overflow-hidden py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHead
              eyebrow="Abiertos ahora"
              title="Sorteos activos"
              desc="Cada sorteo tiene su propio premio, precio de boleto y fecha."
            />
            <div className="mt-8">
              <SorteoSlider sorteos={sorteos} />
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------
       * Cómo funciona — aquí la numeración sí es una secuencia real.
       * ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHead eyebrow="El proceso" title="Cómo funciona" />
        <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {PASOS.map((paso, i) => (
            <Reveal as="li" key={paso.n} delay={i * 80} className="bg-background">
              <div className="h-full bg-surface p-6">
                <span className="num text-sm text-secondary">{paso.n}</span>
                <h3 className="h-section mt-3 text-lg text-white">
                  {paso.title}
                </h3>
                <p className="mt-2 text-sm text-secondary">{paso.desc}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------------
       * Premios
       * ---------------------------------------------------------------- */}
      {sorteos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead
              eyebrow="En juego"
              title="Premios de los próximos sorteos"
            />
            <Link
              href="/premios"
              className="flex min-h-11 items-center text-sm text-secondary transition-colors hover:text-white"
            >
              Ver todos los premios →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sorteos
              .filter((s) => s.estado === "activo" || s.estado === "proximo")
              .slice(0, 3)
              .map((s, i) => (
                <Reveal key={s.id} delay={i * 80}>
                  <PrizeCard {...toPrize(s)} />
                </Reveal>
              ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------
       * Ganadores
       * ---------------------------------------------------------------- */}
      {testimonios.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead
              eyebrow="Sorteos cerrados"
              title="Quién ya ganó"
              desc="Publicamos el número y el ganador de cada sorteo."
            />
            <Link
              href="/resultados"
              className="flex min-h-11 items-center text-sm text-secondary transition-colors hover:text-white"
            >
              Ver todos los resultados →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonios.slice(0, 3).map((t, i) => (
              <Reveal key={t.id} delay={i * 80}>
                <TestimonialCard {...t} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------
       * Cierre
       * ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <Reveal className="card glass-thick p-8 text-center sm:p-14">
          <h2 className="display text-3xl text-white sm:text-4xl">
            Elige tus números hoy
          </h2>
          <p className="measure mx-auto mt-3 text-sm text-secondary">
            Compras con o sin cuenta. Apartamos tus boletos una hora mientras
            confirmas el pago.
          </p>
          <Link href="/boletos" className="btn-accent mt-8">
            Comprar boletos
          </Link>
        </Reveal>
      </section>
    </>
  );
}
