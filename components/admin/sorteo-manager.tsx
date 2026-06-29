"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Sorteo } from "@/app/data/sorteos";
import { createSorteo, updateSorteo, deleteSorteo, uploadPremioImage } from "@/app/admin/actions";

/** ISO string -> value accepted by <input type="datetime-local">. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputClass =
  "w-full rounded-lg border border-border bg-muted px-3 py-2 font-body text-sm text-white placeholder-secondary/40 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";
const labelClass = "block font-heading text-xs text-secondary";

function SorteoForm({
  sorteo,
  onClose,
}: {
  sorteo: Sorteo | null; // null = create
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isEdit = !!sorteo;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = isEdit
        ? await updateSorteo(sorteo!.id, formData)
        : await createSorteo(formData);
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error ?? "Error al guardar");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-primary/40 bg-surface p-5 sm:p-6"
    >
      <h3 className="font-heading text-lg text-white">
        {isEdit ? `Editar Sorteo #${sorteo!.numero}` : "Nuevo Sorteo"}
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="numero">
            Número
          </label>
          <input
            id="numero"
            name="numero"
            type="number"
            min="1"
            required
            defaultValue={sorteo?.numero ?? ""}
            readOnly={isEdit}
            className={`${inputClass} ${isEdit ? "opacity-60" : ""}`}
          />
          {isEdit && (
            <p className="mt-1 font-body text-[10px] text-secondary/70">
              El número (y la URL) no se puede cambiar.
            </p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor="emoji">
            Emoji
          </label>
          <input
            id="emoji"
            name="emoji"
            type="text"
            maxLength={4}
            defaultValue={sorteo?.emoji ?? "🎟️"}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="titulo">
            Título
          </label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            required
            defaultValue={sorteo?.titulo ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="premio">
            Premio
          </label>
          <input
            id="premio"
            name="premio"
            type="text"
            required
            defaultValue={sorteo?.premio ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="valor">
            Valor (texto)
          </label>
          <input
            id="valor"
            name="valor"
            type="text"
            placeholder="$14,999 MXN"
            defaultValue={sorteo?.valor ?? ""}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="descripcion">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            defaultValue={sorteo?.descripcion ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="fecha">
            Fecha del sorteo
          </label>
          <input
            id="fecha"
            name="fecha"
            type="datetime-local"
            required
            defaultValue={toLocalInput(sorteo?.fecha ?? "")}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="fecha_label">
            Fecha (etiqueta)
          </label>
          <input
            id="fecha_label"
            name="fecha_label"
            type="text"
            placeholder="15 Julio, 2026"
            defaultValue={sorteo?.fechaLabel ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="precio_boleto">
            Precio boleto (MXN)
          </label>
          <input
            id="precio_boleto"
            name="precio_boleto"
            type="number"
            min="0"
            step="0.01"
            defaultValue={sorteo?.precioBoleto ?? 0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="total_boletos">
            Total boletos
          </label>
          <input
            id="total_boletos"
            name="total_boletos"
            type="number"
            min="1"
            defaultValue={sorteo?.totalBoletos ?? 100}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="vendidos">
            Vendidos
          </label>
          <input
            id="vendidos"
            name="vendidos"
            type="number"
            min="0"
            defaultValue={sorteo?.vendidos ?? 0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="estado">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={sorteo?.estado ?? "activo"}
            className={inputClass}
          >
            <option value="activo">Activo</option>
          <option value="proximo">Próximo</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Imagen referencial</label>
        <div className="mt-1 flex flex-col gap-3">
          {sorteo?.imagen && (
            <div className="relative aspect-video w-full max-w-64 overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src={sorteo.imagen}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <label className="btn-outline inline-flex w-fit cursor-pointer items-center gap-2 px-3 py-1.5 text-xs">
            {uploading ? "Subiendo…" : "Subir archivo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                setUploadError(null);
                const fd = new FormData();
                fd.set("file", file);
                try {
                  const result = await uploadPremioImage(null, fd);
                  if (result.ok && result.url) {
                    const input = document.getElementById(
                      `imagen-url-${sorteo?.id ?? "new"}`,
                    ) as HTMLInputElement;
                    if (input) input.value = result.url;
                  } else {
                    setUploadError(result.error ?? "Error");
                  }
                } catch {
                  setUploadError("Error al subir");
                }
                setUploading(false);
                e.target.value = "";
              }}
            />
          </label>
          <div className="flex items-center gap-2">
            <span className="font-body text-[11px] text-secondary/60">o</span>
            <input
              id={`imagen-url-${sorteo?.id ?? "new"}`}
              name="imagen"
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              defaultValue={sorteo?.imagen ?? ""}
              className={inputClass}
            />
          </div>
          {uploadError && (
            <p className="font-body text-xs text-[#FCA5A5]">{uploadError}</p>
          )}
        </div>
      </div>
        <label className="flex items-center gap-2 self-end font-body text-sm text-foreground">
          <input
            name="destacado"
            type="checkbox"
            defaultChecked={sorteo?.destacado ?? false}
            className="h-4 w-4 accent-primary"
          />
          Destacado
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 font-body text-sm text-[#FCA5A5]">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn-accent text-sm disabled:opacity-60"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear sorteo"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-outline text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function SorteoManager({ sorteos }: { sorteos: Sorteo[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Sorteo | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDelete = (sorteo: Sorteo) => {
    if (
      !window.confirm(
        `¿Eliminar el Sorteo #${sorteo.numero} — ${sorteo.titulo}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setDeletingId(sorteo.id);
    startTransition(async () => {
      const result = await deleteSorteo(sorteo.id);
      setDeletingId(null);
      if (result.ok) router.refresh();
      else window.alert(result.error ?? "Error al eliminar");
    });
  };

  return (
    <div className="space-y-5">
      {creating ? (
        <SorteoForm sorteo={null} onClose={() => setCreating(false)} />
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="btn-accent text-sm"
        >
          + Nuevo sorteo
        </button>
      )}

      {editing && (
        <SorteoForm sorteo={editing} onClose={() => setEditing(null)} />
      )}

      <ul className="space-y-3">
        {sorteos.length === 0 && (
          <li className="rounded-xl border border-dashed border-border bg-surface/60 p-6 text-center font-body text-sm text-secondary">
            No hay sorteos. Crea el primero.
          </li>
        )}
        {sorteos.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                {s.emoji}
              </span>
              <div className="min-w-0">
                <p className="font-heading text-sm text-white">
                  #{s.numero} · {s.titulo}
                  <span
                    className={`ml-2 rounded-full border px-2 py-0.5 font-body text-[10px] ${
                      s.estado === "activo"
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FCD34D]"
                    }`}
                  >
                    {s.estado === "activo" ? "Activo" : "Próximo"}
                  </span>
                  {s.destacado && (
                    <span className="ml-1 font-body text-[10px] text-[#FCD34D]">
                      ★
                    </span>
                  )}
                </p>
                <p className="font-body text-xs text-secondary">
                  {s.premio} · ${s.precioBoleto} MXN · {s.vendidos}/
                  {s.totalBoletos} vendidos · {s.fechaLabel}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setEditing(s);
                }}
                className="rounded-lg border border-border px-3 py-1.5 font-heading text-xs text-foreground transition-colors hover:border-primary hover:text-white"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(s)}
                disabled={pending && deletingId === s.id}
                className="rounded-lg border border-destructive/40 px-3 py-1.5 font-heading text-xs text-[#FCA5A5] transition-colors hover:bg-destructive/10 disabled:opacity-60"
              >
                {pending && deletingId === s.id ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
