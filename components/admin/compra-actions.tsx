"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCompraEstado } from "@/app/admin/actions";

type Estado = "pendiente" | "confirmada" | "cancelada";

export default function CompraActions({
  id,
  estado,
}: {
  id: string;
  estado: Estado;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (next: Estado) => {
    setError(null);
    startTransition(async () => {
      const result = await setCompraEstado(id, next);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Error");
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && (
        <span role="alert" className="font-body text-xs text-[#FCA5A5]">
          {error}
        </span>
      )}
      {estado !== "confirmada" && (
        <button
          type="button"
          onClick={() => run("confirmada")}
          disabled={pending}
          className="rounded-lg border border-[#22D3EE]/40 bg-[#22D3EE]/10 px-3 py-1.5 font-heading text-xs text-[#22D3EE] transition-colors hover:bg-[#22D3EE]/20 disabled:opacity-60"
        >
          {pending ? "…" : "Confirmar"}
        </button>
      )}
      {estado !== "cancelada" && (
        <button
          type="button"
          onClick={() => run("cancelada")}
          disabled={pending}
          className="rounded-lg border border-[#EF4444]/40 px-3 py-1.5 font-heading text-xs text-[#FCA5A5] transition-colors hover:bg-[#EF4444]/10 disabled:opacity-60"
        >
          {pending ? "…" : "Cancelar"}
        </button>
      )}
      {estado !== "pendiente" && (
        <button
          type="button"
          onClick={() => run("pendiente")}
          disabled={pending}
          className="rounded-lg border border-[#1E3A8A] px-3 py-1.5 font-heading text-xs text-[#E2E8F0] transition-colors hover:border-[#2563EB] disabled:opacity-60"
        >
          {pending ? "…" : "Marcar pendiente"}
        </button>
      )}
    </div>
  );
}
