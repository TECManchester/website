"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/**
 * Browser client for the admin — auth flows only (sign in, sign up, password
 * change). Data access stays server-side where capabilities are checked.
 *
 * Uses the publishable key, so RLS applies to anything it touches.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
