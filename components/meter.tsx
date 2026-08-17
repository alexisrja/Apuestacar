/**
 * Ocupación de un sorteo.
 *
 * Es el objeto que se repite en todo el sitio: una regla de un pelo con el
 * tramo vendido lleno, y el dato en cifras tabulares. Dice cuántos boletos
 * quedan sin adornar el número — la escasez real es el argumento de venta,
 * no un porcentaje inflado.
 */
export default function Meter({
  vendidos,
  total,
  className = "",
}: {
  vendidos: number;
  total: number;
  className?: string;
}) {
  const seguros = Math.min(Math.max(vendidos, 0), total);
  const pct = total > 0 ? Math.round((seguros / total) * 100) : 0;
  const quedan = total - seguros;
  // A partir de 4 de cada 5 vendidos el dato cambia de carácter: ya no informa,
  // avisa. Se marca con color semántico + palabra, nunca sólo con color.
  const casiLleno = pct >= 80;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-secondary">
          <span
            className={`num font-medium ${
              casiLleno ? "text-warning" : "text-white"
            }`}
          >
            {quedan}
          </span>{" "}
          {quedan === 1 ? "boleto disponible" : "boletos disponibles"}
          {casiLleno && (
            <span className="text-warning"> · por agotarse</span>
          )}
        </p>
        <p className="num shrink-0 text-xs text-secondary">
          {seguros}/{total}
        </p>
      </div>
      <div
        className={`meter mt-2 ${casiLleno ? "meter-alto" : ""}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% de los boletos vendidos`}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
