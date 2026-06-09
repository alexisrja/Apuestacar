interface Segment {
  text: string;
  className?: string;
}

interface Props {
  /** segments of text; each can have its own className (e.g. gradient) */
  segments: Segment[];
  className?: string;
  /** seconds of phase offset between each letter (creates the wave) */
  stagger?: number;
}

export default function AnimatedText({
  segments,
  className = "",
  stagger = 0.12,
}: Props) {
  let i = 0;

  return (
    <span className={`anim-letters ${className}`}>
      {segments.map((seg, si) => (
        <span key={si} className={seg.className}>
          {Array.from(seg.text).map((ch, ci) => (
            <span
              key={ci}
              // negative delay → every letter is already mid-motion (seamless wave)
              style={{ animationDelay: `${-(i++) * stagger}s` }}
              aria-hidden="true"
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
      ))}
      {/* full text for screen readers */}
      <span className="sr-only">{segments.map((s) => s.text).join("")}</span>
    </span>
  );
}
