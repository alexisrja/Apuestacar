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

/** All sorteos, ordered by numero (desc). Reads at request time. */
export async function getSorteos(): Promise<Sorteo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sorteos")
    .select(COLUMNS)
    .order("numero", { ascending: false });
  return ((data as SorteoRow[] | null) ?? []).map(toSorteo);
}

/** Numbers already taken (confirmed compras) for a given sorteo. */
export async function getTakenNumbers(sorteoId: string): Promise<string[]> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("compras")
    .select("numeros")
    .eq("sorteo_id", sorteoId)
    .eq("estado", "confirmada");
  return (data ?? []).flatMap((r) => (r.numeros ?? []) as string[]);
}

/** The date of the nearest upcoming sorteo, or null. */
export async function getProximaFecha(): Promise<string | null> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("sorteos")
    .select("fecha")
    .eq("estado", "proximo")
    .gte("fecha", now)
    .order("fecha", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data?.fecha) {
    // fallback: any sorteo with a future date
    const { data: fallback } = await supabase
      .from("sorteos")
      .select("fecha")
      .gte("fecha", now)
      .order("fecha", { ascending: true })
      .limit(1)
      .maybeSingle();
    return fallback?.fecha ?? null;
  }
  return data.fecha;
}

/** A single sorteo by its public id (slug), or null if not found. */
export async function getSorteo(id: string): Promise<Sorteo | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sorteos")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return data ? toSorteo(data as SorteoRow) : null;
}
