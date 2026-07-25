import type { Metadata } from "next";
import { MonitorPlay } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { PageHeader, Section, SectionHeading } from "@/components/section";
import { Card, CardContent } from "@/components/ui/card";
import { location, service, socials } from "@/lib/church";

export const metadata: Metadata = {
  title: "Watch",
  description:
    "Catch up on messages from Elevation Church Manchester, or join us live on a Sunday.",
  alternates: { canonical: "/watch" },
};

const youtube = socials.find((s) => s.name === "YouTube")!;

/**
 * TODO: wire up the YouTube Data API (or paste video IDs here) to list recent
 * messages. Needs a YOUTUBE_API_KEY and the channel ID already in socials.
 * Until then this page points people at the channel rather than faking a feed.
 */
const featuredSermons: { id: string; title: string; date: string }[] = [];

export default function WatchPage() {
  return (
    <>
      <PageHeader
        eyebrow="Messages"
        title="Watch and catch up"
        lead={`Missed a ${service.day}? Every message goes up on our YouTube channel.`}
      />

      <Section>
        {featuredSermons.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2">
            {featuredSermons.map((sermon) => (
              <Card key={sermon.id} className="overflow-hidden pt-0">
                <div className="aspect-video">
                  <iframe
                    title={sermon.title}
                    src={`https://www.youtube-nocookie.com/embed/${sermon.id}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="size-full"
                  />
                </div>
                <CardContent>
                  <h2 className="text-lg font-semibold">{sermon.title}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {sermon.date}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mx-auto max-w-2xl text-center">
            <CardContent className="py-14">
              <MonitorPlay className="text-brand-green mx-auto size-10" />
              <h2 className="mt-6 text-2xl font-semibold">
                Every message, on our channel
              </h2>
              <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-relaxed">
                Full services and recent messages are on YouTube. Subscribe and
                you&apos;ll know the moment a new one lands.
              </p>
              <ButtonLink
                href={youtube.href}
                external
                size="lg"
                className="mt-8"
              >
                <MonitorPlay className="size-5" /> Watch on YouTube
              </ButtonLink>
            </CardContent>
          </Card>
        )}
      </Section>

      <Section tone="navy">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <SectionHeading
            title="Better in the room"
            lead={`Online is good. In person is better. ${service.day}s at ${service.startTime}, ${location.full}.`}
            tone="onNavy"
          />
          <ButtonLink
            href="/im-new"
            size="lg"
            className="bg-brand-green text-brand-navy hover:bg-brand-green/90 shrink-0"
          >
            Plan a visit
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
