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
    prize: "$50,000 MXN",
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
        <p className="mx-auto mt-4 max-w-lg font-body text-sm text-[#38BDF8]">
          Conoce a los ganadores de nuestros sorteos anteriores. Todos los
          resultados son verificados y transparentes.
        </p>
      </div>

      <Reveal className="mt-10 overflow-hidden rounded-xl border border-[#1E3A8A]">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="bg-[#16223A]">
              <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-[#38BDF8]">
                SORTEO
              </th>
              <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-[#38BDF8]">
                FECHA
              </th>
              <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-[#38BDF8]">
                GANADOR
              </th>
              <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-[#38BDF8]">
                N°
              </th>
              <th className="px-4 py-3 text-left font-heading text-xs tracking-wider text-[#38BDF8]">
                PREMIO
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E3A8A]/50">
            {pastResults.map((r) => (
              <tr
                key={r.id}
                className="bg-[#111A2E] transition-colors hover:bg-[#1A2540]"
              >
                <td className="px-4 py-3 font-heading text-white">
                  #{r.id}
                </td>
                <td className="px-4 py-3 text-[#E2E8F0]">{r.date}</td>
                <td className="px-4 py-3 font-medium text-white">
                  {r.winner}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-[#2563EB]/20 px-2 py-0.5 font-heading text-sm text-[#38BDF8]">
                    {r.number}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-[#22D3EE]">
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
