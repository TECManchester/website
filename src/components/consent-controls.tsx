"use client";

import { useConsent } from "@/components/consent-provider";

/**
 * Controls for the embed preference, shown on the privacy page.
 *
 * There is deliberately no site-wide banner. A consent banner exists to get
 * permission BEFORE something non-essential loads — this site sets no cookies,
 * runs no analytics, and holds every third-party embed behind a click, so
 * there is nothing that needs permission in advance. Interrupting every
 * visitor to ask about something that hasn't happened is the "cookie theatre"
 * the ICO warns against, and it made the site look like it tracked people when
 * it doesn't.
 *
 * Instead: embeds are gated by default, clicking one is consent for that one,
 * and anyone who wants them on permanently can say so here.
 */

export function ConsentControls() {
  const { embeds, ready, grant, decline, reset } = useConsent();
  if (!ready) return null;

  const current =
    embeds === "granted"
      ? "Maps and videos load automatically."
      : embeds === "declined"
        ? "Maps and videos stay behind a click."
        : "You haven't chosen yet — maps and videos stay behind a click.";

  return (
    <div className="border-grey-100 rounded-2xl border bg-white p-5">
      <p className="font-heading text-ink font-bold">Your current choice</p>
      <p className="text-grey-500 mt-1.5 text-sm">{current}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={grant}
          className="font-heading bg-green text-ink rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-105"
        >
          Allow maps &amp; videos
        </button>
        <button
          type="button"
          onClick={decline}
          className="font-heading border-grey-300 text-ink hover:border-ink rounded-full border px-4 py-2 text-sm font-bold transition"
        >
          Keep them off
        </button>
        {embeds !== null && (
          <button
            type="button"
            onClick={reset}
            className="text-grey-500 hover:text-ink px-2 py-2 text-sm underline"
          >
            Clear my choice
          </button>
        )}
      </div>
    </div>
  );
}
