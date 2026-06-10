"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!supabaseConfigured) {
      setError(
        "Autenticación no configurada. Falta definir las claves de Supabase en .env.local.",
      );
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError("Correo o contraseña incorrectos. Inténtalo de nuevo.");
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setNotice(
          "Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.",
        );
        setMode("signin");
      }
    }
  };

  const handleGoogle = async () => {
    setError(null);
    if (!supabaseConfigured) {
      setError("Autenticación no configurada (faltan claves de Supabase).");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col justify-center px-4 py-12">
      <div className="page-fade">
        <div className="text-center">
          <h1 className="font-heading text-3xl text-white sm:text-4xl">
            {mode === "signin" ? "Iniciar " : "Crear "}
            <span className="text-gradient">
              {mode === "signin" ? "Sesión" : "Cuenta"}
            </span>
          </h1>
          <div className="neon-line" />
          <p className="font-body text-sm text-secondary">
            {mode === "signin"
              ? "Accede para ver tu perfil y tus boletos."
              : "Regístrate para participar y seguir tus sorteos."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block font-heading text-sm text-secondary"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="mt-1.5 w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-sm text-white placeholder-secondary/40 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-heading text-sm text-secondary"
              >
                Contraseña
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 pr-20 font-body text-sm text-white placeholder-secondary/40 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 font-body text-xs text-secondary transition-colors hover:text-white"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <p className="mt-1.5 font-body text-xs text-secondary/70">
                Mínimo 6 caracteres.
              </p>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 font-body text-sm text-[#FCA5A5]"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 font-body text-sm text-accent"
            >
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary mt-6 w-full ${
              loading ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            {loading
              ? "Procesando…"
              : mode === "signin"
                ? "Entrar"
                : "Registrarme"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-body text-xs text-secondary">o</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 font-heading text-sm text-white transition-colors hover:border-primary"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.5h-1.9V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.2C41.4 41 44 33.9 44 24c0-1.3-.1-2.3-.4-3.5z"
              />
            </svg>
            Continuar con Google
          </button>
        </form>

        <p className="mt-6 text-center font-body text-sm text-secondary">
          {mode === "signin" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setError(null);
              setNotice(null);
            }}
            className="font-heading text-accent underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>

        <p className="mt-4 text-center">
          <Link
            href="/"
            className="font-body text-xs text-secondary transition-colors hover:text-white"
          >
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
