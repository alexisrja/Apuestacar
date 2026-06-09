import Link from "next/link";
import PrizeCard from "@/components/prize-card";
import Reveal from "@/components/reveal";

const prizes = [
  {
    title: "Auto Deportivo 2025",
    description: "Último modelo con motor V8, completamente equipado",
    value: "$85,000 USD",
    image: "🏎️",
  },
  {
    title: "Viaje a Dubai",
    description: "7 días todo incluido para 2 personas en el Burj Khalifa",
    value: "$25,000 USD",
    image: "✈️",
  },
  {
    title: "Efectivo $50,000",
    description: "Premio en efectivo sin condiciones",
    value: "$50,000 USD",
    image: "💰",
  },
  {
    title: "Moto Deportiva",
    description: "Moto 1000cc última generación",
    value: "$18,000 USD",
    image: "🏍️",
  },
  {
    title: "TV 80 8K",
    description: "Televisor Samsung Neo QLED 8K",
    value: "$5,000 USD",
    image: "📺",
  },
  {
    title: "Paquete de Gift Cards",
    description: "$2,000 en tarjetas de regalo Amazon",
    value: "$2,000 USD",
    image: "🎁",
  },
];

export default function PremiosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="page-fade text-center">
        <h1 className="font-heading text-3xl text-white sm:text-4xl">
          Nuestros <span className="text-gradient">Premios</span>
        </h1>
        <div className="neon-line" />
        <p className="mx-auto mt-4 max-w-lg font-body text-sm text-[#38BDF8]">
          Estos son los increíbles premios que puedes ganar en nuestro próximo
          sorteo. ¡Compra tus boletos y participa!
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {prizes.map((prize, i) => (
          <Reveal key={prize.title} delay={i * 80}>
            <PrizeCard {...prize} />
          </Reveal>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="font-body text-sm text-[#38BDF8]">
          ¿Listo para ganar alguno de estos premios?
        </p>
        <Link href="/boletos" className="btn-accent mt-4 inline-block">
          Comprar Boletos
        </Link>
      </div>
    </div>
  );
}
