import type { Metadata } from "next";
import TestimonialCard from "@/components/testimonial-card";
import Reveal from "@/components/reveal";
import { getResultados } from "@/lib/resultados";
import { getTestimonios } from "@/lib/testimonios";

export const metadata: Metadata = {
  title: "Resultados de Sorteos",
  description:
    "Consulta los resultados de los sorteos de RIFAS JAPS y descubre a los ganadores de cada rifa. Transparencia en cada sorteo.",
  alternates: { canonical: "/resultados" },
};

export default async function ResultadosPage() {
  const [resultados, testimonios] = await Promise.all([
    getResultados(),
    getTestimonios(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="page-fade">
        <p className="eyebrow">Resultados</p>
        <h1 className="display mt-3 text-3xl text-white sm:text-5xl">
          Sorteos ya cerrados
        </h1>
        <p className="measure mt-3 text-sm text-secondary">
          El número ganador y el ganador de cada sorteo, tal como se publicaron
          el día del evento.
        </p>
      </header>

      {resultados.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="h-section text-lg text-white">
            Aún no hay resultados
          </p>
          <p className="measure mx-auto mt-2 text-sm text-secondary">
            Publicaremos aquí el número ganador en cuanto se cierre el primer
            sorteo.
          </p>
        </div>
      ) : (
        <Reveal className="card mt-10 overflow-hidden">
          {/* La tabla desborda en pantallas chicas dentro de su propio
              contenedor; la página nunca hace scroll horizontal. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Sorteo", "Fecha", "Ganador", "Número", "Premio"].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="eyebrow px-4 py-3 font-medium"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resultados.map((r) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-surface-hover"
                  >
                    <td className="num whitespace-nowrap px-4 py-3.5 text-secondary">
                      {r.sorteo_numero}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-secondary">
                      {r.fecha}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-white">
                      {r.ganador}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="num inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-sm text-white">
                        {r.numero}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-foreground">{r.premio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      )}

      {testimonios.length > 0 && (
        <section className="mt-16">
          <p className="eyebrow">Ganadores</p>
          <h2 className="h-section mt-3 text-2xl text-white sm:text-3xl">
            Lo que cuentan
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonios.map((t, i) => (
              <Reveal key={t.id} delay={i * 80}>
                <TestimonialCard {...t} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
