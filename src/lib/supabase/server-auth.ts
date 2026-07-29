import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Cookie-session client for Server Components and Server Actions in the admin.
 *
 * Distinct from `server.ts`: this one carries the signed-in user, so RLS
 * evaluates as *them* — a second enforcement layer under every capability
 * check in the UI.
 */
export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — proxy.ts handles the refresh
          // there, so swallowing is correct.
        }
      },
    },
  });
}
