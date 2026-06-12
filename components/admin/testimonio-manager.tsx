"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Testimonio } from "@/lib/testimonios";
import { createTestimonio, deleteTestimonio } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-lg border border-border bg-muted px-3 py-2 font-body text-sm text-white placeholder-secondary/40 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";
const labelClass = "block font-heading text-xs text-secondary";

export default function TestimonioManager({
  testimonios,
}: {
  testimonios: Testimonio[];
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
      const result = await createTestimonio(fd);
      if (result.ok) {
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error ?? "Error");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("¿Eliminar este testimonio?")) return;
    startTransition(async () => {
      const result = await deleteTestimonio(id);
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
            Nuevo testimonio
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="María Fernanda L."
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="prize">
                Premio ganado
              </label>
              <input
                id="prize"
                name="prize"
                type="text"
                placeholder="Auto Deportivo"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="avatar">
                Iniciales (avatar)
              </label>
              <input
                id="avatar"
                name="avatar"
                type="text"
                maxLength={4}
                placeholder="MF"
                required
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="text">
                Testimonio
              </label>
              <textarea
                id="text"
                name="text"
                rows={3}
                placeholder="Compré solo un boleto y gané..."
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
              {pending ? "Guardando…" : "Agregar testimonio"}
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
          + Nuevo testimonio
        </button>
      )}

      {testimonios.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-border bg-surface/60 p-6 text-center font-body text-sm text-secondary">
          No hay testimonios. Agrega el primero.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonios.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-heading text-xs text-white">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-heading text-sm text-white">{t.name}</p>
                  <p className="font-body text-xs text-accent">Ganó: {t.prize}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                disabled={pending}
                className="shrink-0 rounded-lg border border-destructive/40 px-2.5 py-1 font-heading text-xs text-[#FCA5A5] transition-colors hover:bg-destructive/10 disabled:opacity-60"
              >
                Eliminar
              </button>
            </div>
            <p className="mt-3 font-body text-sm leading-relaxed text-foreground">
              &ldquo;{t.text}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
