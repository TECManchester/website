import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { EventCard } from "@/components/event-card";
import { Section } from "@/components/section";
import { location, service, socials } from "@/lib/church";
import { getUpcomingEvents } from "@/lib/events";

const instagram = socials.find((s) => s.name === "Instagram")!;

/**
 * Homepage "What's on".
 *
 * Shows up to three upcoming events from Supabase. With none published it
 * falls back to the Sunday gathering — which is genuinely weekly — rather
 * than an empty grid.
 */
export async function HomeEventsSection() {
  const events = await getUpcomingEvents(3);

  return (
    <Section>
      <div className="reveal mb-13 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">What&apos;s on</p>
          <h2 className="mt-3.5 text-[clamp(30px,4vw,46px)] font-bold">
            This week at Elevation
          </h2>
        </div>
        <BtnLink href="/events" variant="ghost">
          View all <ArrowRight className="size-4" />
        </BtnLink>
      </div>

      {events.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} className="reveal" />
            ))}
          </div>

          {/* The weekly gathering sits under the dated events, not among them. */}
          <div className="border-green/40 bg-green-100 reveal mt-8 flex flex-col gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Every week</p>
              <h3 className="font-heading mt-1.5 text-xl font-bold">
                Sunday Gathering · {service.startTime}
              </h3>
              <p className="text-grey-500 mt-1.5 text-sm">{location.full}</p>
            </div>
            <BtnLink href="/im-new" variant="navy" className="shrink-0">
              Plan your visit
            </BtnLink>
          </div>
        </>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <article className="reveal border-grey-100 hover:shadow-card-lg overflow-hidden rounded-2xl border bg-white transition duration-250 hover:-translate-y-1.5 md:col-span-2">
            <div className="from-ink to-ink-800 relative bg-linear-to-br md:h-full md:min-h-[220px]">
              <span className="brand-glow top-[-80px] right-[-60px] size-[280px]" />
              <div className="relative flex h-full flex-col justify-end p-7">
                <p className="eyebrow-on-ink">Every week</p>
                <h3 className="mt-2 text-[26px] font-bold text-white">
                  Sunday Gathering
                </h3>
                <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Clock className="text-green size-4" />
                    {service.startTime}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="text-green size-4" />
                    {location.venue}, {location.postcode}
                  </span>
                </p>
                <div className="mt-5">
                  <BtnLink href="/im-new" variant="green">
                    Plan your visit
                  </BtnLink>
                </div>
              </div>
            </div>
          </article>

          <article className="reveal border-grey-100 flex flex-col justify-center rounded-2xl border bg-white p-8">
            <span className="bg-green-100 mb-5 grid size-[54px] place-items-center rounded-[14px]">
              <Sparkles className="text-green-600 size-[26px]" />
            </span>
            <h3 className="mb-2 text-[21px] font-bold">More coming soon</h3>
            <p className="text-grey-500 mb-5 text-[15px]">
              Conferences, socials and midweek gatherings get announced on
              Instagram first.
            </p>
            <div>
              <BtnLink href={instagram.href} external variant="ghost">
                Follow along
              </BtnLink>
            </div>
          </article>
        </div>
      )}
    </Section>
  );
}
