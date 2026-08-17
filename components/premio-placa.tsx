/**
 * Portada de un sorteo sin fotografía.
 *
 * Un premio en efectivo no tiene nada que fotografiar, así que en vez de
 * rellenar el hueco con una imagen genérica —o con un emoji gigante— se
 * compone una placa tipográfica con el dato que importa: cuánto se lleva el
 * ganador. Se usa siempre que el sorteo no trae imagen propia.
 */
export default function PremioPlaca({
  titulo,
  valor,
  className = "",
}: {
  titulo: string;
  valor: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-muted px-6 text-center ${className}`}
    >
      {/* Luz tenue desde arriba: da profundidad sin competir con la cifra. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(10,132,255,0.16),transparent_62%)]"
      />
      {/* Marco interior de un pelo: la placa se lee como una pieza, no como
          un hueco sin imagen. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 rounded-xl border border-border"
      />

      <p className="eyebrow relative">{titulo}</p>
      <p className="num relative mt-3 text-4xl font-medium text-white sm:text-5xl">
        {valor}
      </p>
      <p className="eyebrow relative mt-2">MXN</p>
    </div>
  );
}
