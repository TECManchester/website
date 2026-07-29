import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Plus, ShieldAlert } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  formatEventDate,
  formatEventTime,
  type ChurchEvent,
} from "@/lib/events";

export const metadata: Metadata = { title: "Events" };

function EventRow({ event }: { event: ChurchEvent }) {
  return (
    <li>
      <Link
        href={`/admin/events/${event.id}`}
        className="border-grey-100 hover:shadow-card flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 transition"
      >
        <div className="min-w-0">
          <p className="text-ink truncate font-semibold">
            {event.title}
            {!event.is_published && (
              <span className="bg-grey-100 text-grey-500 ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase">
                Draft
              </span>
            )}
          </p>
          <p className="text-grey-500 mt-0.5 truncate text-sm">
            {formatEventDate(event)} · {formatEventTime(event)}
            {event.venue && ` · ${event.venue}`}
          </p>
        </div>
        <span className="text-green-600 shrink-0 text-sm font-semibold">
          Edit
        </span>
      </Link>
    </li>
  );
}

export default async function AdminEventsPage() {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("events.view")) {
    return (
      <div className="border-grey-100 rounded-2xl border bg-white p-10 text-center">
        <ShieldAlert className="text-grey-500 mx-auto size-8" />
        <p className="text-grey-500 mt-3 text-sm">
          Your role doesn&apos;t include events.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();
  // Yesterday-or-later counts as upcoming; the split happens in the queries so
  // render stays pure.
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 1);
  const cutoff = cutoffDate.toISOString();
  const [{ data: up }, { data: gone }] = await Promise.all([
    admin.from("events").select("*").gte("starts_at", cutoff).order("starts_at"),
    admin
      .from("events")
      .select("*")
      .lt("starts_at", cutoff)
      .order("starts_at", { ascending: false })
      .limit(20),
  ]);
  const upcoming = (up ?? []) as ChurchEvent[];
  const past = (gone ?? []) as ChurchEvent[];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Events</p>
          <h1 className="mt-2 text-3xl font-bold">Events</h1>
          <p className="text-grey-500 mt-2">
            Published events appear on the homepage, the events page and the
            calendar automatically, ordered by date.
          </p>
        </div>
        {ctx.can("events.manage") && (
          <BtnLink href="/admin/events/new" variant="green">
            <Plus className="size-4" /> New event
          </BtnLink>
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-heading text-ink text-lg font-bold">Upcoming</h2>
        {upcoming.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ul>
        ) : (
          <div className="border-grey-100 mt-4 rounded-2xl border border-dashed bg-white p-10 text-center">
            <CalendarDays className="text-grey-500 mx-auto size-7" />
            <p className="text-grey-500 mt-3 text-sm">
              Nothing coming up — create your first event.
            </p>
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-ink text-lg font-bold">Past</h2>
          <ul className="mt-4 space-y-3">
            {past.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
