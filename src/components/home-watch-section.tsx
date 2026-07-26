import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { LiveBadge } from "@/components/live-player";
import { Section } from "@/components/section";
import { CHANNEL_URL, getLiveNow, getRecentVideos } from "@/lib/youtube";

/**
 * Homepage "Watch" band.
 *
 * Three states, in priority order: on air now, the most recent message, or —
 * if YouTube isn't configured or is unreachable — a plain link to the channel.
 */
export async function HomeWatchSection() {
  const [live, recent] = await Promise.all([getLiveNow(), getRecentVideos(6)]);
  const latest = live ?? recent.find((v) => v.liveStatus === "none") ?? null;

  const href = latest?.url ?? CHANNEL_URL;

  return (
    <Section tone="grey">
      <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
        <Link
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={
            live
              ? `Watch live: ${live.title}`
              : latest
                ? `Watch: ${latest.title}`
                : "Watch on our YouTube channel"
          }
          className="reveal group bg-ink-800 shadow-card-lg relative grid aspect-video place-items-center overflow-hidden rounded-2xl"
        >
          {latest?.thumbnail ? (
            <Image
              src={latest.thumbnail}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
              priority={false}
            />
          ) : (
            <span
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#2a2a5e_0%,transparent_60%)]"
            />
          )}

          <span
            aria-hidden
            className="from-ink/10 to-ink/60 absolute inset-0 bg-linear-to-b"
          />

          <span className="absolute top-4 left-4">
            {live ? (
              <LiveBadge />
            ) : (
              <span className="font-heading bg-ink/70 rounded-lg px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                {latest ? "Latest message" : "Every message, on YouTube"}
              </span>
            )}
          </span>

          <span className="group-hover:bg-green relative grid size-[82px] place-items-center rounded-full bg-white/92 shadow-[0_10px_30px_rgb(0_0_0_/_0.3)] transition duration-250 group-hover:scale-108">
            <Play className="text-ink ml-1 size-[30px] fill-current" />
          </span>
        </Link>

        <div className="reveal">
          <p className="eyebrow">{live ? "On air now" : "Messages"}</p>
          <h2 className="mt-3 mb-3.5 text-[34px] font-bold text-balance">
            {live ? live.title : latest ? latest.title : "Missed a Sunday?"}
          </h2>
          <p className="mb-6 text-pretty">
            {live
              ? "We're streaming right now — join us from wherever you are."
              : "Full services and recent messages go up on our YouTube channel. Subscribe and you'll know the moment a new one lands."}
          </p>
          <div className="flex flex-wrap gap-3">
            <BtnLink href={href} external variant="green">
              {live ? "Watch live" : "Watch now"}
            </BtnLink>
            <BtnLink href="/watch" variant="ghost">
              All messages
            </BtnLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
