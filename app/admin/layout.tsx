import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sorteos", label: "Sorteos" },
  { href: "/admin/boletos", label: "Boletos" },
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
        <div className="flex flex-col gap-4 border-b border-[#1E3A8A] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-xs tracking-widest text-[#22D3EE]">
              PANEL DE ADMINISTRACIÓN
            </p>
            <h1 className="mt-1 font-heading text-2xl text-white sm:text-3xl">
              Apuesta<span className="text-gradient">car</span> Admin
            </h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-[#1E3A8A] bg-[#16223A]/60 px-4 py-2 font-heading text-sm text-[#E2E8F0] transition-colors hover:border-[#2563EB] hover:text-white"
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
