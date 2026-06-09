"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/boletos", label: "Boletos" },
  { href: "/premios", label: "Premios" },
  { href: "/resultados", label: "Resultados" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const accountHref = signedIn ? "/perfil" : "/login";
  const accountLabel = signedIn ? "Mi Perfil" : "Iniciar Sesión";

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1E3A8A] bg-[#0A0F1E]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-heading text-xl tracking-wider text-white glow-text"
        >
          APUESTACAR
        </Link>

        <button
          className="flex flex-col gap-1 sm:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menú de navegación"
          aria-expanded={open}
        >
          <span
            className={`block h-0.5 w-6 bg-white transition-all ${open ? "translate-y-1.5 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-all ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-all ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
          />
        </button>

        <div className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm font-medium text-[#E2E8F0] transition-colors hover:text-[#38BDF8]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={accountHref}
            className="font-body text-sm font-medium text-[#38BDF8] transition-colors hover:text-white"
          >
            {accountLabel}
          </Link>
          <Link href="/boletos" className="btn-accent text-sm !py-2 !px-5">
            Comprar Boletos
          </Link>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#1E3A8A] bg-[#0A0F1E] px-4 pb-4 pt-2 sm:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 font-body text-sm text-[#E2E8F0] transition-colors hover:text-[#38BDF8]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={accountHref}
            className="block py-2 font-body text-sm text-[#38BDF8] transition-colors hover:text-white"
            onClick={() => setOpen(false)}
          >
            {accountLabel}
          </Link>
          <Link
            href="/boletos"
            className="btn-accent mt-3 block text-center text-sm"
            onClick={() => setOpen(false)}
          >
            Comprar Boletos
          </Link>
        </div>
      )}
    </nav>
  );
}
