// Promociones globales por cantidad EXACTA de boletos (precios en MXN).
// Aplican a todos los sorteos sin importar su precioBoleto individual.
// Solo se activan cuando la cantidad seleccionada coincide exactamente.
export interface Promo {
  cantidad: number;
  precio: number;
}

export const PROMOS: Promo[] = [
  { cantidad: 5, precio: 30 },
  { cantidad: 15, precio: 90 },
];

// Devuelve la promo que coincide exactamente con la cantidad, o null.
export function getPromo(cantidad: number): Promo | null {
  return PROMOS.find((p) => p.cantidad === cantidad) ?? null;
}

// Total a pagar: precio de promo si la cantidad es exacta, si no precio normal.
export function calcularTotal(cantidad: number, precioBoleto: number): number {
  const promo = getPromo(cantidad);
  return promo ? promo.precio : cantidad * precioBoleto;
}
