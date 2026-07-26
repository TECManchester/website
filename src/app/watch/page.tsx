import type { Metadata } from "next";
import { MonitorPlay } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { LivePlayer, UpcomingStream } from "@/components/live-player";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { VideoCard } from "@/components/video-card";
import { location, service } from "@/lib/church";
import {
  CHANNEL_URL,
  getLiveNow,
  getPastMessages,
  getUpcomingStream,
  isYouTubeConfigured,
} from "@/lib/youtube";

export const metadata: Metadata = {
  title: "Watch",
  description:
    "Watch Elevation Church Manchester live on Sundays at 10:30am, or catch up on recent messages.",
  alternates: { canonical: "/watch" },
};

/**
 * Revalidate every minute so a stream going live shows up quickly. The
 * underlying fetches are cached at the same interval and cost 2 API units, so
 * this stays well inside the daily quota.
 */
export const revalidate = 60;

export default async function WatchPage() {
  const [live, upcoming, messages] = await Promise.all([
    getLiveNow(),
    getUpcomingStream(),
    getPastMessages(12),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Messages"
        title={live ? "We're live right now" : "Watch & grow"}
        lead={
          live
            ? "Join the service from wherever you are."
            : `Catch this week's message or dig into the archive. Live every ${service.day} at ${service.startTime}.`
        }
      />

      {live && (
        <Section>
          <LivePlayer video={live} />
        </Section>
      )}

      {!live && upcoming && (
        <Section>
          <UpcomingStream video={upcoming} />
        </Section>
      )}

      <Section tone={live || upcoming ? "grey" : "default"}>
        {messages.length > 0 ? (
          <>
            <SectionHeading
              eyebrow="Catch up"
              title="Recent messages"
              lead="Straight from our YouTube channel — this list updates itself."
              className="reveal"
            />
            <div className="grid gap-6.5 sm:grid-cols-2 lg:grid-cols-3">
              {messages.map((video) => (
                <VideoCard key={video.id} video={video} className="reveal" />
              ))}
            </div>
            <div className="mt-12">
              <BtnLink href={CHANNEL_URL} external variant="ghost">
                See everything on YouTube
              </BtnLink>
            </div>
          </>
        ) : (
          /*
           * Shown when the key is missing or the API is unreachable — the page
           * still sends people somewhere useful rather than looking broken.
           */
          <div className="border-grey-100 mx-auto max-w-2xl rounded-2xl border bg-white p-12 text-center">
            <MonitorPlay className="text-green-600 mx-auto size-10" />
            <h2 className="mt-6 text-2xl font-bold">
              Every message, on our channel
            </h2>
            <p className="text-grey-500 mx-auto mt-3 max-w-md leading-relaxed">
              {isYouTubeConfigured
                ? "We couldn't load the archive just now. It's all on YouTube in the meantime."
                : "Full services and recent messages are on YouTube. Subscribe and you'll know the moment a new one lands."}
            </p>
            <div className="mt-8 flex justify-center">
              <BtnLink href={CHANNEL_URL} external variant="green" size="lg">
                Watch on YouTube
              </BtnLink>
            </div>
          </div>
        )}
      </Section>

      <Section tone="ink">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <SectionHeading
            title="Better in the room"
            lead={`Online is good. In person is better. ${service.day}s at ${service.startTime}, ${location.full}.`}
            tone="onInk"
          />
          <BtnLink
            href="/im-new"
            variant="green"
            size="lg"
            className="shrink-0"
          >
            Plan a visit
          </BtnLink>
        </div>
      </Section>
    </>
  );
}
