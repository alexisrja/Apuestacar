interface TestimonialProps {
  name: string;
  text: string;
  prize: string;
  avatar: string;
}

export default function TestimonialCard({
  name,
  text,
  prize,
  avatar,
}: TestimonialProps) {
  return (
    <figure className="card h-full p-5">
      <blockquote className="text-sm leading-relaxed text-foreground">
        &ldquo;{text}&rdquo;
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-white"
        >
          {avatar}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-white">
            {name}
          </span>
          <span className="block truncate text-xs text-secondary">
            Ganó {prize}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
