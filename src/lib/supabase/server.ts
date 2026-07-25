import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  supabasePublishableKey,
  supabaseSecretKey,
  supabaseUrl,
} from "@/lib/supabase/env";

/**
 * Read-only client for public content (published events, sermons, groups).
 * Uses the publishable key, so RLS still applies — a bug here can't leak
 * prayer requests.
 */
export function createPublicClient() {
  return createClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    auth: { persistSession: false },
  });
}

/**
 * Full-access client. Bypasses RLS entirely.
 *
 * Only for server-side writes and staff reads. Never return its results
 * straight to the browser without filtering — that's the whole risk.
 */
export function createAdminClient() {
  return createClient<Database>(supabaseUrl(), supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
