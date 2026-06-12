import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sorteos", label: "Sorteos" },
  { href: "/admin/premios", label: "Premios" },
  { href: "/admin/boletos", label: "Boletos" },
  { href: "/admin/resultados", label: "Resultados" },
  { href: "/admin/testimonios", label: "Testimonios" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await getAdminContext();

  // Defense in depth: proxy.ts already gates this, but Server Components must
  // never trust the middleware alone.
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin) redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      <div className="page-fade">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-xs tracking-widest text-accent">
              PANEL DE ADMINISTRACIÓN
            </p>
            <h1 className="mt-1 font-heading text-2xl text-white sm:text-3xl">
              RIFAS JAPS Admin
            </h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-border bg-muted/60 px-4 py-2 font-heading text-sm text-foreground transition-colors hover:border-primary hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
