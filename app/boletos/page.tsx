import Link from "next/link";
import Reveal from "@/components/reveal";
import SorteoCard from "@/components/sorteo-card";
import { getSorteos } from "@/lib/sorteos";

export default async function BoletosPage() {
  const sorteos = await getSorteos();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="page-fade">
        <p className="eyebrow">Boletos</p>
        <h1 className="display mt-3 text-3xl text-white sm:text-5xl">
          Elige tu sorteo
        </h1>
        <p className="measure mt-3 text-sm text-secondary">
          Cada sorteo tiene su propio premio, precio de boleto y fecha. Los
          números que ves disponibles son los que quedan ahora mismo.
        </p>
      </header>

      {sorteos.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="h-section text-lg text-white">
            No hay sorteos abiertos
          </p>
          <p className="measure mx-auto mt-2 text-sm text-secondary">
            Estamos preparando el siguiente. Mientras tanto puedes revisar los
            sorteos que ya se cerraron.
          </p>
          <Link href="/resultados" className="btn-outline mt-6">
            Ver resultados
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorteos.map((sorteo, i) => (
            <Reveal key={sorteo.id} delay={i * 80}>
              <SorteoCard sorteo={sorteo} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
