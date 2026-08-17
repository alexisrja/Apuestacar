import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import ProfileActions from "@/components/profile-actions";
import AvatarUpload from "@/components/avatar-upload";

export const metadata: Metadata = {
  title: "Mi Perfil",
  robots: { index: false, follow: false },
};

interface Compra {
  id: string;
  sorteo_id: string;
  sorteo_numero: number | null;
  sorteo_titulo: string | null;
  sorteo_premio: string | null;
  numeros: string[];
  cantidad: number;
  total: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  created_at: string;
}

const estadoStyles: Record<Compra["estado"], string> = {
  pendiente: "border-warning/40 bg-warning/10 text-warning",
  confirmada: "border-success/40 bg-success/10 text-success",
  cancelada: "border-destructive/40 bg-destructive/10 text-destructive",
};

const estadoLabel: Record<Compra["estado"], string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = isAdminEmail(user.email);

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? "";
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ?? null;

  const initials = (displayName || user.email || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const memberSince = new Date(user.created_at).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { data: compras } = await supabase
    .from("compras")
    .select(
      "id, sorteo_id, sorteo_numero, sorteo_titulo, sorteo_premio, numeros, cantidad, total, estado, created_at",
    )
    .order("created_at", { ascending: false });

  const boletos = (compras ?? []) as Compra[];
  const totalBoletos = boletos.reduce((sum, c) => sum + c.cantidad, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="page-fade">
        {/* ---------- Header ---------- */}
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
            <AvatarUpload
              userId={user.id}
              initialUrl={avatarUrl}
              initials={initials}
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="h-section truncate text-2xl text-white sm:text-3xl">
                {displayName || "Mi perfil"}
              </h1>
              <p className="mt-1 truncate text-sm text-secondary">
                {user.email}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-secondary">
                  Miembro desde {memberSince}
                </span>
                <span className="num rounded-full border border-border bg-muted px-3 py-1 text-xs text-white">
                  {totalBoletos} boleto{totalBoletos === 1 ? "" : "s"}
                </span>
                {admin && (
                  <Link
                    href="/admin"
                    className="rounded-full border border-primary/50 bg-primary/15 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-primary/25"
                  >
                    Panel admin
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Mis Boletos ---------- */}
        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Compras</p>
              <h2 className="h-section mt-2 text-xl text-white">Mis boletos</h2>
            </div>
            <Link
              href="/boletos"
              className="flex min-h-11 items-center text-sm text-secondary transition-colors hover:text-white"
            >
              Comprar más →
            </Link>
          </div>

          {boletos.length === 0 ? (
            <div className="card mt-6 p-8 text-center">
              <p className="h-section text-base text-white">
                Aún no tienes boletos
              </p>
              <p className="measure mx-auto mt-2 text-sm text-secondary">
                Las compras que hagas con la sesión iniciada aparecen aquí.
                También puedes comprar sin cuenta, pero entonces no quedan
                guardadas.
              </p>
              <Link href="/boletos" className="btn-accent mt-6 text-sm">
                Ver sorteos
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {boletos.map((c) => (
                <li key={c.id} className="card card-hover p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="eyebrow">
                        Sorteo {c.sorteo_numero ?? c.sorteo_id}
                        {c.sorteo_titulo ? ` · ${c.sorteo_titulo}` : ""}
                      </p>
                      {c.sorteo_premio && (
                        <p className="h-section mt-1.5 truncate text-base text-white">
                          {c.sorteo_premio}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${estadoStyles[c.estado]}`}
                    >
                      {estadoLabel[c.estado]}
                    </span>
                  </div>

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {c.numeros.map((n) => (
                      <li
                        key={n}
                        className="num rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-white"
                      >
                        {n}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="text-secondary">
                      {new Date(c.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-secondary">
                      {c.cantidad} boleto{c.cantidad === 1 ? "" : "s"} ·{" "}
                      <span className="num font-medium text-white">
                        ${c.total} MXN
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---------- Settings / actions ---------- */}
        <div className="card mt-10 p-6 sm:p-8">
          <h2 className="h-section text-lg text-white">Ajustes de cuenta</h2>
          <ProfileActions initialName={displayName} />
          {admin && (
            <div className="mt-6 rounded-xl border border-border bg-muted p-4">
              <p className="text-sm font-medium text-white">Panel de control</p>
              <p className="mt-1 text-xs text-secondary">
                Tu cuenta tiene acceso administrativo.
              </p>
              <Link href="/admin" className="btn-outline mt-4 text-sm">
                Ir al panel de control
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
