import { createBrowserClient } from "@supabase/ssr";

/** Public key — supports both the new publishable key and the legacy anon key. */
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** True when Supabase env vars are configured. */
export const supabaseConfigured = !!supabaseUrl && !!supabaseKey;

/** Browser Supabase client. Call only in the browser (event handlers / effects). */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}

export function isInvalidRefreshTokenError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: string;
    message?: string;
  };

  return (
    candidate.code === "refresh_token_not_found" ||
    candidate.message?.includes("Invalid Refresh Token") === true ||
    candidate.message?.includes("Refresh Token Not Found") === true
  );
}
