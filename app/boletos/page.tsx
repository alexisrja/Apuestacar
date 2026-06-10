import Reveal from "@/components/reveal";
import SorteoCard from "@/components/sorteo-card";
import { getSorteos } from "@/lib/sorteos";

export default async function BoletosPage() {
  const sorteos = await getSorteos();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="page-fade text-center">
        <h1 className="font-heading text-3xl text-white sm:text-4xl">
          Sorteos <span className="text-gradient">Activos</span>
        </h1>
        <div className="neon-line" />
        <p className="mx-auto mt-4 max-w-lg font-body text-sm text-secondary">
          Elige el sorteo en el que quieres participar. Cada uno tiene su propio
          premio, precio y números disponibles.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorteos.map((sorteo, i) => (
          <Reveal key={sorteo.id} delay={i * 90}>
            <SorteoCard sorteo={sorteo} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
