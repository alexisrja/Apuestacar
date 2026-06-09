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

function AccountIcon({ signedIn }: { signedIn: boolean }) {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {signedIn ? (
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      ) : (
        <>
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </>
      )}
    </svg>
  );
}

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
          <Link href={accountHref} className="btn-login text-sm">
            <AccountIcon signedIn={signedIn} />
            <span>{accountLabel}</span>
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
            className="btn-login mt-2 w-full justify-center text-sm"
            onClick={() => setOpen(false)}
          >
            <AccountIcon signedIn={signedIn} />
            <span>{accountLabel}</span>
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
