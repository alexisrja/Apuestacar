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

export async function getResultados(): Promise<Resultado[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resultados")
    .select("*")
    .order("sorteo_numero", { ascending: false });
  return (data ?? []) as Resultado[];
}
