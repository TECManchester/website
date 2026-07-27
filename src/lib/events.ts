import "server-only";

import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Tables } from "@/lib/supabase/types";

/**
 * Derived from the generated Database type rather than hand-written, so it
 * can't drift from the actual schema. `supabase gen types` overwrites
 * types.ts wholesale, so anything hand-added there is lost on regeneration.
 */
export type ChurchEvent = Tables<"events">;

/**
 * Events come from Supabase so staff can manage them without a code change.
 * Reads use the publishable key, so RLS still applies and only published rows
 * are ever returned — a bug here can't leak a draft.
 */

/** Upcoming events, soonest first. Anything that has already ended is excluded. */
export async function getUpcomingEvents(limit = 20): Promise<ChurchEvent[]> {
  if (!isSupabaseConfigured) return [];

  // An event that started earlier today but hasn't ended is still "upcoming".
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);

  const { data, error } = await createPublicClient()
    .from("events")
    .select("*")
    .gte("starts_at", cutoff.toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("events query failed", error);
    return [];
  }
  return data ?? [];
}

/** Everything published, past and future — for the calendar. */
export async function getAllEvents(): Promise<ChurchEvent[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await createPublicClient()
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("events query failed", error);
    return [];
  }
  return data ?? [];
}

export async function getEventBySlug(
  slug: string,
): Promise<ChurchEvent | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await createPublicClient()
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("event query failed", error);
    return null;
  }
  return data ?? null;
}

// ---------------------------------------------------------------------------
// Formatting
//
// All fixed to Europe/London. Without an explicit timeZone these would render
// in the server's zone — which on Vercel is UTC — so a 7pm event would show as
// 6pm through British Summer Time.
// ---------------------------------------------------------------------------

const LONDON = "Europe/London";

const dayMonth = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: LONDON,
});

const fullDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: LONDON,
});

const timeOnly = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: LONDON,
});

export function eventDayNumber(event: ChurchEvent): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    timeZone: LONDON,
  }).format(new Date(event.starts_at));
}

export function eventMonthShort(event: ChurchEvent): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: LONDON,
  }).format(new Date(event.starts_at));
}

export function formatEventDate(event: ChurchEvent): string {
  return fullDate.format(new Date(event.starts_at));
}

export function formatEventShortDate(event: ChurchEvent): string {
  return dayMonth.format(new Date(event.starts_at));
}

/** "7:00 pm" or "7:00 pm – 9:30 pm" when an end time is set. */
export function formatEventTime(event: ChurchEvent): string {
  const start = timeOnly.format(new Date(event.starts_at));
  if (!event.ends_at) return start;

  const startDay = dayMonth.format(new Date(event.starts_at));
  const endDay = dayMonth.format(new Date(event.ends_at));
  const end = timeOnly.format(new Date(event.ends_at));

  // Multi-day events read better as dates than as a time range.
  return startDay === endDay ? `${start} – ${end}` : start;
}

/** True for events spanning more than one calendar day. */
export function isMultiDay(event: ChurchEvent): boolean {
  if (!event.ends_at) return false;
  return (
    dayMonth.format(new Date(event.starts_at)) !==
    dayMonth.format(new Date(event.ends_at))
  );
}

/** "18–20 Oct" for a conference, or the single date otherwise. */
export function formatEventDateRange(event: ChurchEvent): string {
  if (!isMultiDay(event)) return formatEventDate(event);
  return `${dayMonth.format(new Date(event.starts_at))} – ${dayMonth.format(
    new Date(event.ends_at!),
  )}`;
}

/** YYYY-MM-DD in London time — the key the calendar groups on. */
export function londonDateKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: LONDON,
  }).format(new Date(iso));
  return parts;
}
