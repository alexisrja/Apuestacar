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

function toSorteo(row: SorteoRow): Sorteo {
  return {
    id: row.id,
    numero: row.numero,
    titulo: row.titulo,
    premio: row.premio,
    valor: row.valor,
    descripcion: row.descripcion,
    fecha: row.fecha,
    fechaLabel: row.fecha_label,
    precioBoleto: Number(row.precio_boleto),
    totalBoletos: row.total_boletos,
    vendidos: row.vendidos,
    emoji: row.emoji,
    imagen: row.imagen ?? undefined,
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

/** Numbers already taken (confirmed compras) for a given sorteo. Cached per render. */
export const getTakenNumbers = cache(async (sorteoId: string): Promise<string[]> => {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("compras")
    .select("numeros")
    .eq("sorteo_id", sorteoId)
    .eq("estado", "confirmada");
  return (data ?? []).flatMap((r) => (r.numeros ?? []) as string[]);
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
