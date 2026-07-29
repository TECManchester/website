"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { londonNaiveToUtcIso } from "@/lib/london-time";

export type AnnouncementResult =
  | { ok: true; message: string; id: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requireCap() {
  const ctx = await getAdminContext();
  if (
    !ctx ||
    ctx.profile.status !== "approved" ||
    !ctx.can("announcements.manage")
  )
    return null;
  return ctx;
}

type Parsed =
  | { error: AnnouncementResult & { ok: false } }
  | {
      values: {
        title: string;
        body: string;
        image_url: string | null;
        cta_label: string | null;
        cta_url: string | null;
        is_active: boolean;
        starts_at: string | null;
        ends_at: string | null;
        dismiss_hours: number;
      };
    };

function parseForm(data: FormData): Parsed {
  const get = (k: string) => String(data.get(k) ?? "").trim();
  const fieldErrors: Record<string, string> = {};

  const title = get("title");
  const body = get("body");
  if (!title) fieldErrors.title = "Give the announcement a title.";
  if (!body) fieldErrors.body = "Write the announcement text.";

  const ctaUrl = get("cta_url");
  if (ctaUrl && !/^(https?:\/\/|\/)/.test(ctaUrl))
    fieldErrors.cta_url = "Links must start with https:// or /.";

  const dismissHours = Number(get("dismiss_hours") || "24");
  if (!Number.isInteger(dismissHours) || dismissHours < 1 || dismissHours > 720)
    fieldErrors.dismiss_hours = "Between 1 and 720 hours.";

  const startsRaw = get("starts_at");
  const endsRaw = get("ends_at");
  const starts_at = startsRaw ? londonNaiveToUtcIso(startsRaw) : null;
  const ends_at = endsRaw ? londonNaiveToUtcIso(endsRaw) : null;
  if (starts_at && ends_at && ends_at <= starts_at)
    fieldErrors.ends_at = "The end must be after the start.";

  if (Object.keys(fieldErrors).length > 0)
    return {
      error: {
        ok: false as const,
        message: "Check the highlighted fields.",
        fieldErrors,
      },
    };

  return {
    values: {
      title,
      body,
      image_url: get("image_url") || null,
      cta_label: get("cta_label") || null,
      cta_url: ctaUrl || null,
      is_active: data.get("is_active") === "on",
      starts_at,
      ends_at,
      dismiss_hours: dismissHours,
    },
  };
}

/** Only one announcement may be active — activation retires the others. */
async function deactivateOthers(exceptId: string) {
  await createAdminClient()
    .from("announcements")
    .update({ is_active: false })
    .neq("id", exceptId)
    .eq("is_active", true);
}

export async function createAnnouncement(
  data: FormData,
): Promise<AnnouncementResult> {
  const ctx = await requireCap();
  if (!ctx) return { ok: false, message: "You can't manage announcements." };

  const parsed = parseForm(data);
  if ("error" in parsed) return parsed.error;

  const { data: created, error } = await createAdminClient()
    .from("announcements")
    .insert({ ...parsed.values, created_by: ctx.profile.id })
    .select("id")
    .single();
  if (error || !created) {
    console.error("createAnnouncement failed", error);
    return { ok: false, message: "Couldn't save — try again." };
  }

  if (parsed.values.is_active) await deactivateOthers(created.id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/announcements");
  return { ok: true, message: "Announcement saved.", id: created.id };
}

export async function updateAnnouncement(
  id: string,
  data: FormData,
): Promise<AnnouncementResult> {
  const ctx = await requireCap();
  if (!ctx) return { ok: false, message: "You can't manage announcements." };

  const parsed = parseForm(data);
  if ("error" in parsed) return parsed.error;

  const { error } = await createAdminClient()
    .from("announcements")
    .update(parsed.values)
    .eq("id", id);
  if (error) {
    console.error("updateAnnouncement failed", error);
    return { ok: false, message: "Couldn't save — try again." };
  }

  if (parsed.values.is_active) await deactivateOthers(id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/announcements");
  return { ok: true, message: "Announcement saved.", id };
}

export async function deleteAnnouncement(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  const ctx = await requireCap();
  if (!ctx) return { ok: false, message: "You can't manage announcements." };

  const { error } = await createAdminClient()
    .from("announcements")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete — try again." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/announcements");
  return { ok: true, message: "Announcement deleted." };
}
