"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sorteos", label: "Sorteos" },
  { href: "/admin/premios", label: "Premios" },
  { href: "/admin/boletos", label: "Boletos" },
  { href: "/admin/resultados", label: "Resultados" },
  { href: "/admin/testimonios", label: "Testimonios" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
      {adminLinks.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-lg border px-4 py-2 font-heading text-sm transition-colors ${
              active
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-muted/60 text-foreground hover:border-primary hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
