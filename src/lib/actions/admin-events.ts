"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { londonNaiveToUtcIso } from "@/lib/london-time";

export type EventActionResult =
  | { ok: true; message: string; id: string; slug: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requireEvents() {
  const ctx = await getAdminContext();
  if (!ctx || ctx.profile.status !== "approved" || !ctx.can("events.manage"))
    return null;
  return ctx;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Everything on /events is refreshed after any event change. */
function revalidateEvents(slug: string) {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${slug}`);
}

type ParsedEvent = {
  values: {
    title: string;
    slug: string;
    summary: string | null;
    description: string | null;
    starts_at: string;
    ends_at: string | null;
    time_tbc: boolean;
    venue: string | null;
    image_url: string | null;
    cta_label: string | null;
    cta_url: string | null;
    is_featured: boolean;
    is_published: boolean;
  };
} | { error: EventActionResult };

function parseEventForm(data: FormData): ParsedEvent {
  const get = (k: string) => String(data.get(k) ?? "").trim();
  const fieldErrors: Record<string, string> = {};

  const title = get("title");
  if (!title) fieldErrors.title = "Give the event a title.";

  const slug = slugify(get("slug") || title);
  if (!slug) fieldErrors.slug = "The URL slug can't be empty.";

  const date = get("date"); // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    fieldErrors.date = "Pick the event date.";

  const timeTbc = data.get("time_tbc") === "on";
  const startTime = get("start_time"); // HH:mm
  if (!timeTbc && !/^\d{2}:\d{2}$/.test(startTime))
    fieldErrors.start_time = "Set a start time, or tick 'time to be confirmed'.";

  const endTime = get("end_time");
  const ctaUrl = get("cta_url");
  if (ctaUrl && !/^(https?:\/\/|\/)/.test(ctaUrl))
    fieldErrors.cta_url = "Links must start with https:// or /.";

  if (Object.keys(fieldErrors).length > 0)
    return { error: { ok: false, message: "Check the highlighted fields.", fieldErrors } };

  // time_tbc keeps a midday anchor so ordering and the calendar still work.
  const starts_at = londonNaiveToUtcIso(
    `${date}T${timeTbc ? "12:00" : startTime}`,
  );
  const ends_at =
    !timeTbc && /^\d{2}:\d{2}$/.test(endTime)
      ? londonNaiveToUtcIso(`${date}T${endTime}`)
      : null;

  return {
    values: {
      title,
      slug,
      summary: get("summary") || null,
      description: get("description") || null,
      starts_at,
      ends_at,
      time_tbc: timeTbc,
      venue: get("venue") || null,
      image_url: get("image_url") || null,
      cta_label: get("cta_label") || null,
      cta_url: ctaUrl || null,
      is_featured: data.get("is_featured") === "on",
      is_published: data.get("is_published") === "on",
    },
  };
}

export async function createEvent(data: FormData): Promise<EventActionResult> {
  const ctx = await requireEvents();
  if (!ctx) return { ok: false, message: "You can't manage events." };

  const parsed = parseEventForm(data);
  if ("error" in parsed) return parsed.error;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("events")
    .select("id")
    .eq("slug", parsed.values.slug)
    .maybeSingle();
  if (existing)
    return {
      ok: false,
      message: "That URL slug is already used by another event.",
      fieldErrors: { slug: "Already in use — change it." },
    };

  const { data: created, error } = await admin
    .from("events")
    .insert(parsed.values)
    .select("id, slug")
    .single();
  if (error || !created) {
    console.error("createEvent failed", error);
    return { ok: false, message: "Couldn't save the event — try again." };
  }

  revalidateEvents(created.slug);
  return { ok: true, message: "Event created.", id: created.id, slug: created.slug };
}

export async function updateEvent(
  id: string,
  data: FormData,
): Promise<EventActionResult> {
  const ctx = await requireEvents();
  if (!ctx) return { ok: false, message: "You can't manage events." };

  const parsed = parseEventForm(data);
  if ("error" in parsed) return parsed.error;

  const admin = createAdminClient();
  const { data: clash } = await admin
    .from("events")
    .select("id")
    .eq("slug", parsed.values.slug)
    .neq("id", id)
    .maybeSingle();
  if (clash)
    return {
      ok: false,
      message: "That URL slug is already used by another event.",
      fieldErrors: { slug: "Already in use — change it." },
    };

  const { data: previous } = await admin
    .from("events")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("events").update(parsed.values).eq("id", id);
  if (error) {
    console.error("updateEvent failed", error);
    return { ok: false, message: "Couldn't save the event — try again." };
  }

  if (previous && previous.slug !== parsed.values.slug)
    revalidateEvents(previous.slug);
  revalidateEvents(parsed.values.slug);
  return { ok: true, message: "Event saved.", id, slug: parsed.values.slug };
}

export async function deleteEvent(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  const ctx = await requireEvents();
  if (!ctx) return { ok: false, message: "You can't manage events." };

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (!event) return { ok: false, message: "Already gone." };

  const { error } = await admin.from("events").delete().eq("id", id);
  if (error) {
    console.error("deleteEvent failed", error);
    return { ok: false, message: "Couldn't delete — try again." };
  }

  revalidateEvents(event.slug);
  revalidatePath("/admin/events");
  return { ok: true, message: "Event deleted." };
}
