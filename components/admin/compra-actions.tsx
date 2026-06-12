"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCompraEstado, deleteCompra } from "@/app/admin/actions";

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

  const handleDelete = () => {
    if (!window.confirm("¿Eliminar esta compra? Esta acción no se puede deshacer.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCompra(id);
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
          className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 font-heading text-xs text-accent transition-colors hover:bg-accent/20 disabled:opacity-60"
        >
          {pending ? "…" : "Confirmar"}
        </button>
      )}
      {estado !== "cancelada" && (
        <button
          type="button"
          onClick={() => run("cancelada")}
          disabled={pending}
          className="rounded-lg border border-destructive/40 px-3 py-1.5 font-heading text-xs text-[#FCA5A5] transition-colors hover:bg-destructive/10 disabled:opacity-60"
        >
          {pending ? "…" : "Cancelar"}
        </button>
      )}
      {estado !== "pendiente" && (
        <button
          type="button"
          onClick={() => run("pendiente")}
          disabled={pending}
          className="rounded-lg border border-border px-3 py-1.5 font-heading text-xs text-foreground transition-colors hover:border-primary disabled:opacity-60"
        >
          {pending ? "…" : "Marcar pendiente"}
        </button>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="rounded-lg border border-destructive/40 px-3 py-1.5 font-heading text-xs text-[#FCA5A5] transition-colors hover:bg-destructive/20 disabled:opacity-60"
      >
        {pending ? "…" : "Eliminar"}
      </button>
    </div>
  );
}
