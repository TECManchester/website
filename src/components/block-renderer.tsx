import Image from "next/image";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BtnLink } from "@/components/btn";
import { ContactForm } from "@/components/contact-form";
import { EventCard } from "@/components/event-card";
import { GiftAidForm } from "@/components/gift-aid-form";
import { HomeWatchSection } from "@/components/home-watch-section";
import { NewsletterForm } from "@/components/newsletter-form";
import { PageHero, Section } from "@/components/section";
import { PrayerForm } from "@/components/prayer-form";
import { TiptapRender } from "@/components/tiptap-render";
import type { BlockData, BlockType, TiptapDoc } from "@/lib/blocks";
import { getUpcomingEvents } from "@/lib/events";

/**
 * Renders a page's block list. Every branch tolerates missing data — a badly
 * edited block renders as little as possible rather than erroring the page.
 */

type RenderableBlock = { id: string; type: string; data: BlockData };

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? (v as Record<string, unknown>[]) : [];

async function RenderBlock({ block }: { block: RenderableBlock }) {
  const d = block.data ?? {};

  switch (block.type as BlockType) {
    case "page-hero":
      return (
        <PageHero
          eyebrow={str(d.eyebrow) || undefined}
          title={str(d.title) || "Untitled"}
          lead={str(d.lead) || undefined}
        />
      );

    case "rich-text":
      return (
        <Section>
          <div className="mx-auto max-w-3xl">
            <TiptapRender doc={d.content as TiptapDoc} />
          </div>
        </Section>
      );

    case "image": {
      const url = str(d.url);
      if (!url) return null;
      return (
        <Section className="py-8 sm:py-12">
          <figure className="mx-auto max-w-4xl">
            <div className="bg-grey-100 relative aspect-video overflow-hidden rounded-2xl">
              <Image
                src={url}
                alt={str(d.alt)}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>
            {str(d.caption) && (
              <figcaption className="text-grey-500 mt-3 text-center text-sm">
                {str(d.caption)}
              </figcaption>
            )}
          </figure>
        </Section>
      );
    }

    case "date-card": {
      const dateIso = str(d.date);
      const parsed = /^\d{4}-\d{2}-\d{2}$/.test(dateIso)
        ? new Date(`${dateIso}T12:00:00Z`)
        : null;
      const day = parsed
        ? new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "Europe/London" }).format(parsed)
        : "?";
      const month = parsed
        ? new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "Europe/London" }).format(parsed)
        : "";
      const weekday = parsed
        ? new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }).format(parsed)
        : "";
      return (
        <Section className="py-10 sm:py-14">
          <div className="border-grey-100 shadow-card mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-3xl border bg-white p-8 sm:flex-row sm:gap-8 sm:p-10">
            <div className="bg-ink relative shrink-0 overflow-hidden rounded-2xl px-7 py-5 text-center">
              <span className="brand-glow top-[-40px] right-[-40px] size-[140px]" />
              <span className="font-heading text-green relative block text-5xl font-extrabold">
                {day}
              </span>
              <span className="relative mt-1 block text-sm font-bold tracking-[0.14em] text-white uppercase">
                {month}
              </span>
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <h3 className="text-2xl font-bold text-balance">{str(d.title)}</h3>
              <div className="text-grey-500 mt-3 space-y-1.5 text-[15px]">
                {weekday && (
                  <p className="flex items-center justify-center gap-2 sm:justify-start">
                    <CalendarDays className="text-green-600 size-4 shrink-0" />
                    {weekday}
                  </p>
                )}
                {str(d.time) && (
                  <p className="flex items-center justify-center gap-2 sm:justify-start">
                    <Clock className="text-green-600 size-4 shrink-0" />
                    {str(d.time)}
                  </p>
                )}
                {str(d.place) && (
                  <p className="flex items-center justify-center gap-2 sm:justify-start">
                    <MapPin className="text-green-600 size-4 shrink-0" />
                    {str(d.place)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Section>
      );
    }

    case "icon-cards": {
      const cards = arr(d.cards);
      if (cards.length === 0) return null;
      return (
        <Section>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.slice(0, 4).map((card, i) => (
              <div
                key={i}
                className="border-grey-100 rounded-2xl border bg-white p-7"
              >
                <h3 className="text-xl font-bold">{str(card.title)}</h3>
                <p className="text-grey-500 mt-2 text-[15px] leading-relaxed">
                  {str(card.body)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case "accordion": {
      const items = arr(d.items);
      if (items.length === 0) return null;
      return (
        <Section>
          <div className="mx-auto max-w-3xl">
            <Accordion className="w-full">
              {items.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {str(item.title)}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-grey-500 leading-relaxed whitespace-pre-line">
                      {str(item.body)}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Section>
      );
    }

    case "cta-band": {
      const buttons = arr(d.buttons);
      return (
        <Section tone="ink">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-[620px]">
              {str(d.title) && (
                <h2 className="text-[clamp(30px,4vw,46px)] font-bold text-white">
                  {str(d.title)}
                </h2>
              )}
              {str(d.lead) && (
                <p className="mt-4 text-lg text-white/60">{str(d.lead)}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              {buttons.slice(0, 2).map((button, i) => {
                const href = str(button.href) || "/";
                const external = href.startsWith("http");
                return (
                  <BtnLink
                    key={i}
                    href={href}
                    external={external}
                    variant={
                      str(button.style) === "ghost" ? "ghostOnDark" : "green"
                    }
                    size="lg"
                  >
                    {str(button.label) || "Find out more"}
                  </BtnLink>
                );
              })}
            </div>
          </div>
        </Section>
      );
    }

    case "stats": {
      const items = arr(d.items);
      if (items.length === 0) return null;
      return (
        <Section className="py-10 sm:py-14">
          <dl className="border-grey-100 grid grid-cols-2 gap-6 border-y py-8 text-center lg:grid-cols-4">
            {items.slice(0, 4).map((item, i) => (
              <div key={i}>
                <dt className="sr-only">{str(item.label)}</dt>
                <dd>
                  <span className="font-heading text-ink block text-[clamp(30px,4vw,46px)] font-extrabold tracking-[-0.03em]">
                    {str(item.value)}
                  </span>
                  <span className="text-grey-500 mt-0.5 block text-sm">
                    {str(item.label)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      );
    }

    case "event-list": {
      const limit = Math.min(Number(d.limit) || 3, 6);
      const events = await getUpcomingEvents(limit);
      if (events.length === 0) return null;
      return (
        <Section>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </Section>
      );
    }

    case "youtube-latest":
      return <HomeWatchSection />;

    case "form": {
      const kind = str(d.kind);
      return (
        <Section>
          <div className="mx-auto max-w-2xl">
            {kind === "prayer" ? (
              <PrayerForm />
            ) : kind === "newsletter" ? (
              <div className="bg-ink relative overflow-hidden rounded-3xl p-8 sm:p-10">
                <span className="brand-glow top-[-120px] right-[-60px] size-[300px]" />
                <div className="relative">
                  <NewsletterForm />
                </div>
              </div>
            ) : kind === "giftaid" ? (
              <GiftAidForm />
            ) : (
              <ContactForm />
            )}
          </div>
        </Section>
      );
    }

    default:
      return null;
  }
}

export function BlockRenderer({ blocks }: { blocks: RenderableBlock[] }) {
  return (
    <>
      {blocks.map((block) => (
        <RenderBlock key={block.id} block={block} />
      ))}
    </>
  );
}
