import Image from "next/image";
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
      <div className="aspect-video bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center overflow-hidden">
        {typeof image === "string" ? (
          image.startsWith("/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(image) ? (
            <Image
              src={image}
              alt={title}
              width={800}
              height={450}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-5xl">{image}</span>
          )
        ) : (
          <Image src={image} alt={title} width={800} height={450} className="object-cover w-full h-full" />
        )}
      </div>
      <div className="p-5">
        <h3 className="font-heading text-lg text-white">{title}</h3>
        <p className="mt-1 font-body text-sm text-secondary">{description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-heading text-sm text-accent glow-text">
            {value}
          </span>
          <span className="font-body text-xs text-foreground">Ver detalle</span>
        </div>
      </div>
    </div>
  );
}
