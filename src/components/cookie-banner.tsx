"use client";

import Link from "next/link";
import { Cookie } from "lucide-react";
import { useConsent } from "@/components/consent-provider";

/**
 * The cookie notice.
 *
 * Deliberately not the usual "we value your privacy" wall. Two rules shaped it:
 *
 *  - It says what actually happens. This site sets no cookies of its own on the
 *    public pages, has no analytics and no advertising. The only third party is
 *    an embedded map or video, so that is what it asks about.
 *  - Decline is exactly as easy as accept: same size, same weight, side by
 *    side, no "manage preferences" maze in between. That's an explicit ICO
 *    requirement and the thing most banners get wrong.
 *
 * It doesn't block the page. Nothing non-essential loads before a choice is
 * made anyway — the embeds are gated — so there's no reason to hold a visitor
 * hostage to dismiss it.
 */
export function CookieBanner() {
  const { embeds, ready, grant, decline } = useConsent();

  // Wait for localStorage so it doesn't flash for people who already answered.
  if (!ready || embeds !== null) return null;

  return (
    <div
      role="region"
      aria-label="Cookies and privacy"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
    >
      <div className="shadow-card-lg border-grey-100 mx-auto max-w-3xl rounded-2xl border bg-white p-5 sm:p-6">
        <div className="flex gap-4">
          <span className="bg-green-100 hidden size-11 shrink-0 place-items-center rounded-xl sm:grid">
            <Cookie className="text-green-600 size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-ink font-bold">
              A quick note on privacy
            </p>
            <p className="text-grey-500 mt-1.5 text-sm leading-relaxed">
              We don&apos;t track you. This site uses no advertising cookies and
              no analytics. The only thing that involves anyone else is the
              embedded maps and videos — loading those shares your IP address
              with Google. You can let them load automatically, or leave them
              behind a click.{" "}
              <Link
                href="/privacy"
                className="text-green-600 font-semibold underline underline-offset-2"
              >
                Read our privacy notice
              </Link>
              .
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={grant}
                className="font-heading bg-green text-ink rounded-full px-5 py-2.5 text-sm font-bold transition hover:brightness-105"
              >
                Allow maps &amp; videos
              </button>
              {/*
                Same size and weight as accept. A quieter "reject" is the single
                most common way banners fall foul of the rules.
              */}
              <button
                type="button"
                onClick={decline}
                className="font-heading border-grey-300 text-ink hover:border-ink rounded-full border px-5 py-2.5 text-sm font-bold transition"
              >
                Keep them off
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lets someone change their mind later — linked from the privacy notice. */
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
