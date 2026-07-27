"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarEvent = {
  slug: string;
  title: string;
  /** YYYY-MM-DD in Europe/London, precomputed on the server. */
  dateKey: string;
  time: string;
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const monthLabel = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
});

/**
 * Month grid of events.
 *
 * Dates are handled as YYYY-MM-DD strings computed on the server in London
 * time. Doing the maths on Date objects in the browser would shift events
 * across midnight for anyone in a different timezone.
 */
export function EventCalendar({
  events,
  initialMonth,
}: {
  events: CalendarEvent[];
  /** YYYY-MM — which month to open on. */
  initialMonth: string;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.dateKey) ?? [];
      list.push(event);
      map.set(event.dateKey, list);
    }
    return map;
  }, [events]);

  const [year, mon] = month.split("-").map(Number);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(year, mon - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
    // Monday-first offset.
    const lead = (first.getUTCDay() + 6) % 7;

    const out: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(
        `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      );
    }
    return out;
  }, [year, mon]);

  const shiftMonth = (delta: number) => {
    const next = new Date(Date.UTC(year, mon - 1 + delta, 1));
    setMonth(
      `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`,
    );
    setSelected(null);
  };

  const selectedEvents = selected ? (byDate.get(selected) ?? []) : [];

  return (
    <div className="border-grey-100 shadow-card rounded-2xl border bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold">
          {monthLabel.format(new Date(Date.UTC(year, mon - 1, 1)))}
        </h3>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="border-grey-300 hover:border-ink focus-visible:outline-green-600 grid size-8 place-items-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="border-grey-300 hover:border-ink focus-visible:outline-green-600 grid size-8 place-items-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-7 gap-1 text-center"
        role="grid"
        aria-label="Events calendar"
      >
        {WEEKDAYS.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-grey-500 pb-2 text-xs font-semibold"
            aria-hidden
          >
            {d}
          </div>
        ))}

        {cells.map((key, i) => {
          if (!key) return <div key={`pad-${i}`} />;

          const dayEvents = byDate.get(key) ?? [];
          const has = dayEvents.length > 0;
          const isSelected = selected === key;
          const day = Number(key.slice(-2));

          return (
            <div key={key} className="aspect-square p-0.5">
              {has ? (
                <button
                  type="button"
                  onClick={() => setSelected(isSelected ? null : key)}
                  aria-label={`${day} — ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "focus-visible:outline-green-600 relative grid size-full place-items-center rounded-lg text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2",
                    isSelected
                      ? "bg-ink text-white"
                      : "bg-green-100 text-ink hover:bg-green hover:text-ink",
                  )}
                >
                  {day}
                  <span
                    className={cn(
                      "absolute bottom-1 size-1 rounded-full",
                      isSelected ? "bg-green" : "bg-green-600",
                    )}
                  />
                </button>
              ) : (
                <div className="text-grey-500 grid size-full place-items-center text-sm">
                  {day}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected && selectedEvents.length > 0 && (
        <ul className="border-grey-100 mt-5 space-y-3 border-t pt-5">
          {selectedEvents.map((event) => (
            <li key={event.slug}>
              <Link
                href={`/events/${event.slug}`}
                className="hover:bg-grey-50 -mx-2 block rounded-lg px-2 py-2 transition-colors"
              >
                <p className="font-heading text-ink font-semibold">
                  {event.title}
                </p>
                <p className="text-grey-500 text-sm">{event.time}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
