import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { Card, CardContent } from "@/components/ui/card";
import { location, service, socials } from "@/lib/church";

export const metadata: Metadata = {
  title: "Events",
  description:
    "What's coming up at Elevation Church Manchester — Sunday services and everything else in the diary.",
  alternates: { canonical: "/events" },
};

type ChurchEvent = {
  title: string;
  /** ISO date, e.g. 2026-08-09 */
  date: string;
  time?: string;
  venue?: string;
  description: string;
  href?: string;
};

/**
 * TODO: no event data was supplied in the brief. Add entries here, or swap this
 * for a CMS / Google Calendar feed once one is chosen. The page renders an
 * honest empty state rather than inventing events.
 */
const upcomingEvents: ChurchEvent[] = [];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
});

export default function EventsPage() {
  return (
    <>
      <PageHero
        eyebrow="What's on"
        title="Events"
        lead="Sundays are the heartbeat. Here's everything else in the diary."
      />

      <Section>
        <Card className="border-green/40 bg-green-100">
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Every week</p>
              <h2 className="font-heading mt-2 text-2xl font-semibold">
                Sunday Service
              </h2>
              <div className="text-grey-500 mt-4 space-y-1.5 text-sm">
                <p className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" />
                  {service.day}s at {service.startTime}
                  {service.doorsOpen && ` · doors ${service.doorsOpen}`}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" />
                  {location.full}
                </p>
              </div>
            </div>
            <BtnLink variant="navy" href="/im-new" size="lg" className="shrink-0">
              Plan your visit
            </BtnLink>
          </CardContent>
        </Card>

        <div className="mt-16">
          <SectionHeading eyebrow="Coming up" title="Upcoming events" />

          {upcomingEvents.length > 0 ? (
            <ul className="mt-10 grid gap-6 md:grid-cols-2">
              {upcomingEvents.map((event) => (
                <li key={`${event.title}-${event.date}`}>
                  <Card className="h-full">
                    <CardContent>
                      <p className="eyebrow">
                        {dateFormatter.format(new Date(event.date))}
                      </p>
                      <h3 className="font-heading mt-2 text-xl font-semibold">
                        {event.title}
                      </h3>
                      <p className="text-grey-500 mt-3 text-sm leading-relaxed">
                        {event.description}
                      </p>
                      <div className="text-grey-500 mt-4 space-y-1 text-sm">
                        {event.time && (
                          <p className="flex items-center gap-2">
                            <Clock className="size-4 shrink-0" />
                            {event.time}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <MapPin className="size-4 shrink-0" />
                          {event.venue ?? location.full}
                        </p>
                      </div>
                      {event.href && (
                        <BtnLink
                          href={event.href}
                          variant="ghost"
                          className="mt-6"
                        >
                          Find out more
                        </BtnLink>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Card className="mt-10">
              <CardContent className="py-14 text-center">
                <CalendarDays className="text-green-600 mx-auto size-10" />
                <h3 className="mt-6 text-xl font-semibold">
                  Nothing else in the diary just yet
                </h3>
                <p className="text-grey-500 mx-auto mt-3 max-w-md leading-relaxed">
                  Our Sunday gathering runs every week. For everything else,
                  Instagram is where things get announced first.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <BtnLink variant="navy"
                    href={socials.find((s) => s.name === "Instagram")!.href}
                    external
                  >
                    Follow on Instagram
                  </BtnLink>
                  <BtnLink href="/contact" variant="ghost">
                    Ask what&apos;s coming up
                  </BtnLink>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Section>
    </>
  );
}
