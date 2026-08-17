import type { StaticImageData } from "next/image";

interface PrizeCardProps {
  title: string;
  description: string;
  value: string;
  image: string | StaticImageData;
}

/** ¿La cadena es una ruta/URL de imagen, o un emoji de respaldo? */
function esImagen(v: string) {
  return (
    v.startsWith("/") ||
    /^https?:\/\//i.test(v) ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(v)
  );
}

export default function PrizeCard({
  title,
  description,
  value,
  image,
}: PrizeCardProps) {
  const src = typeof image === "string" ? image : image.src;
  const mostrarImagen = typeof image !== "string" || esImagen(image);

  return (
    <article className="card card-hover h-full overflow-hidden">
      <div className="zoom-marco aspect-[16/10] bg-muted">
        {mostrarImagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-5xl"
            aria-hidden="true"
          >
            {image as string}
          </span>
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
