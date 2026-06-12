import type { StaticImageData } from "next/image";

interface PrizeCardProps {
  title: string;
  description: string;
  value: string;
  image: string | StaticImageData;
}

export default function PrizeCard({
  title,
  description,
  value,
  image,
}: PrizeCardProps) {
  return (
    <div className="card-neon group overflow-hidden">
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30">
        {typeof image === "string" ? (
          image.startsWith("/") ||
          /^https?:\/\//i.test(image) ||
          /\.(png|jpe?g|webp|gif|svg)$/i.test(image) ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-5xl">{image}</span>
          )
        ) : (
          <img
            src={image.src}
            alt={title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-5">
        <h3 className="font-heading text-lg text-white">{title}</h3>
        <p className="mt-1 font-body text-sm text-secondary">{description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="glow-text font-heading text-sm text-accent">
            {value}
          </span>
          <span className="font-body text-xs text-foreground">Ver detalle</span>
        </div>
      </div>
    </div>
  );
}
