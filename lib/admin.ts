import { createClient } from "@/lib/supabase/server";

/**
 * App-level admin allow-list. Used for routing / UI gating only — actual DB
 * writes are guarded by RLS (`public.is_admin()`), which reads its own
 * `admin_emails` table. Keep ADMIN_EMAILS in sync with that table.
 *
 * Format: comma-separated emails, e.g. ADMIN_EMAILS="a@x.com, b@y.com".
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** True when `email` is in the admin allow-list. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * Resolve the current request's user and whether they are an admin.
 * Use in Server Components / layouts to gate admin UI.
 */
export async function getAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, isAdmin: isAdminEmail(user?.email) };
}
