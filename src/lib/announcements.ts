import "server-only";

import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import type { ActiveAnnouncement } from "@/components/announcement-modal";

/** The one active announcement inside its display window, or null. */
export const getActiveAnnouncement = cache(
  async (): Promise<ActiveAnnouncement | null> => {
    try {
      const nowIso = new Date().toISOString();
      const { data } = await createPublicClient()
        .from("announcements")
        .select("id, title, body, image_url, cta_label, cta_url, dismiss_hours, updated_at")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    } catch {
      return null;
    }
  },
);
