import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CompraActions from "@/components/admin/compra-actions";

type Estado = "pendiente" | "confirmada" | "cancelada";

interface CompraRow {
  id: string;
  user_id: string;
  sorteo_id: string;
  sorteo_numero: number | null;
  sorteo_titulo: string | null;
  sorteo_premio: string | null;
  numeros: string[];
  cantidad: number;
  total: number;
  estado: Estado;
  created_at: string;
}

const estadoStyles: Record<Estado, string> = {
  pendiente: "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FCD34D]",
  confirmada: "border-accent/40 bg-accent/10 text-accent",
  cancelada: "border-destructive/40 bg-destructive/10 text-[#FCA5A5]",
};

const estadoLabel: Record<Estado, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

const filters: { key: string; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "confirmada", label: "Confirmados" },
  { key: "cancelada", label: "Cancelados" },
];

export default async function AdminBoletosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const active = filters.some((f) => f.key === estado) ? estado! : "todos";

  const supabase = await createClient();
  let query = supabase
    .from("compras")
    .select(
      "id, user_id, sorteo_id, sorteo_numero, sorteo_titulo, sorteo_premio, numeros, cantidad, total, estado, created_at",
    )
    .order("created_at", { ascending: false });

  if (active !== "todos") query = query.eq("estado", active);

  const { data } = await query;
  const compras = (data ?? []) as CompraRow[];

  return (
    <div>
      <h2 className="font-heading text-xl text-white">
        Confirmación de <span className="text-gradient">Boletos</span>
      </h2>
      <p className="mt-1 font-body text-sm text-secondary">
        Revisa las solicitudes de compra y confirma los boletos pagados.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key === "todos" ? "/admin/boletos" : `/admin/boletos?estado=${f.key}`}
            className={`rounded-full border px-4 py-1.5 font-heading text-xs transition-colors ${
              active === f.key
                ? "border-primary bg-primary/20 text-white"
                : "border-border bg-muted/50 text-secondary hover:text-white"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {compras.length === 0 && (
          <li className="rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center font-body text-sm text-secondary">
            No hay boletos en esta categoría.
          </li>
        )}
        {compras.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-border bg-surface p-4 sm:p-5"
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
                <p className="mt-0.5 font-body text-[10px] text-secondary/70">
                  Usuario: {c.user_id.slice(0, 8)}… ·{" "}
                  {new Date(c.created_at).toLocaleString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
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

            <div className="mt-3 flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-body text-xs text-foreground">
                {c.cantidad} boleto{c.cantidad === 1 ? "" : "s"} ·{" "}
                <span className="font-heading text-accent">
                  ${c.total} MXN
                </span>
              </span>
              <CompraActions id={c.id} estado={c.estado} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
