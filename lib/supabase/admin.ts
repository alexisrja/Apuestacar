import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/client";

let _adminClient: ReturnType<typeof createAdminClient> | null = null;

function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(supabaseUrl, key, {
    db: { schema: "public" },
    auth: { persistSession: false },
  });
}

export function getAdminClient() {
  if (_adminClient) return _adminClient;
  _adminClient = createAdminClient();
  return _adminClient;
}
