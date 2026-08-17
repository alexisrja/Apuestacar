import Link from "next/link";
import { notFound } from "next/navigation";
import TicketSelector from "@/components/ticket-selector";
import { getSorteo, getTakenNumbers } from "@/lib/sorteos";

export default async function ComprarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ promo?: string | string[] }>;
}) {
  const { id } = await params;
  const { promo } = await searchParams;
  const promoRaw = Array.isArray(promo) ? promo[0] : promo;
  const promoCantidad = promoRaw ? Number(promoRaw) : undefined;

  // La compra es abierta: se puede completar con o sin cuenta. Si hay sesión,
  // TicketSelector precarga los datos y guarda la compra en "Mis Boletos".
  const volverUrl = `/boletos/${id}/comprar${
    promoRaw ? `?promo=${encodeURIComponent(promoRaw)}` : ""
  }`;

  const [sorteo, takenNumbers] = await Promise.all([
    getSorteo(id),
    getTakenNumbers(id),
  ]);
  if (!sorteo) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href={`/boletos/${sorteo.id}`}
        transitionTypes={["nav-back"]}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-secondary transition-colors hover:text-white"
      >
        <span aria-hidden="true">←</span> Volver al sorteo
      </Link>
      <div className="mt-4">
        <TicketSelector
          sorteo={sorteo}
          takenNumbers={takenNumbers}
          promoCantidad={promoCantidad}
          volverUrl={volverUrl}
        />
      </div>
    </div>
  );
}
