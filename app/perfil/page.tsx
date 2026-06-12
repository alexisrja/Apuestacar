import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import ProfileActions from "@/components/profile-actions";
import AvatarUpload from "@/components/avatar-upload";

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
  pendiente: "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FCD34D]",
  confirmada: "border-accent/40 bg-accent/10 text-accent",
  cancelada: "border-destructive/40 bg-destructive/10 text-[#FCA5A5]",
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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="page-fade">
        {/* ---------- Header ---------- */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
            <AvatarUpload
              userId={user.id}
              initialUrl={avatarUrl}
              initials={initials}
            />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="truncate font-heading text-2xl text-white sm:text-3xl">
                {displayName || "Mi Perfil"}
              </h1>
              <p className="mt-1 truncate font-body text-sm text-secondary">
                {user.email}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full border border-border bg-muted/60 px-3 py-1 font-body text-xs text-secondary">
                  Miembro desde {memberSince}
                </span>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-body text-xs text-accent">
                  {totalBoletos} boleto{totalBoletos === 1 ? "" : "s"}
                </span>
                {admin && (
                  <Link
                    href="/admin"
                    className="rounded-full border border-primary bg-primary/20 px-3 py-1 font-heading text-xs text-white transition-colors hover:bg-primary/40"
                  >
                    ⚙ Panel admin
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Mis Boletos ---------- */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl text-white">
              Mis <span className="text-gradient">Boletos</span>
            </h2>
            <Link
              href="/boletos"
              className="font-body text-sm text-secondary transition-colors hover:text-white"
            >
              Comprar más →
            </Link>
          </div>
          <div className="neon-line !mx-0 !my-4 !w-16" />

          {boletos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
              <div className="text-4xl" aria-hidden="true">
                🎫
              </div>
              <p className="mt-3 font-heading text-sm text-white">
                Aún no tienes boletos
              </p>
              <p className="mt-1 font-body text-xs text-secondary">
                Las compras que realices estando dentro de tu cuenta aparecerán
                aquí.
              </p>
              <Link
                href="/boletos"
                className="btn-accent mt-5 inline-block text-sm"
              >
                Ver sorteos
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {boletos.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-xs text-secondary">
                        SORTEO #{c.sorteo_numero ?? c.sorteo_id}
                        {c.sorteo_titulo ? ` · ${c.sorteo_titulo}` : ""}
                      </p>
                      {c.sorteo_premio && (
                        <p className="mt-0.5 truncate font-heading text-base text-white">
                          {c.sorteo_premio}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 font-body text-xs ${estadoStyles[c.estado]}`}
                    >
                      {estadoLabel[c.estado]}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.numeros.map((n) => (
                      <span
                        key={n}
                        className="rounded-md border border-border bg-muted px-2 py-0.5 font-heading text-xs text-foreground"
                      >
                        {n}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 font-body text-xs">
                    <span className="text-secondary">
                      {new Date(c.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-foreground">
                      {c.cantidad} boleto{c.cantidad === 1 ? "" : "s"} ·{" "}
                      <span className="font-heading text-accent">
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
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="font-heading text-lg text-white">Ajustes de cuenta</h2>
          <ProfileActions initialName={displayName} />
          {admin && (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="font-heading text-sm text-white">Panel de control</p>
              <p className="mt-1 font-body text-xs text-secondary">
                Tienes acceso administrativo al panel del sitio.
              </p>
              <Link
                href="/admin"
                className="btn-outline mt-4 inline-flex text-sm"
              >
                Ir al panel de control
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
