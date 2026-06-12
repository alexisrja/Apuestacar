"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Resultado } from "@/lib/resultados";
import { createResultado, deleteResultado } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-lg border border-border bg-muted px-3 py-2 font-body text-sm text-white placeholder-secondary/40 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";
const labelClass = "block font-heading text-xs text-secondary";

export default function ResultadoManager({
  resultados,
}: {
  resultados: Resultado[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createResultado(fd);
      if (result.ok) {
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error ?? "Error");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("¿Eliminar este resultado?")) return;
    startTransition(async () => {
      const result = await deleteResultado(id);
      if (result.ok) router.refresh();
      else setError(result.error ?? "Error");
    });
  };

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="font-body text-sm text-[#FCA5A5]">
          {error}
        </p>
      )}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-primary/40 bg-surface p-5"
        >
          <h3 className="font-heading text-lg text-white">
            Nuevo resultado
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="sorteo_numero">
                Sorteo #
              </label>
              <input
                id="sorteo_numero"
                name="sorteo_numero"
                type="number"
                min="1"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="fecha">
                Fecha
              </label>
              <input
                id="fecha"
                name="fecha"
                type="text"
                placeholder="15 Julio, 2026"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="ganador">
                Ganador
              </label>
              <input
                id="ganador"
                name="ganador"
                type="text"
                placeholder="María Fernanda L."
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="numero">
                N° ganador
              </label>
              <input
                id="numero"
                name="numero"
                type="text"
                placeholder="042"
                required
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="premio">
                Premio
              </label>
              <input
                id="premio"
                name="premio"
                type="text"
                placeholder="Auto Deportivo"
                required
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="btn-accent text-sm disabled:opacity-60"
            >
              {pending ? "Guardando…" : "Agregar resultado"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-outline text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-accent text-sm"
        >
          + Nuevo resultado
        </button>
      )}

      {resultados.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-border bg-surface/60 p-6 text-center font-body text-sm text-secondary">
          No hay resultados. Agrega el primero.
        </div>
      )}

      {resultados.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-3 text-left font-heading text-xs text-secondary">#</th>
                <th className="px-4 py-3 text-left font-heading text-xs text-secondary">Fecha</th>
                <th className="px-4 py-3 text-left font-heading text-xs text-secondary">Ganador</th>
                <th className="px-4 py-3 text-left font-heading text-xs text-secondary">N°</th>
                <th className="px-4 py-3 text-left font-heading text-xs text-secondary">Premio</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {resultados.map((r) => (
                <tr key={r.id} className="bg-surface">
                  <td className="px-4 py-3 font-heading text-white">#{r.sorteo_numero}</td>
                  <td className="px-4 py-3 text-foreground">{r.fecha}</td>
                  <td className="px-4 py-3 text-white">{r.ganador}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-primary/20 px-2 py-0.5 font-heading text-xs text-secondary">
                      {r.numero}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-accent">{r.premio}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={pending}
                      className="rounded-lg border border-destructive/40 px-3 py-1.5 font-heading text-xs text-[#FCA5A5] transition-colors hover:bg-destructive/10 disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
