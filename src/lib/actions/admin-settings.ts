"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/settings";
import type { Json } from "@/lib/supabase/types";

export type SettingsPayload = {
  church: SiteSettings["church"];
  service: SiteSettings["service"];
  location: {
    venue: string;
    campus: string;
    city: string;
    postcode: string;
    mapsQuery: string;
  };
  contact: SiteSettings["contact"];
  socials: SiteSettings["socials"];
  giving: SiteSettings["giving"];
  hero: SiteSettings["hero"];
};

export async function saveSettings(
  payload: SettingsPayload,
): Promise<{ ok: boolean; message: string }> {
  const ctx = await getAdminContext();
  if (!ctx || ctx.profile.status !== "approved" || !ctx.can("settings.edit"))
    return { ok: false, message: "You can't edit settings." };

  // Light validation: the fields the site can't render without.
  if (!payload.church.name.trim())
    return { ok: false, message: "The church name can't be empty." };
  if (!payload.service.startTime.trim())
    return { ok: false, message: "The service time can't be empty." };
  if (!payload.location.venue.trim() || !payload.location.postcode.trim())
    return { ok: false, message: "The venue and postcode are required." };
  for (const slide of payload.hero) {
    if (!slide.src) return { ok: false, message: "A banner slide has no image." };
    if (!slide.alt.trim())
      return {
        ok: false,
        message: "Every banner slide needs a description (alt text).",
      };
  }

  const admin = createAdminClient();
  const rows = (
    [
      ["church", payload.church],
      ["service", payload.service],
      ["location", payload.location],
      ["contact", payload.contact],
      ["socials", payload.socials],
      ["giving", payload.giving],
      ["hero", payload.hero],
    ] as const
  ).map(([key, value]) => ({
    key,
    value: value as unknown as Json,
    updated_at: new Date().toISOString(),
    updated_by: ctx.profile.id,
  }));

  const { error } = await admin.from("site_settings").upsert(rows);
  if (error) {
    console.error("saveSettings failed", error);
    return { ok: false, message: "Couldn't save — try again." };
  }

  await admin.from("audit_log").insert({
    actor_id: ctx.profile.id,
    action: "settings.saved",
    entity: "site_settings",
    entity_id: "all",
    detail: { keys: rows.map((r) => r.key) } as unknown as Json,
  });

  // The whole public site reads these — refresh everything at once.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Saved. The site updates within a few seconds." };
}
