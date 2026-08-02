"use client";

import { useState } from "react";
import { MapPin, Play } from "lucide-react";
import { useConsent } from "@/components/consent-provider";
import { cn } from "@/lib/utils";

/**
 * Holds a third-party embed back until the visitor is happy for it to load.
 *
 * Nothing is requested from Google until either a site-wide choice has been
 * made or this particular embed is clicked — so a visitor who never touches it
 * never appears in anyone else's logs. Clicking counts as consent for this one
 * embed without changing the site-wide setting, which is the "specific and
 * informed" bit of consent doing real work rather than a checkbox.
 */
export function EmbedGate({
  kind,
  title,
  description,
  className,
  children,
}: {
  kind: "map" | "video";
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { embeds, ready } = useConsent();
  const [allowedOnce, setAllowedOnce] = useState(false);

  const allowed = embeds === "granted" || allowedOnce;

  // Until localStorage has been read, render the placeholder shell without the
  // button so the layout doesn't jump when the answer arrives.
  if (allowed) return <>{children}</>;

  const Icon = kind === "map" ? MapPin : Play;

  return (
    <div
      className={cn(
        "bg-grey-100 border-grey-300 relative grid place-items-center rounded-xl border border-dashed p-8 text-center",
        className,
      )}
    >
      {/*
        Deliberately understated. The point is a one-tap "show me" — the
        privacy reason is a quiet footnote, not a warning notice. Anything
        heavier reads as a consent wall, which is the thing we're avoiding.
      */}
      <div className="max-w-sm">
        <span className="bg-white/80 mx-auto grid size-12 place-items-center rounded-2xl">
          <Icon className="text-green-600 size-5" />
        </span>
        <p className="font-heading text-ink mt-4 font-bold">{title}</p>
        <button
          type="button"
          disabled={!ready}
          onClick={() => setAllowedOnce(true)}
          className="bg-green text-ink font-heading mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition hover:brightness-105 disabled:opacity-50"
        >
          <Icon className="size-4" />
          {kind === "map" ? "Show the map" : "Play the video"}
        </button>
        <p className="text-grey-500 mt-3 text-xs">
          {description ??
            (kind === "map"
              ? "Loads from Google Maps"
              : "Loads from YouTube")}
        </p>
      </div>
    </div>
  );
}
