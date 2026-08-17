"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Destino tras autenticar. Llega como ?next=... cuando el usuario venía de
  // una compra; sólo aceptamos rutas internas para evitar open redirect.
  const getNext = () => {
    const n = searchParams.get("next");
    return n && n.startsWith("/") ? n : "/";
  };
  const next = getNext();
  const vieneDeCompra = next.includes("/comprar");

  // 44px de alto mínimo: es un objetivo táctil, no sólo una caja de texto.
  const campoBase =
    "h-12 w-full rounded-xl border border-border bg-muted px-4 text-base text-white placeholder-secondary/60 outline-none transition-colors focus:border-primary";

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
      router.push(getNext());
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() || email.split("@")[0] },
        },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push(getNext());
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
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNext())}`,
      },
    });
  };

  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col justify-center px-4 py-12">
      <div className="page-fade">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1 className="display mt-3 text-3xl text-white sm:text-4xl">
            {mode === "signin" ? "Inicia sesión" : "Crea tu cuenta"}
          </h1>
          <p className="mt-3 text-sm text-secondary">
            {mode === "signin"
              ? "Entra para ver tus boletos y el estado de tus compras."
              : "Con cuenta guardas tus compras y sigues cada sorteo desde Mi perfil."}
          </p>
          {vieneDeCompra && (
            <div className="card mt-5 p-4">
              <p className="text-sm text-secondary">
                Al entrar te devolvemos a tu compra con los números que ya
                elegiste.
              </p>
              <Link
                href={next}
                className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
              >
                Prefiero comprar sin cuenta →
              </Link>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card mt-8 p-6 sm:p-8">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className={`mt-1.5 ${campoBase}`}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
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
                  className={`${campoBase} pr-24`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 flex h-11 -translate-y-1/2 items-center rounded-lg px-3 text-xs text-secondary transition-colors hover:text-white"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-secondary">
                Mínimo 6 caracteres.
              </p>
            </div>

            {mode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground"
                >
                  Nombre completo
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className={`mt-1.5 ${campoBase}`}
                />
              </div>
            )}
          </div>

          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5 text-sm text-success"
            >
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn-accent mt-6 w-full ${
              loading ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {loading
              ? "Procesando…"
              : mode === "signin"
                ? "Entrar"
                : "Crear cuenta"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="hairline flex-1" />
            <span className="text-xs text-secondary">o</span>
            <span className="hairline flex-1" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="btn-primary w-full text-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-secondary">
          {mode === "signin" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setError(null);
              setNotice(null);
              setName("");
            }}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "Crea una" : "Inicia sesión"}
          </button>
        </p>

        <p className="mt-2 text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-xs text-secondary transition-colors hover:text-white"
          >
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
