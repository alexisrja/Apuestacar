"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileActions({
  initialName,
}: {
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });
    setSaving(false);
    if (!error) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="mt-5">
      <form onSubmit={handleSave}>
        <label
          htmlFor="display-name"
          className="block font-heading text-sm text-secondary"
        >
          Nombre para mostrar
        </label>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
          <input
            id="display-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-sm text-white placeholder-secondary/40 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={saving}
            className={`btn-accent shrink-0 text-sm ${
              saving ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
        {saved && (
          <p
            role="status"
            aria-live="polite"
            className="mt-2 font-body text-xs text-accent"
          >
            ✓ Cambios guardados
          </p>
        )}
      </form>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-8 w-full rounded-lg border border-destructive/40 px-4 py-3 font-heading text-sm text-[#FCA5A5] transition-colors hover:bg-destructive/10 disabled:opacity-60"
      >
        {loggingOut ? "Cerrando sesión…" : "Cerrar Sesión"}
      </button>
    </div>
  );
}
