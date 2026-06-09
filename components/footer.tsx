import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#1E3A8A] bg-[#0A0F1E]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="font-heading text-lg tracking-wider text-white">
              APUESTACAR
            </h3>
            <p className="mt-2 font-body text-sm text-[#38BDF8]">
              La rifa más emocionante con los mejores premios. Compra tus
              boletos y participa hoy.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm tracking-wider text-white">
              ENLACES
            </h4>
            <div className="flex flex-col gap-2 font-body text-sm text-[#E2E8F0]">
              <Link href="/" className="hover:text-[#38BDF8] transition-colors">
                Inicio
              </Link>
              <Link
                href="/boletos"
                className="hover:text-[#38BDF8] transition-colors"
              >
                Boletos
              </Link>
              <Link
                href="/premios"
                className="hover:text-[#38BDF8] transition-colors"
              >
                Premios
              </Link>
              <Link
                href="/resultados"
                className="hover:text-[#38BDF8] transition-colors"
              >
                Resultados
              </Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-heading text-sm tracking-wider text-white">
              CONTACTO
            </h4>
            <div className="flex flex-col gap-2 font-body text-sm text-[#E2E8F0]">
              <span>contacto@apuestacar.com</span>
              <span>+1 553-978-6961</span>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-[#1E3A8A]/50 pt-6 text-center font-body text-xs text-[#38BDF8]">
          © {new Date().getFullYear()} Apuestacar. Todos los derechos
          reservados.
        </div>
      </div>
    </footer>
  );
}
