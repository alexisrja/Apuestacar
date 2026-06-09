import TestimonialCard from "@/components/testimonial-card";
import Reveal from "@/components/reveal";

const pastResults = [
  {
    id: 11,
    date: "15 Junio, 2026",
    winner: "María Fernanda L.",
    number: "042",
    prize: "Auto Deportivo",
  },
  {
    id: 10,
    date: "1 Junio, 2026",
    winner: "Carlos Méndez",
    number: "087",
    prize: "Viaje a Dubai",
  },
  {
    id: 9,
    date: "15 Mayo, 2026",
    winner: "Ana Gabriela R.",
    number: "015",
    prize: "$50,000 USD",
  },
  {
    id: 8,
    date: "1 Mayo, 2026",
    winner: "Roberto López",
    number: "063",
    prize: "Moto Deportiva",
  },
  {
    id: 7,
    date: "15 Abril, 2026",
    winner: "Laura Castillo",
    number: "099",
    prize: "TV 80 8K",
  },
];

const testimonials = [
  {
    name: "María Fernanda L.",
    text: "Compré solo un boleto y gané el auto. ¡No podía creerlo! Apuestacar cambió mi vida.",
    prize: "Auto Deportivo",
    avatar: "MF",
  },
  {
    name: "Carlos Méndez",
    text: "Gané el viaje a Dubai y fue espectacular. Todo el proceso fue transparente y rápido.",
    prize: "Viaje a Dubai",
    avatar: "CM",
  },
];

export default function ResultadosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="page-fade text-center">
        <h1 className="font-heading text-3xl text-white sm:text-4xl">
          Resultados <span className="text-gradient">Anteriores</span>
        </h1>
        <div className="neon-line" />
        <p className="mx-auto mt-4 max-w-lg font-body text-sm text-[#A78BFA]">
          Conoce a los ganadores de nuestros sorteos anteriores. Todos los
          resultados son verificados y transparentes.
        </p>
      </div>

      <Reveal className="mt-10 overflow-hidden rounded-xl border border-[#4C1D95]">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="bg-[#27273B]">
              <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-[#A78BFA]">
                SORTEO
              </th>
              <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-[#A78BFA]">
                FECHA
              </th>
              <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-[#A78BFA]">
                GANADOR
              </th>
              <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-[#A78BFA]">
                N°
              </th>
              <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-[#A78BFA]">
                PREMIO
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4C1D95]/50">
            {pastResults.map((r) => (
              <tr
                key={r.id}
                className="bg-[#1A1A35] transition-colors hover:bg-[#252545]"
              >
                <td className="px-4 py-3 font-heading text-white">
                  #{r.id}
                </td>
                <td className="px-4 py-3 text-[#E2E8F0]">{r.date}</td>
                <td className="px-4 py-3 font-medium text-white">
                  {r.winner}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-[#7C3AED]/20 px-2 py-0.5 font-heading text-sm text-[#A78BFA]">
                    {r.number}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-[#F43F5E]">
                  {r.prize}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      <div className="mt-16">
        <h2 className="section-title text-white">
          Historias de Ganadores
        </h2>
        <div className="neon-line" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 90}>
              <TestimonialCard {...t} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
