import "server-only";

import { cache } from "react";
import { createAuthClient } from "@/lib/supabase/server-auth";
import type { Tables } from "@/lib/supabase/types";

export type AdminProfile = Tables<"profiles"> & {
  roles: Tables<"roles"> | null;
};

export type AdminContext = {
  profile: AdminProfile;
  capabilities: string[];
  /** True if the profile's role carries the capability (or 'all'). */
  can: (capability: string) => boolean;
};

/**
 * The signed-in admin user, their profile and capability set.
 *
 * Reads through the cookie-session client, so RLS evaluates as the user —
 * a pending profile literally cannot read anyone else's row, whatever the UI
 * does. Returns null when there's no session or no profile.
 *
 * Memoised per request: the layout, the page and any server action in the same
 * render all call this, and without the cache each one costs a round trip to
 * the auth server plus a profile query.
 */
export const getAdminContext = cache(async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createAuthClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(*)")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  const capabilities =
    profile.status === "approved" ? (profile.roles?.capabilities ?? []) : [];

  const can = (capability: string) =>
    capabilities.includes("all") || capabilities.includes(capability);

  return { profile: profile as AdminProfile, capabilities, can };
});
