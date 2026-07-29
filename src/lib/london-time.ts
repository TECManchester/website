/**
 * Conversions between <input type="datetime-local"> values (naive wall-clock
 * strings) and UTC ISO, treating the wall clock as Europe/London.
 *
 * Without this, an admin typing 11:00 on an August event would store 11:00 UTC
 * and the site would show 12:00 — the BST bug, in reverse of the display path.
 */

const LONDON = "Europe/London";

/** Offset (minutes east of UTC) London has at the given instant. */
function londonOffsetMinutes(atMs: number): number {
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    timeZoneName: "longOffset",
  })
    .formatToParts(new Date(atMs))
    .find((p) => p.type === "timeZoneName")?.value; // "GMT" | "GMT+01:00"

  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(label ?? "");
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** "2026-08-08T11:00" (London wall clock) → UTC ISO string. */
export function londonNaiveToUtcIso(naive: string): string {
  const guess = Date.parse(`${naive}:00Z`);
  if (Number.isNaN(guess)) throw new Error(`Bad datetime: ${naive}`);
  const offset = londonOffsetMinutes(guess);
  return new Date(guess - offset * 60_000).toISOString();
}

/** UTC ISO → "YYYY-MM-DDTHH:mm" London wall clock, for datetime-local inputs. */
export function utcIsoToLondonNaive(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
