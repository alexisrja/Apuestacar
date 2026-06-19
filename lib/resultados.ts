import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface Resultado {
  id: number;
  sorteo_numero: number;
  fecha: string;
  ganador: string;
  numero: string;
  premio: string;
  created_at: string;
}

/** All resultados, ordered by sorteo_numero desc. Cached per render. */
export const getResultados = cache(async (): Promise<Resultado[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resultados")
    .select("*")
    .order("sorteo_numero", { ascending: false });
  return (data ?? []) as Resultado[];
});
