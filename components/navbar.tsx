"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createClient,
  isInvalidRefreshTokenError,
  supabaseConfigured,
} from "@/lib/supabase/client";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/boletos", label: "Boletos" },
  { href: "/premios", label: "Premios" },
  { href: "/resultados", label: "Resultados" },
];

function AccountIcon({
  signedIn,
  avatarUrl,
}: {
  signedIn: boolean;
  avatarUrl: string | null;
}) {
  if (signedIn && avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        loading="lazy"
        className="-my-0.5 h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-border-strong"
      />
    );
  }
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

function NavLink({
  href,
  label,
  active,
  onClick,
  mobile,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-2 text-sm font-medium transition-colors ${
        mobile ? "min-h-11 py-1" : ""
      } ${active ? "text-white" : "text-secondary hover:text-white"}`}
    >
      {/* La ubicación actual se marca con una señal propia, no sólo con color. */}
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full bg-primary transition-opacity ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  // El panel sigue montado mientras se repliega: si desapareciera al instante
  // no habría salida que ver. Se desmonta cuando termina la animación.
  const [cerrando, setCerrando] = useState(false);

  const cerrarPanel = () => {
    // Con movimiento reducido la animación está anulada, así que `animationend`
    // nunca llegaría y el panel se quedaría abierto: ahí se cierra directo.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(false);
      return;
    }
    setCerrando(true);
  };

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        setSignedIn(!!data.user);
        setAvatarUrl(
          (data.user?.user_metadata?.avatar_url as string | undefined) ??
            null,
        );
      })
      .catch(async (error) => {
        if (!isInvalidRefreshTokenError(error)) return;

        await supabase.auth.signOut({ scope: "local" });
        setSignedIn(false);
        setAvatarUrl(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
      setAvatarUrl(
        (session?.user?.user_metadata?.avatar_url as string | undefined) ??
          null,
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  // El menú móvil se cierra desde el propio enlace que se tocó; no hace falta
  // sincronizarlo con la ruta después del render.

  // El filo de la barra sólo aparece cuando hay contenido pasando por debajo:
  // en el tope de la página la barra no separa nada, así que no dibuja nada.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const accountHref = signedIn ? "/perfil" : "/login";
  const accountLabel = signedIn ? "Mi perfil" : "Iniciar sesión";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
        scrolled
          ? "glass border-border"
          : "border-transparent bg-background"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-heading text-lg font-bold tracking-[-0.02em] text-white"
        >
          RIFAS JAPS
        </Link>

        <button
          className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-1 sm:hidden"
          onClick={() => (open ? cerrarPanel() : setOpen(true))}
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

        <div className="hidden items-center gap-7 sm:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(link.href)}
            />
          ))}
          <Link href={accountHref} className="btn-login text-sm">
            <AccountIcon signedIn={signedIn} avatarUrl={avatarUrl} />
            <span>{accountLabel}</span>
          </Link>
          <Link href="/boletos" className="btn-accent min-h-0! px-5! py-2! text-sm">
            Comprar boletos
          </Link>
        </div>
      </div>

      {open && (
        <div
          className={`${cerrando ? "panel-cierra" : "panel-abre"} border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:hidden`}
          onAnimationEnd={() => {
            if (!cerrando) return;
            setCerrando(false);
            setOpen(false);
          }}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(link.href)}
              mobile
              onClick={cerrarPanel}
            />
          ))}
          <Link
            href={accountHref}
            className="btn-login mt-2 w-full justify-center text-sm"
            onClick={cerrarPanel}
          >
            <AccountIcon signedIn={signedIn} avatarUrl={avatarUrl} />
            <span>{accountLabel}</span>
          </Link>
          <Link
            href="/boletos"
            className="btn-accent mt-3 w-full text-sm"
            onClick={cerrarPanel}
          >
            Comprar boletos
          </Link>
        </div>
      )}
    </nav>
  );
}
