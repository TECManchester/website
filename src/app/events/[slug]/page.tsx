import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { EventCard } from "@/components/event-card";
import { Section, SectionHeading } from "@/components/section";
import { location } from "@/lib/church";
import {
  formatEventDate,
  formatEventDateRange,
  formatEventTime,
  getAllEvents,
  getEventBySlug,
  getUpcomingEvents,
  isMultiDay,
} from "@/lib/events";

export const revalidate = 300;

/** Pre-render every published event; anything new is caught by revalidate. */
export async function generateStaticParams() {
  const events = await getAllEvents();
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };

  return {
    title: event.title,
    description: event.summary ?? undefined,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description: event.summary ?? undefined,
      images: event.image_url ? [event.image_url] : undefined,
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const others = (await getUpcomingEvents(4)).filter((e) => e.slug !== slug);
  const venue = event.venue ?? location.full;

  return (
    <>
      <section className="bg-ink relative overflow-hidden text-white">
        {event.image_url && (
          <>
            <Image
              src={event.image_url}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-40"
            />
            <span
              aria-hidden
              className="from-ink via-ink/80 absolute inset-0 bg-linear-to-t to-transparent"
            />
          </>
        )}
        <span className="brand-glow top-[-200px] right-[-100px] size-[500px]" />

        <div className="wrap relative py-16 sm:py-20">
          <Link
            href="/events"
            className="hover:text-green mb-7 inline-flex items-center gap-2 text-sm text-white/70 transition-colors"
          >
            <ArrowLeft className="size-4" /> All events
          </Link>

          <h1 className="max-w-3xl text-[clamp(32px,5vw,52px)] font-extrabold text-balance text-white">
            {event.title}
          </h1>

          {event.summary && (
            <p className="mt-4 max-w-2xl text-lg text-pretty text-white/75">
              {event.summary}
            </p>
          )}

          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            <li className="flex items-center gap-2.5 text-white">
              <CalendarDays className="text-green size-5 shrink-0" />
              <span className="font-heading font-semibold">
                {isMultiDay(event)
                  ? formatEventDateRange(event)
                  : formatEventDate(event)}
              </span>
            </li>
            <li className="flex items-center gap-2.5 text-white">
              <Clock className="text-green size-5 shrink-0" />
              <span className="font-heading font-semibold">
                {formatEventTime(event)}
              </span>
            </li>
            <li className="flex items-center gap-2.5 text-white">
              <MapPin className="text-green size-5 shrink-0" />
              <span className="font-heading font-semibold">{venue}</span>
            </li>
          </ul>

          {event.cta_url && (
            <div className="mt-9">
              <BtnLink
                href={event.cta_url}
                external={event.cta_url.startsWith("http")}
                variant="green"
                size="lg"
              >
                {event.cta_label ?? "Register"}
              </BtnLink>
            </div>
          )}
        </div>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
          <div>
            {event.description ? (
              // Preserves paragraph breaks from the CMS without needing a
              // markdown pipeline.
              <div className="space-y-5 text-lg leading-relaxed text-pretty">
                {event.description
                  .split(/\n{2,}/)
                  .map((para: string) => para.trim())
                  .filter(Boolean)
                  .map((para: string) => (
                    <p key={para.slice(0, 40)}>{para}</p>
                  ))}
              </div>
            ) : (
              <p className="text-grey-500 text-lg">
                More details coming soon. In the meantime, just turn up — you&apos;re
                very welcome.
              </p>
            )}
          </div>

          <aside className="border-grey-100 h-fit rounded-2xl border p-6">
            <h2 className="font-heading text-lg font-bold">Getting there</h2>
            <address className="text-grey-500 mt-3 space-y-1 text-sm not-italic">
              {venue.split(",").map((line) => (
                <p key={line}>{line.trim()}</p>
              ))}
            </address>
            <div className="mt-5 flex flex-col gap-2.5">
              <BtnLink href={location.mapsUrl} external variant="ghost" block>
                Get directions
              </BtnLink>
              <BtnLink href="/contact" variant="ghost" block>
                Ask a question
              </BtnLink>
            </div>
          </aside>
        </div>
      </Section>

      {others.length > 0 && (
        <Section tone="grey">
          <SectionHeading eyebrow="Also coming up" title="More events" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.slice(0, 3).map((other) => (
              <EventCard key={other.id} event={other} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
