"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Sorteo } from "@/app/data/sorteos";
import { createSorteo, updateSorteo, deleteSorteo } from "@/app/admin/actions";

/** ISO string -> value accepted by <input type="datetime-local">. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputClass =
  "w-full rounded-lg border border-[#1E3A8A] bg-[#16223A] px-3 py-2 font-body text-sm text-white placeholder-[#38BDF8]/40 outline-none transition-colors focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]";
const labelClass = "block font-heading text-xs text-[#38BDF8]";

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
      className="rounded-2xl border border-[#2563EB]/40 bg-[#111A2E] p-5 sm:p-6"
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
            disabled={isEdit}
            className={`${inputClass} ${isEdit ? "opacity-60" : ""}`}
          />
          {isEdit && (
            <p className="mt-1 font-body text-[10px] text-[#38BDF8]/70">
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
        <label className="flex items-center gap-2 self-end font-body text-sm text-[#E2E8F0]">
          <input
            name="destacado"
            type="checkbox"
            defaultChecked={sorteo?.destacado ?? false}
            className="h-4 w-4 accent-[#2563EB]"
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
          <li className="rounded-xl border border-dashed border-[#1E3A8A] bg-[#111A2E]/60 p-6 text-center font-body text-sm text-[#38BDF8]">
            No hay sorteos. Crea el primero.
          </li>
        )}
        {sorteos.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-3 rounded-xl border border-[#1E3A8A] bg-[#111A2E] p-4 sm:flex-row sm:items-center sm:justify-between"
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
                        ? "border-[#22D3EE]/40 bg-[#22D3EE]/10 text-[#22D3EE]"
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
                <p className="font-body text-xs text-[#38BDF8]">
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
                className="rounded-lg border border-[#1E3A8A] px-3 py-1.5 font-heading text-xs text-[#E2E8F0] transition-colors hover:border-[#2563EB] hover:text-white"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(s)}
                disabled={pending && deletingId === s.id}
                className="rounded-lg border border-[#EF4444]/40 px-3 py-1.5 font-heading text-xs text-[#FCA5A5] transition-colors hover:bg-[#EF4444]/10 disabled:opacity-60"
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
