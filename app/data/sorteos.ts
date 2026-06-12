// Shape of a sorteo as consumed by the UI. The data now lives in Supabase
// (table `public.sorteos`); see lib/sorteos.ts for the server-side queries.
// This module is type-only so it stays safe to import from Client Components.
export interface Sorteo {
  id: string;
  numero: number;
  titulo: string;
  premio: string;
  valor: string;
  descripcion: string;
  fecha: string; // ISO target date for countdown
  fechaLabel: string;
  precioBoleto: number;
  totalBoletos: number;
  vendidos: number;
  emoji: string;
  imagen?: string;
  destacado?: boolean;
  estado: "activo" | "proximo";
}
