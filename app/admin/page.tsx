import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface CompraRow {
  id: string;
  sorteo_numero: number | null;
  sorteo_premio: string | null;
  cantidad: number;
  total: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  created_at: string;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#1E3A8A] bg-[#111A2E] p-5">
      <p className="font-heading text-xs tracking-wider text-[#38BDF8]">
        {label}
      </p>
      <p
        className={`mt-2 font-heading text-3xl ${accent ? "text-[#22D3EE] glow-text" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: sorteosCount }, { data: comprasData }] = await Promise.all([
    supabase.from("sorteos").select("id", { count: "exact", head: true }),
    supabase
      .from("compras")
      .select(
        "id, sorteo_numero, sorteo_premio, cantidad, total, estado, created_at",
      )
      .order("created_at", { ascending: false }),
  ]);

  const compras = (comprasData ?? []) as CompraRow[];
  const pendientes = compras.filter((c) => c.estado === "pendiente");
  const confirmadas = compras.filter((c) => c.estado === "confirmada");
  const ingresos = confirmadas.reduce((sum, c) => sum + Number(c.total), 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="SORTEOS" value={String(sorteosCount ?? 0)} />
        <StatCard label="BOLETOS PENDIENTES" value={String(pendientes.length)} />
        <StatCard label="BOLETOS CONFIRMADOS" value={String(confirmadas.length)} />
        <StatCard label="INGRESOS CONFIRMADOS" value={`$${ingresos} MXN`} accent />
      </div>

      <div className="rounded-2xl border border-[#1E3A8A] bg-[#111A2E] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-white">
            Boletos por <span className="text-gradient">confirmar</span>
          </h2>
          <Link
            href="/admin/boletos"
            className="font-body text-sm text-[#38BDF8] transition-colors hover:text-white"
          >
            Ver todos →
          </Link>
        </div>
        <div className="neon-line !mx-0 !my-4 !w-16" />

        {pendientes.length === 0 ? (
          <p className="font-body text-sm text-[#38BDF8]">
            No hay boletos pendientes. ¡Todo al día! 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {pendientes.slice(0, 6).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-[#1E3A8A]/60 bg-[#16223A]/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm text-white">
                    Sorteo #{c.sorteo_numero ?? "—"}
                    {c.sorteo_premio ? ` · ${c.sorteo_premio}` : ""}
                  </p>
                  <p className="font-body text-xs text-[#38BDF8]">
                    {new Date(c.created_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {c.cantidad} boleto{c.cantidad === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="shrink-0 font-heading text-sm text-[#22D3EE]">
                  ${c.total} MXN
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
