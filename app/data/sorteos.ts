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
  destacado?: boolean;
  estado: "activo" | "proximo";
}

export const sorteos: Sorteo[] = [
  {
    id: "12",
    numero: 12,
    titulo: "Gran Premio Final",
    premio: "MacBook Neo 2026",
    valor: "$14,999 MXN",
    descripcion:
      "Nuestro premio estrella: el nuevo MacBook Neo con chip de última generación, pantalla Liquid Retina y 32GB de RAM. El sorteo más esperado del año.",
    fecha: "2026-07-15T20:00:00",
    fechaLabel: "15 Julio, 2026",
    precioBoleto: 10,
    totalBoletos: 100,
    vendidos: 67,
    emoji: "💻",
    destacado: true,
    estado: "activo",
  },
  {
    id: "13",
    numero: 13,
    titulo: "Sorteo del Viajero",
    premio: "Viaje a Dubai",
    valor: "$25,000 USD",
    descripcion:
      "7 días todo incluido para 2 personas en el Burj Khalifa. Vuelos, hotel 5 estrellas y experiencias premium incluidas.",
    fecha: "2026-08-01T20:00:00",
    fechaLabel: "1 Agosto, 2026",
    precioBoleto: 15,
    totalBoletos: 100,
    vendidos: 31,
    emoji: "✈️",
    estado: "activo",
  },
  {
    id: "14",
    numero: 14,
    titulo: "Sorteo Millonario",
    premio: "Efectivo $50,000",
    valor: "$50,000 USD",
    descripcion:
      "Premio en efectivo sin condiciones. Depósito directo a tu cuenta dentro de las 48 horas posteriores al sorteo.",
    fecha: "2026-08-20T20:00:00",
    fechaLabel: "20 Agosto, 2026",
    precioBoleto: 20,
    totalBoletos: 100,
    vendidos: 12,
    emoji: "💰",
    estado: "activo",
  },
];

export function getSorteo(id: string): Sorteo | undefined {
  return sorteos.find((s) => s.id === id);
}
