import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Sorteo } from "@/app/data/sorteos";

/** Row shape as stored in Supabase (snake_case). */
interface SorteoRow {
  id: string;
  numero: number;
  titulo: string;
  premio: string;
  valor: string;
  descripcion: string;
  fecha: string;
  fecha_label: string;
  precio_boleto: number;
  total_boletos: number;
  vendidos: number;
  emoji: string;
  imagen: string | null;
  destacado: boolean;
  estado: "activo" | "proximo";
}

const COLUMNS =
  "id, numero, titulo, premio, valor, descripcion, fecha, fecha_label, precio_boleto, total_boletos, vendidos, emoji, imagen, destacado, estado";

/**
 * Etiqueta legible de la fecha del sorteo.
 *
 * `fecha_label` se captura a mano en el panel y suele quedar vacío, pero la
 * fecha real siempre está en `fecha`. Cuando falta la etiqueta se deriva de
 * ahí en vez de dejar huecos en la interfaz ("Sorteo 1 ·", "Cierra el ").
 * La zona horaria se fija para que el servidor y el navegador coincidan.
 */
function etiquetaFecha(row: SorteoRow): string {
  const manual = row.fecha_label?.trim();
  if (manual) return manual;
  if (!row.fecha) return "";

  const d = new Date(row.fecha);
  if (Number.isNaN(d.getTime())) return "";

  const zona = "America/Mexico_City";
  const anioSorteo = Number(
    new Intl.DateTimeFormat("es-MX", { year: "numeric", timeZone: zona }).format(d),
  );
  const anioActual = Number(
    new Intl.DateTimeFormat("es-MX", { year: "numeric", timeZone: zona }).format(
      new Date(),
    ),
  );

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    // El año sólo aparece cuando no es obvio.
    ...(anioSorteo === anioActual ? {} : { year: "numeric" }),
    timeZone: zona,
  }).format(d);
}

function toSorteo(row: SorteoRow): Sorteo {
  return {
    id: row.id,
    numero: row.numero,
    titulo: row.titulo,
    premio: row.premio,
    valor: row.valor,
    descripcion: row.descripcion,
    fecha: row.fecha,
    fechaLabel: etiquetaFecha(row),
    precioBoleto: Number(row.precio_boleto),
    totalBoletos: row.total_boletos,
    vendidos: row.vendidos,
    emoji: row.emoji,
    // La columna es `not null`, así que "sin foto" llega como cadena vacía.
    // Se normaliza para que el resto del código sólo pregunte si existe.
    imagen: row.imagen?.trim() ? row.imagen : undefined,
    destacado: row.destacado,
    estado: row.estado,
  };
}

/** All sorteos, ordered by numero (desc). Cached per render. */
export const getSorteos = cache(async (): Promise<Sorteo[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sorteos")
    .select(COLUMNS)
    .order("numero", { ascending: false });
  return ((data as SorteoRow[] | null) ?? []).map(toSorteo);
});

/**
 * Numbers unavailable for a given sorteo: confirmed compras (permanent) plus
 * active reservas (temporary 1h holds whose `expires_at` is still in the
 * future). Expired holds are ignored, so they free up automatically. Cached per
 * render.
 */
export const getTakenNumbers = cache(async (sorteoId: string): Promise<string[]> => {
  const supabase = getAdminClient();
  const nowIso = new Date().toISOString();

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

  const numeros = [
    ...(compras ?? []),
    ...(reservas ?? []),
  ].flatMap((r) => (r.numeros ?? []) as string[]);

  // De-duplicate in case a number is held and confirmed at the same time.
  return [...new Set(numeros)];
});

/** The date of the nearest upcoming sorteo, or null. Cached per render. */
export const getProximaFecha = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("sorteos")
    .select("fecha")
    .gte("fecha", now)
    .order("fecha", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.fecha ?? null;
});

/** A single sorteo by its public id (slug), or null if not found. Cached per render. */
export const getSorteo = cache(async (id: string): Promise<Sorteo | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sorteos")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return data ? toSorteo(data as SorteoRow) : null;
});
