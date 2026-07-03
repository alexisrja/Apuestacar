import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TicketSelector from "@/components/ticket-selector";
import { getSorteo, getTakenNumbers } from "@/lib/sorteos";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/client";

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

  // Comprar requiere cuenta: si no hay sesión, mandamos a registro/login y
  // volvemos a esta misma página (con la promo) al terminar.
  if (supabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const promoQs = promoRaw ? `?promo=${encodeURIComponent(promoRaw)}` : "";
      const next = `/boletos/${id}/comprar${promoQs}`;
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }
  }

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
        <TicketSelector
          sorteo={sorteo}
          takenNumbers={takenNumbers}
          promoCantidad={promoCantidad}
        />
      </div>
    </div>
  );
}
