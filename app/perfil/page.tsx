import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
  confirmada: "border-[#22D3EE]/40 bg-[#22D3EE]/10 text-[#22D3EE]",
  cancelada: "border-[#EF4444]/40 bg-[#EF4444]/10 text-[#FCA5A5]",
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
        <div className="rounded-2xl border border-[#1E3A8A] bg-[#111A2E] p-6 sm:p-8">
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
              <p className="mt-1 truncate font-body text-sm text-[#38BDF8]">
                {user.email}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full border border-[#1E3A8A] bg-[#16223A]/60 px-3 py-1 font-body text-xs text-[#38BDF8]">
                  Miembro desde {memberSince}
                </span>
                <span className="rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-1 font-body text-xs text-[#22D3EE]">
                  {totalBoletos} boleto{totalBoletos === 1 ? "" : "s"}
                </span>
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
              className="font-body text-sm text-[#38BDF8] transition-colors hover:text-white"
            >
              Comprar más →
            </Link>
          </div>
          <div className="neon-line !mx-0 !my-4 !w-16" />

          {boletos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1E3A8A] bg-[#111A2E]/60 p-8 text-center">
              <div className="text-4xl" aria-hidden="true">
                🎫
              </div>
              <p className="mt-3 font-heading text-sm text-white">
                Aún no tienes boletos
              </p>
              <p className="mt-1 font-body text-xs text-[#38BDF8]">
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
                  className="rounded-xl border border-[#1E3A8A] bg-[#111A2E] p-4 transition-colors hover:border-[#2563EB] sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-xs text-[#38BDF8]">
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
                        className="rounded-md border border-[#1E3A8A] bg-[#16223A] px-2 py-0.5 font-heading text-xs text-[#E2E8F0]"
                      >
                        {n}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#1E3A8A]/60 pt-3 font-body text-xs">
                    <span className="text-[#38BDF8]">
                      {new Date(c.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-[#E2E8F0]">
                      {c.cantidad} boleto{c.cantidad === 1 ? "" : "s"} ·{" "}
                      <span className="font-heading text-[#22D3EE]">
                        ${c.total} USD
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---------- Settings / actions ---------- */}
        <div className="mt-8 rounded-2xl border border-[#1E3A8A] bg-[#111A2E] p-6 sm:p-8">
          <h2 className="font-heading text-lg text-white">Ajustes de cuenta</h2>
          <ProfileActions initialName={displayName} />
        </div>
      </div>
    </div>
  );
}
