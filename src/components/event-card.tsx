import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import {
  eventDayNumber,
  eventMonthShort,
  formatEventDateRange,
  formatEventTime,
  isMultiDay,
  type ChurchEvent,
} from "@/lib/events";
import { location } from "@/lib/church";
import { cn } from "@/lib/utils";

/** Grid card — used on the homepage and the events index. */
export function EventCard({
  event,
  className,
}: {
  event: ChurchEvent;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "border-grey-100 hover:shadow-card-lg group overflow-hidden rounded-2xl border bg-white transition duration-250 hover:-translate-y-1.5",
        className,
      )}
    >
      <Link href={`/events/${event.slug}`} className="block">
        <div className="bg-ink relative aspect-video overflow-hidden">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#2a2a5e_0%,transparent_60%)]"
            />
          )}
          <span
            aria-hidden
            className="from-ink/50 absolute inset-0 bg-linear-to-t to-transparent"
          />
          {/* Date chip */}
          <span className="shadow-card absolute top-3.5 left-3.5 rounded-[11px] bg-white px-3 py-2 text-center leading-none">
            <span className="font-heading text-ink block text-xl font-extrabold">
              {eventDayNumber(event)}
            </span>
            <span className="text-green-600 mt-0.5 block text-[11px] font-bold tracking-[0.08em] uppercase">
              {eventMonthShort(event)}
            </span>
          </span>
        </div>

        <div className="p-5.5">
          <h3 className="group-hover:text-green-600 text-xl font-bold text-balance transition-colors">
            {event.title}
          </h3>
          {event.summary && (
            <p className="text-grey-500 mt-2 line-clamp-2 text-sm">
              {event.summary}
            </p>
          )}
          <div className="text-grey-500 mt-3.5 space-y-1.5 text-sm">
            <p className="flex items-center gap-2">
              {isMultiDay(event) ? (
                <CalendarDays className="text-green-600 size-4 shrink-0" />
              ) : (
                <Clock className="text-green-600 size-4 shrink-0" />
              )}
              {isMultiDay(event)
                ? formatEventDateRange(event)
                : formatEventTime(event)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="text-green-600 size-4 shrink-0" />
              {event.venue ?? location.venue}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
