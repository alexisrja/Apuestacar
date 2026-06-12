import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/client";

let _adminClient: ReturnType<typeof createClient> | null = null;

export function getAdminClient() {
  if (_adminClient) return _adminClient;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  _adminClient = createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  });
  return _adminClient;
}
