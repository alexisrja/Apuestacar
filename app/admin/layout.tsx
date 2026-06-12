import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin";
import AdminNav from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await getAdminContext();

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
        </div>

        <AdminNav />

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
