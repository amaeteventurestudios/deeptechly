import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, getSupabaseServiceRoleKey } from "./env";

export function createSupabaseAdminClient() {
  const config = getSupabasePublicConfig();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!config || !serviceRoleKey) {
    return null;
  }

  return createClient(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
