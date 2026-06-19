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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="page-fade text-center">
        <h1 className="font-heading text-3xl text-white sm:text-4xl">
          Resultados <span className="text-gradient">Anteriores</span>
        </h1>
        <div className="neon-line" />
        <p className="mx-auto mt-4 max-w-lg font-body text-sm text-secondary">
          Conoce a los ganadores de nuestros sorteos anteriores. Todos los
          resultados son verificados y transparentes.
        </p>
      </div>

      {resultados.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
          <p className="font-body text-sm text-secondary">
            Próximamente publicaremos los resultados de nuestros sorteos.
          </p>
        </div>
      ) : (
        <Reveal className="mt-10 overflow-hidden rounded-xl border border-border">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-secondary">
                  SORTEO
                </th>
                <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-secondary">
                  FECHA
                </th>
                <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-secondary">
                  GANADOR
                </th>
                <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-secondary">
                  N°
                </th>
                <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-secondary">
                  PREMIO
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {resultados.map((r) => (
                <tr
                  key={r.id}
                  className="bg-surface transition-colors hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 font-heading text-white">
                    #{r.sorteo_numero}
                  </td>
                  <td className="px-4 py-3 text-foreground">{r.fecha}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {r.ganador}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-primary/20 px-2 py-0.5 font-heading text-sm text-secondary">
                      {r.numero}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-accent">
                    {r.premio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      )}

      {testimonios.length > 0 && (
        <div className="mt-16">
          <h2 className="section-title text-white">
            Historias de Ganadores
          </h2>
          <div className="neon-line" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {testimonios.map((t, i) => (
              <Reveal key={t.id} delay={i * 90}>
                <TestimonialCard {...t} />
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
