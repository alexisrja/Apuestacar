"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/client";
import { calcularTotal } from "@/lib/promos";
import { getSorteo } from "@/lib/sorteos";

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

export interface CompraInput {
  sorteoId: string;
  numeros: string[];
  nombre: string;
  telefono: string;
  email: string;
}

export interface CompraResult {
  ok: boolean;
  compraId?: string;
  error?: string;
}

/**
 * Register a purchase request (the WhatsApp hand-off) so it shows up in the
 * admin panel and, for signed-in users, in "Mis Boletos".
 *
 * Runs with the service role because guests have no session and there is no
 * anon INSERT policy on `compras` — an anonymous insert policy would let anyone
 * holding the public key fill the table. Everything the row is judged on is
 * derived here, not taken from the client: the owner comes from the session
 * cookie (never from a client-supplied id) and the total is recomputed from the
 * sorteo's real price.
 */
export async function registrarCompra(
  input: CompraInput,
): Promise<CompraResult> {
  const nombre = input.nombre?.trim() ?? "";
  const telefono = input.telefono?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const numeros = [...new Set(input.numeros ?? [])];

  if (numeros.length === 0) return { ok: false, error: "Selección vacía" };
  if (nombre.length < 3) return { ok: false, error: "Nombre inválido" };
  if (telefono.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "Teléfono inválido" };
  }

  const sorteo = await getSorteo(input.sorteoId);
  if (!sorteo) return { ok: false, error: "Sorteo no encontrado" };

  // Los números deben existir en este sorteo (evita filas con basura).
  const fueraDeRango = numeros.some((n) => {
    const v = Number(n);
    return !Number.isInteger(v) || v < 1 || v > sorteo.totalBoletos;
  });
  if (fueraDeRango) return { ok: false, error: "Números inválidos" };

  // El total NO se toma del cliente: se recalcula con el precio real y las
  // promos vigentes.
  const total = calcularTotal(numeros.length, sorteo.precioBoleto);

  // Dueño de la compra: sólo el de la cookie de sesión. Sin sesión es invitado.
  let userId: string | null = null;
  let userEmail: string | null = null;
  let userName: string | null = null;
  if (supabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      userEmail = user.email ?? null;
      userName =
        (user.user_metadata?.full_name as string | undefined) ?? null;
    }
  }

  const { data, error } = await getAdminClient()
    .from("compras")
    .insert({
      user_id: userId,
      user_email: userEmail ?? (email || null),
      user_name: userName ?? nombre,
      telefono,
      sorteo_id: sorteo.id,
      sorteo_numero: sorteo.numero,
      sorteo_titulo: sorteo.titulo,
      sorteo_premio: sorteo.premio,
      numeros,
      cantidad: numeros.length,
      total,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "No se pudo guardar la compra" };
  }

  revalidatePath("/admin/boletos");
  revalidatePath("/perfil");

  return { ok: true, compraId: data.id };
}
