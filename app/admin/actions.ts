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
// Image upload to Supabase Storage
// ---------------------------------------------------------------------------

const BUCKET = "premios";

async function ensureBucket() {
  const supabase = getAdminClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
    });
  }
}

export async function uploadPremioImage(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const supabase = await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "No se seleccionó ningún archivo" };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `${crypto.randomUUID()}.${ext}`;

  await ensureBucket();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType: file.type });

  if (error) return { ok: false, error: error.message };

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return { ok: true, url: urlData.publicUrl };
}

export async function deletePremioImage(
  url: string,
): Promise<void> {
  const supabase = await requireAdmin();
  const path = url.split("/").pop();
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }
}

// ---------------------------------------------------------------------------
// Compras — confirm / cancel paid tickets
// ---------------------------------------------------------------------------

async function adjustVendidos(
  supabase: ReturnType<typeof getAdminClient>,
  sorteoId: string,
  delta: number,
) {
  const { data: sorteo } = await supabase
    .from("sorteos")
    .select("vendidos")
    .eq("id", sorteoId)
    .single();
  if (!sorteo) return;
  const nuevo = Math.max(0, Number(sorteo.vendidos) + delta);
  await supabase
    .from("sorteos")
    .update({ vendidos: nuevo })
    .eq("id", sorteoId);
}

export async function setCompraEstado(
  id: string,
  estado: "pendiente" | "confirmada" | "cancelada",
): Promise<ActionResult> {
  if (!["pendiente", "confirmada", "cancelada"].includes(estado)) {
    return { ok: false, error: "Estado inválido" };
  }
  const supabase = await requireAdmin();

  const { data: compra } = await supabase
    .from("compras")
    .select("estado, cantidad, sorteo_id")
    .eq("id", id)
    .single();
  if (!compra) return { ok: false, error: "Compra no encontrada" };

  const { error } = await supabase
    .from("compras")
    .update({ estado })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Auto‑update sorteo.vendidos when confirming or un‑confirming
  if (estado === "confirmada" && compra.estado !== "confirmada") {
    await adjustVendidos(supabase, compra.sorteo_id, Number(compra.cantidad));
  } else if (compra.estado === "confirmada" && estado !== "confirmada") {
    await adjustVendidos(supabase, compra.sorteo_id, -Number(compra.cantidad));
  }

  revalidateSorteoPages(compra.sorteo_id);
  revalidatePath("/admin/boletos");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Resultados CRUD
// ---------------------------------------------------------------------------

export async function createResultado(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const row = {
    sorteo_numero: Number(formData.get("sorteo_numero")),
    fecha: String(formData.get("fecha") ?? "").trim(),
    ganador: String(formData.get("ganador") ?? "").trim(),
    numero: String(formData.get("numero") ?? "").trim(),
    premio: String(formData.get("premio") ?? "").trim(),
  };
  if (!row.ganador || !row.numero || !row.premio) {
    return { ok: false, error: "Completa todos los campos" };
  }
  const { error } = await supabase.from("resultados").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/resultados");
  revalidatePath("/resultados");
  return { ok: true };
}

export async function deleteResultado(id: number): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("resultados").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/resultados");
  revalidatePath("/resultados");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Testimonios CRUD
// ---------------------------------------------------------------------------

export async function createTestimonio(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const row = {
    name: String(formData.get("name") ?? "").trim(),
    text: String(formData.get("text") ?? "").trim(),
    prize: String(formData.get("prize") ?? "").trim(),
    avatar: String(formData.get("avatar") ?? "").trim(),
  };
  if (!row.name || !row.text || !row.prize || !row.avatar) {
    return { ok: false, error: "Completa todos los campos" };
  }
  const { error } = await supabase.from("testimonios").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/testimonios");
  revalidatePath("/");
  revalidatePath("/resultados");
  return { ok: true };
}

export async function deleteTestimonio(id: number): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("testimonios").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/testimonios");
  revalidatePath("/");
  revalidatePath("/resultados");
  return { ok: true };
}

export async function deleteCompra(id: string): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { data: compra } = await supabase
    .from("compras")
    .select("estado, cantidad, sorteo_id")
    .eq("id", id)
    .single();
  if (!compra) return { ok: false, error: "Compra no encontrada" };

  // Decrement vendidos if the compra was confirmed
  if (compra.estado === "confirmada") {
    await adjustVendidos(supabase, compra.sorteo_id, -Number(compra.cantidad));
  }

  const { error } = await supabase.from("compras").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateSorteoPages(compra.sorteo_id);
  revalidatePath("/admin/boletos");
  return { ok: true };
}
