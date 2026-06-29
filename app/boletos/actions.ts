"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";

export interface ReservaResult {
  ok: boolean;
  /** Id of the created reserva, used later to release it. */
  reservaId?: string;
  /** ISO timestamp at which the hold lapses. */
  expiresAt?: string;
  /** Numbers that were already taken (conflict), so the UI can refresh them. */
  ocupados?: string[];
  error?: string;
}

/** How long a hold lasts, in milliseconds (kept in sync with the DB default). */
const HOLD_MS = 60 * 60 * 1000; // 1 hora

/**
 * Hold a set of numbers for a sorteo for one hour. Verifies none are already
 * taken (confirmed compras or other active reservas) before inserting. If any
 * are unavailable it returns them in `ocupados` so the picker can mark them and
 * the user can choose again.
 */
export async function reservarBoletos(
  sorteoId: string,
  numeros: string[],
): Promise<ReservaResult> {
  if (!sorteoId || !Array.isArray(numeros) || numeros.length === 0) {
    return { ok: false, error: "Selección inválida" };
  }

  const supabase = getAdminClient();
  const nowIso = new Date().toISOString();

  // Gather everything currently unavailable for this sorteo.
  const [{ data: compras }, { data: reservas }] = await Promise.all([
    supabase
      .from("compras")
      .select("numeros")
      .eq("sorteo_id", sorteoId)
      .eq("estado", "confirmada"),
    supabase
      .from("reservas")
      .select("numeros")
      .eq("sorteo_id", sorteoId)
      .gt("expires_at", nowIso),
  ]);

  const ocupadosSet = new Set(
    [...(compras ?? []), ...(reservas ?? [])].flatMap(
      (r) => (r.numeros ?? []) as string[],
    ),
  );

  const conflicto = numeros.filter((n) => ocupadosSet.has(n));
  if (conflicto.length > 0) {
    return { ok: false, ocupados: conflicto, error: "Algunos boletos ya no están disponibles" };
  }

  const expiresAt = new Date(Date.now() + HOLD_MS).toISOString();
  const { data, error } = await supabase
    .from("reservas")
    .insert({ sorteo_id: sorteoId, numeros, expires_at: expiresAt })
    .select("id, expires_at")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "No se pudo apartar los boletos" };
  }

  revalidatePath(`/boletos/${sorteoId}/comprar`);
  revalidatePath(`/boletos/${sorteoId}`);

  return { ok: true, reservaId: data.id, expiresAt: data.expires_at };
}

/**
 * Release a hold early (e.g. the user goes back or starts over) so the numbers
 * become selectable again immediately instead of waiting for expiry.
 */
export async function liberarReserva(
  reservaId: string,
  sorteoId?: string,
): Promise<void> {
  if (!reservaId) return;
  const supabase = getAdminClient();
  await supabase.from("reservas").delete().eq("id", reservaId);
  if (sorteoId) {
    revalidatePath(`/boletos/${sorteoId}/comprar`);
    revalidatePath(`/boletos/${sorteoId}`);
  }
}
