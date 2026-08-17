"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export default function AvatarUpload({
  userId,
  initialUrl,
  initials,
}: {
  userId: string;
  initialUrl: string | null;
  initials: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setError(null);

    if (!ALLOWED.includes(file.type)) {
      setError("Formato no válido. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen supera 2 MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setUploading(false);
      console.error("avatar upload error:", uploadError);
      setError(`No se pudo subir la imagen: ${uploadError.message}`);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    // Cache-bust so the new image shows immediately after an upsert replace.
    const bustedUrl = `${publicUrl}?v=${file.size}-${file.lastModified}`;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: bustedUrl },
    });

    setUploading(false);

    if (updateError) {
      setError("Imagen subida, pero no se pudo guardar en tu perfil.");
      return;
    }

    setUrl(bustedUrl);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={pick}
        disabled={uploading}
        aria-label="Cambiar foto de perfil"
        className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-border transition-all hover:border-accent hover:shadow-[0_0_22px_rgba(34,211,238,0.45)] disabled:opacity-70"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Foto de perfil"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-muted font-heading text-3xl font-semibold text-white">
            {initials}
          </span>
        )}

        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-background/80 py-1.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            "Subiendo…"
          ) : (
            <>
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Cambiar
            </>
          )}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <p
          role="alert"
          className="mt-2 max-w-[16rem] text-center text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
