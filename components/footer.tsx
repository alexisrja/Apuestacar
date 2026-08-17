import Link from "next/link";

const enlaces = [
  { href: "/", label: "Inicio" },
  { href: "/boletos", label: "Boletos" },
  { href: "/premios", label: "Premios" },
  { href: "/resultados", label: "Resultados" },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <p className="font-heading text-lg font-bold tracking-[-0.02em] text-white">
              RIFAS JAPS
            </p>
            <p className="measure mt-2 text-sm text-secondary">
              Sorteos con números publicados y resultados verificables. Compra
              tus boletos y sigue el sorteo hasta el final.
            </p>
          </div>

          <nav aria-label="Secciones">
            <p className="eyebrow">Secciones</p>
            <ul className="mt-4 flex flex-col gap-1">
              {enlaces.map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    className="flex min-h-11 items-center text-sm text-secondary transition-colors hover:text-white"
                  >
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow">Contacto</p>
            <ul className="mt-4 flex flex-col gap-1">
              <li>
                <a
                  href="mailto:contacto@apuestacar.com"
                  className="flex min-h-11 items-center text-sm text-secondary transition-colors hover:text-white"
                >
                  contacto@apuestacar.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+15539786961"
                  className="num flex min-h-11 items-center text-sm text-secondary transition-colors hover:text-white"
                >
                  +1 553-978-6961
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-border pt-6 text-xs text-secondary">
          © {new Date().getFullYear()} RIFAS JAPS. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}
