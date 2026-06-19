import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface Testimonio {
  id: number;
  name: string;
  text: string;
  prize: string;
  avatar: string;
  created_at: string;
}

/** All testimonios, newest first. Cached per render. */
export const getTestimonios = cache(async (): Promise<Testimonio[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonios")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Testimonio[];
});
