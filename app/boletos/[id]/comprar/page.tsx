import Link from "next/link";
import { notFound } from "next/navigation";
import TicketSelector from "@/components/ticket-selector";
import { getSorteo } from "@/lib/sorteos";

export default async function ComprarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sorteo = await getSorteo(id);
  if (!sorteo) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <Link
        href={`/boletos/${sorteo.id}`}
        className="inline-flex items-center gap-1 font-body text-sm text-[#38BDF8] transition-colors hover:text-white"
      >
        ← Volver al sorteo
      </Link>
      <div className="mt-6">
        <TicketSelector sorteo={sorteo} />
      </div>
    </div>
  );
}
