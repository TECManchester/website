import { BtnLink } from "@/components/btn";
import type { YouTubeVideo } from "@/lib/youtube";
import { EmbedGate } from "@/components/embed-gate";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

/** Red pulsing "on air" badge. */
export function LiveBadge({ label = "Live now" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#D64545] px-3.5 py-1.5 text-xs font-bold tracking-wide text-white uppercase">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75 motion-reduce:hidden" />
        <span className="relative inline-flex size-2 rounded-full bg-white" />
      </span>
      {label}
    </span>
  );
}

/**
 * Embedded player for whatever is on air.
 *
 * youtube-nocookie so no tracking cookie is set unless the visitor actually
 * plays something, and gated behind EmbedGate so the request to YouTube isn't
 * made at all until they've said yes — nocookie still discloses an IP address.
 */
export function LivePlayer({ video }: { video: YouTubeVideo }) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
      <div className="shadow-card-lg aspect-video overflow-hidden rounded-2xl">
        <EmbedGate
          kind="video"
          title="Watch the stream"
          className="size-full"
        >
          <iframe
            title={video.title}
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=0`}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="size-full"
          />
        </EmbedGate>
      </div>
      <div>
        <LiveBadge />
        <h2 className="mt-4 text-[34px] font-bold text-balance">
          {video.title}
        </h2>
        <p className="text-grey-500 mt-3">
          We&apos;re streaming right now — come and join us.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <BtnLink href={video.url} external variant="green">
            Watch on YouTube
          </BtnLink>
          <BtnLink href="/im-new" variant="ghost">
            Join us in person
          </BtnLink>
        </div>
      </div>
    </div>
  );
}

/** Countdown-free card for a scheduled stream or premiere. */
export function UpcomingStream({ video }: { video: YouTubeVideo }) {
  const when = video.scheduledStartTime
    ? timeFormat.format(new Date(video.scheduledStartTime))
    : null;

  return (
    <div className="border-green/40 bg-green-100 flex flex-col items-start justify-between gap-6 rounded-2xl border p-7 sm:flex-row sm:items-center">
      <div>
        <p className="eyebrow">Next stream</p>
        <h2 className="mt-2 text-2xl font-bold">{video.title}</h2>
        {when && <p className="text-grey-500 mt-2 text-sm">{when}</p>}
      </div>
      <BtnLink href={video.url} external variant="navy" className="shrink-0">
        Set a reminder
      </BtnLink>
    </div>
  );
}
