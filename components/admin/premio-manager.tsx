"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Sorteo } from "@/app/data/sorteos";
import { updatePremio, uploadPremioImage } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-lg border border-border bg-muted px-3 py-2 font-body text-sm text-white placeholder-secondary/40 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

export default function PremioManager({
  sorteos,
}: {
  sorteos: Sorteo[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const activeSorteos = sorteos.filter(
    (s) => s.estado === "activo" || s.estado === "proximo",
  );

  if (activeSorteos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/60 p-6 text-center font-body text-sm text-secondary">
        No hay sorteos activos o próximos.{" "}
        <a href="/admin/sorteos" className="text-primary underline">
          Crea uno primero
        </a>
        .
      </div>
    );
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sorteoId: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.set("file", file);

    const result = await uploadPremioImage(null, fd);
    if (result.ok && result.url) {
      const fd2 = new FormData();
      fd2.set("imagen", result.url);
      fd2.set("descripcion", "");
      const saveResult = await updatePremio(sorteoId, fd2);
      if (saveResult.ok) {
        router.refresh();
      } else {
        setError(saveResult.error ?? "Error al guardar");
      }
    } else {
      setError(result.error ?? "Error al subir imagen");
    }

    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="font-body text-sm text-[#FCA5A5]">
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activeSorteos.map((s) => {
          const isEditing = editingId === s.id;

          return (
            <div
              key={s.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className="group relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                {s.imagen ? (
                  s.imagen.startsWith("/") ||
                  /\.(png|jpe?g|webp|gif|svg)$/i.test(s.imagen) ? (
                    <Image
                      src={s.imagen}
                      alt={s.premio}
                      width={800}
                      height={450}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={s.imagen}
                      alt={s.premio}
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <span className="text-5xl">{s.emoji}</span>
                )}
                <label
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 text-white/0 transition-all group-hover:bg-black/60 group-hover:text-white"
                  role="button"
                >
                  {uploading && editingId === s.id ? (
                    <span className="font-heading text-sm">Subiendo…</span>
                  ) : (
                    <span className="font-heading text-sm">
                      {s.imagen ? "Cambiar imagen" : "Subir imagen"}
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, s.id)}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-heading text-sm text-white">
                      {s.premio}
                    </h3>
                    <p className="mt-0.5 truncate font-body text-xs text-secondary">
                      {s.titulo} · #{s.numero}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingId(isEditing ? null : s.id)
                    }
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 font-heading text-xs text-foreground transition-colors hover:border-primary hover:text-white"
                  >
                    {isEditing ? "Cancelar" : "Editar"}
                  </button>
                </div>

                {isEditing && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setError(null);
                      const formData = new FormData(e.currentTarget);
                      startTransition(async () => {
                        const result = await updatePremio(s.id, formData);
                        if (result.ok) {
                          setEditingId(null);
                          router.refresh();
                        } else {
                          setError(result.error ?? "Error al guardar");
                        }
                      });
                    }}
                    className="mt-4 flex flex-col gap-4 border-t border-border pt-4"
                  >
                    <div>
                      <label
                        className="mb-1 block font-heading text-xs text-secondary"
                        htmlFor={`url-${s.id}`}
                      >
                        O pega una URL de imagen
                      </label>
                      <input
                        id={`url-${s.id}`}
                        name="imagen"
                        type="url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        defaultValue={s.imagen ?? ""}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        className="mb-1 block font-heading text-xs text-secondary"
                        htmlFor={`desc-${s.id}`}
                      >
                        Descripción
                      </label>
                      <textarea
                        id={`desc-${s.id}`}
                        name="descripcion"
                        rows={2}
                        defaultValue={s.descripcion ?? ""}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="submit"
                        disabled={pending}
                        className="btn-accent text-xs disabled:opacity-60"
                      >
                        {pending ? "Guardando…" : "Guardar cambios"}
                      </button>
                      <a
                        href="/admin/sorteos"
                        className="font-body text-[11px] text-secondary underline underline-offset-2 hover:text-white"
                      >
                        Editar sorteo completo →
                      </a>
                    </div>
                  </form>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                  <span className="font-heading text-xs text-accent">
                    {s.valor}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-body text-[10px] ${
                      s.estado === "activo"
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FCD34D]"
                    }`}
                  >
                    {s.estado === "activo" ? "Activo" : "Próximo"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
