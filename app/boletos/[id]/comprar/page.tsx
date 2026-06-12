import Link from "next/link";
import { notFound } from "next/navigation";
import TicketSelector from "@/components/ticket-selector";
import { getSorteo, getTakenNumbers } from "@/lib/sorteos";

export default async function ComprarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sorteo, takenNumbers] = await Promise.all([
    getSorteo(id),
    getTakenNumbers(id),
  ]);
  if (!sorteo) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <Link
        href={`/boletos/${sorteo.id}`}
        className="inline-flex items-center gap-1 font-body text-sm text-secondary transition-colors hover:text-white"
      >
        ← Volver al sorteo
      </Link>
      <div className="mt-6">
        <TicketSelector sorteo={sorteo} takenNumbers={takenNumbers} />
      </div>
    </div>
  );
}
