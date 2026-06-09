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
    <div className="card-neon p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#F43F5E] font-heading text-sm text-white">
          {avatar}
        </div>
        <div>
          <h4 className="font-heading text-sm text-white">{name}</h4>
          <p className="font-body text-xs text-[#F43F5E]">Ganó: {prize}</p>
        </div>
      </div>
      <p className="mt-3 font-body text-sm leading-relaxed text-[#E2E8F0]">
        &ldquo;{text}&rdquo;
      </p>
    </div>
  );
}
