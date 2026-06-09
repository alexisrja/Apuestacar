"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** delay in ms before the reveal animation runs */
  delay?: number;
  /** wrapper element tag */
  as?: "div" | "section" | "li";
  className?: string;
}

export default function Reveal({
  children,
  delay = 0,
  as = "div",
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // reduced-motion is handled in CSS (.reveal forced visible via media query)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
