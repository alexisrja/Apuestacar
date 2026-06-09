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
