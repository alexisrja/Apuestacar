"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Guard every Server Action: Server Functions are reachable via direct POST,
 * not just through our UI, so we re-verify auth + admin here. Returns an admin
 * Supabase client (service_role key) that bypasses RLS — safe because we gate
 * on getUser() + isAdminEmail() first.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    throw new Error("No autorizado");
  }
  return getAdminClient();
}

// ---------------------------------------------------------------------------
// Sorteos CRUD
// ---------------------------------------------------------------------------

function parseSorteoForm(formData: FormData) {
  const numero = Number(formData.get("numero"));
  const errors: string[] = [];

  if (!Number.isInteger(numero) || numero <= 0) {
    errors.push("Número inválido");
  }
  const titulo = String(formData.get("titulo") ?? "").trim();
  const premio = String(formData.get("premio") ?? "").trim();
  if (!titulo) errors.push("Título requerido");
  if (!premio) errors.push("Premio requerido");

  const fechaRaw = String(formData.get("fecha") ?? "").trim();
  if (!fechaRaw) errors.push("Fecha requerida");

  const estado = String(formData.get("estado") ?? "activo");
  if (estado !== "activo" && estado !== "proximo") {
    errors.push("Estado inválido");
  }

  const row = {
    numero,
    titulo,
    premio,
    valor: String(formData.get("valor") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    // datetime-local has no timezone; store as-is (treated as ISO).
    fecha: fechaRaw ? new Date(fechaRaw).toISOString() : null,
    fecha_label: String(formData.get("fecha_label") ?? "").trim(),
    precio_boleto: Number(formData.get("precio_boleto") ?? 0),
    total_boletos: Number(formData.get("total_boletos") ?? 100),
    vendidos: Number(formData.get("vendidos") ?? 0),
    emoji: String(formData.get("emoji") ?? "🎟️").trim() || "🎟️",
    imagen: String(formData.get("imagen") ?? "").trim() || null,
    destacado: formData.get("destacado") === "on",
    estado,
  };

  return { row, errors };
}

function revalidateSorteoPages(id?: string) {
  revalidatePath("/admin/sorteos");
  revalidatePath("/admin/premios");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/premios");
  revalidatePath("/boletos");
  if (id) {
    revalidatePath(`/boletos/${id}`);
    revalidatePath(`/boletos/${id}/comprar`);
  }
}

export async function createSorteo(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const { row, errors } = parseSorteoForm(formData);
  if (errors.length) return { ok: false, error: errors.join(". ") };

  // The public id (URL slug) mirrors the numero for clean, stable links.
  const id = String(row.numero);

  const { error } = await supabase.from("sorteos").insert({ id, ...row });
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "Ya existe un sorteo con ese número."
          : error.message,
    };
  }

  revalidateSorteoPages(id);
  return { ok: true };
}

export async function updateSorteo(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const { row, errors } = parseSorteoForm(formData);
  if (errors.length) return { ok: false, error: errors.join(". ") };

  const { error } = await supabase
    .from("sorteos")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateSorteoPages(id);
  return { ok: true };
}

export async function updatePremio(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const imagen = String(formData.get("imagen") ?? "").trim() || null;
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  const { error } = await supabase
    .from("sorteos")
    .update({ imagen, descripcion, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateSorteoPages(id);
  return { ok: true };
}

export async function deleteSorteo(id: string): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("sorteos").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateSorteoPages(id);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Compras — confirm / cancel paid tickets
// ---------------------------------------------------------------------------

export async function setCompraEstado(
  id: string,
  estado: "pendiente" | "confirmada" | "cancelada",
): Promise<ActionResult> {
  if (!["pendiente", "confirmada", "cancelada"].includes(estado)) {
    return { ok: false, error: "Estado inválido" };
  }
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("compras")
    .update({ estado })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/boletos");
  revalidatePath("/admin");
  return { ok: true };
}
