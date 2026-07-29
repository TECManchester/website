import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { EventCalendar, type CalendarEvent } from "@/components/event-calendar";
import { EventCard } from "@/components/event-card";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { location, service, socials } from "@/lib/church";
import {
  formatEventTime,
  getAllEvents,
  getUpcomingEvents,
  londonDateKey,
} from "@/lib/events";

export const metadata: Metadata = {
  title: "Events",
  description:
    "What's coming up at Elevation Church Manchester — Sunday gatherings, conferences and everything else in the diary.",
  alternates: { canonical: "/events" },
};

/** Staff can publish an event without waiting for a rebuild. */
export const revalidate = 300;

export default async function EventsPage() {
  const [upcoming, all] = await Promise.all([
    getUpcomingEvents(24),
    getAllEvents(),
  ]);

  const calendarEvents: CalendarEvent[] = all.map((event) => ({
    slug: event.slug,
    title: event.title,
    dateKey: londonDateKey(event.starts_at),
    time: formatEventTime(event),
  }));

  // Open on the month of the next event, not today's. Landing on an empty
  // month makes the calendar look broken when everything is weeks away.
  const initialMonth = (upcoming[0]
    ? londonDateKey(upcoming[0].starts_at)
    : londonDateKey(new Date().toISOString())
  ).slice(0, 7);

  return (
    <>
      <PageHero
        eyebrow="What's on"
        title="Events & gatherings"
        lead="There's always something happening. Find your next step, from Sunday gatherings to city-wide conferences."
      />

      <Section>
        {/* The Sunday gathering is the fixture everything else sits around. */}
        <div className="border-green/40 bg-green-100 mb-14 flex flex-col gap-6 rounded-2xl border p-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Every week</p>
            <h2 className="font-heading mt-2 text-2xl font-bold">
              Sunday Gathering
            </h2>
            <div className="text-grey-500 mt-3.5 space-y-1.5 text-sm">
              <p className="flex items-center gap-2">
                <Clock className="text-green-600 size-4 shrink-0" />
                {service.day}s at {service.startTime}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="text-green-600 size-4 shrink-0" />
                {location.full}
              </p>
            </div>
          </div>
          <BtnLink href="/im-new" variant="navy" className="shrink-0">
            Plan your visit
          </BtnLink>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-14">
          <div>
            <SectionHeading
              eyebrow="Coming up"
              title="Upcoming events"
              className="mb-8"
            />

            {upcoming.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} className="reveal" />
                ))}
              </div>
            ) : (
              <div className="border-grey-100 rounded-2xl border bg-white p-12 text-center">
                <CalendarDays className="text-green-600 mx-auto size-10" />
                <h3 className="mt-5 text-xl font-bold">
                  Nothing else in the diary just yet
                </h3>
                <p className="text-grey-500 mx-auto mt-3 max-w-md leading-relaxed">
                  Our Sunday gathering runs every week. Everything else gets
                  announced on Instagram first.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <BtnLink
                    href={socials.find((s) => s.name === "Instagram")!.href}
                    external
                    variant="green"
                  >
                    Follow on Instagram
                  </BtnLink>
                  <BtnLink href="/contact" variant="ghost">
                    Ask what&apos;s coming up
                  </BtnLink>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <EventCalendar
              events={calendarEvents}
              initialMonth={initialMonth}
            />
            <p className="text-grey-500 mt-4 px-1 text-xs leading-relaxed">
              Dates with a marker have something on. Tap one to see what.
            </p>
          </aside>
        </div>
      </Section>
    </>
  );
}
