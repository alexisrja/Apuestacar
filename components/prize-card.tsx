import type { StaticImageData } from "next/image";
import PremioPlaca from "@/components/premio-placa";

interface PrizeCardProps {
  title: string;
  /** Categoría del premio, p. ej. "Premio en efectivo". */
  titulo: string;
  description: string;
  value: string;
  /** Foto del premio; null cuando el sorteo no tiene una. */
  image: string | StaticImageData | null;
}

export default function PrizeCard({
  title,
  titulo,
  description,
  value,
  image,
}: PrizeCardProps) {
  const src = typeof image === "string" ? image : image?.src;

  return (
    <article className="card card-hover h-full overflow-hidden">
      <div className="zoom-marco aspect-[16/10] bg-muted">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <PremioPlaca titulo={titulo} valor={value} />
        )}
      </div>
      <div className="p-5">
        <h3 className="h-section text-lg text-white">{title}</h3>
        <p className="mt-1.5 text-sm text-secondary">{description}</p>
        <p className="num mt-4 text-sm font-medium text-white">{value}</p>
      </div>
    </article>
  );
}
