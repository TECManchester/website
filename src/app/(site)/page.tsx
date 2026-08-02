import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Clock,
  Compass,
  Home,
  MapPin,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import { BtnLink } from "@/components/btn";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { HomeEventsSection } from "@/components/home-events-section";
import { HomeWatchSection } from "@/components/home-watch-section";
import { Section, SectionHeading } from "@/components/section";
import { getSettings } from "@/lib/settings";

/**
 * "First time?" cards.
 *
 * `image` is optional — without one the card falls back to a tinted panel with
 * the icon, so the section still looks deliberate before photography arrives.
 * See public/im-new/README.md for the spec.
 */
const newHereCards = [
  {
    icon: Home,
    title: "What to expect",
    body: "Passionate worship, a practical message from the Bible, and a genuinely warm welcome. Come as you are — nobody is checking what you're wearing.",
    href: "/im-new#what-to-expect",
    cta: "Learn more",
    image: "/im-new/what-to-expect.jpg" as string | null,
  },
  {
    icon: MapPin,
    title: "Times & location",
    body: "", // filled from settings at render
    href: "/im-new#find-us",
    cta: "Get directions",
    image: "/im-new/times-and-location.jpg" as string | null,
  },
  {
    icon: Baby,
    title: "Kids & teens",
    body: "The Seeds runs every Sunday for children, including a baby class, and 412 Nation is for teenagers. They're in good hands.",
    href: "/im-new#kids",
    cta: "See their spaces",
    image: "/im-new/kids-and-teens.jpg" as string | null,
  },
];

const involveCards = [
  {
    icon: Users,
    title: "Connect Groups",
    body: "Small groups across Manchester. Big enough to receive you, small enough to know you.",
    href: "/get-involved#connect-groups",
  },
  {
    icon: Sparkles,
    title: "Serve on the G-Squad",
    body: "Worship, welcome, kids, tech, production — more than forty teams to join.",
    href: "/get-involved#serve",
  },
  {
    icon: Baby,
    title: "The Seeds & 412 Nation",
    body: "Safe, joyful spaces for children and teenagers, every single Sunday.",
    href: "/get-involved#kids-and-teens",
  },
  {
    icon: Compass,
    title: "Next steps",
    body: "The Growth Track — from your first Sunday to living out your purpose.",
    href: "/get-involved#next-steps",
  },
];

/**
 * Placeholder while the YouTube band loads. Suspense keeps the rest of the
 * homepage static and instant — only this strip waits on the API.
 */
function WatchSkeleton() {
  return (
    <Section tone="grey">
      <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div className="bg-grey-100 aspect-video animate-pulse rounded-2xl" />
        <div className="space-y-4">
          <div className="bg-grey-100 h-4 w-24 animate-pulse rounded" />
          <div className="bg-grey-100 h-9 w-3/4 animate-pulse rounded" />
          <div className="bg-grey-100 h-16 w-full animate-pulse rounded" />
        </div>
      </div>
    </Section>
  );
}

function EventsSkeleton() {
  return (
    <Section>
      <div className="bg-grey-100 mb-13 h-12 w-72 animate-pulse rounded" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-grey-100 aspect-4/3 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    </Section>
  );
}

export default async function HomePage() {
  const { service, location, hero } = await getSettings();
  const cards = newHereCards.map((card) =>
    card.title === "Times & location"
      ? {
          ...card,
          body: `${service.day}s at ${service.startTime} in the ${location.venue} on the ${location.campus} campus. We'll help you find your way in.`,
        }
      : card,
  );
  return (
    <>
      {/* ===== Hero ===== */}
      {/*
        Full-viewport banner. The negative top margin slides it under the
        sticky header so the header floats over the image; the matching top
        padding keeps the content clear of it. dvh rather than vh so mobile
        browser chrome doesn't crop it.
      */}
      <section className="bg-ink relative -mt-[76px] flex min-h-dvh items-center overflow-hidden sm:-mt-[88px]">
        <HeroSlideshow slides={hero} />
        <span className="brand-glow top-[-160px] right-[-120px] size-[600px] blur-[20px]" />

        <div className="wrap relative z-2 pt-[calc(76px+3.5rem)] pb-14 sm:pt-[calc(88px+4rem)]">
          <div className="max-w-[760px]">
            <h1 className="mb-5 text-[clamp(42px,6vw,76px)] font-extrabold text-white">
              Making greatness <span className="text-green">common.</span>
            </h1>

            <p className="mb-8 max-w-[560px] text-[clamp(17px,2vw,20px)] text-pretty text-white/82">
              We&apos;re a Spirit-filled family in the heart of Manchester on one
              mission. Wherever you&apos;re coming from, there&apos;s a place for
              you here.
            </p>

            <div className="flex flex-wrap gap-3.5">
              <BtnLink href="/im-new" variant="green" size="lg">
                Plan your visit <ArrowRight className="size-4" />
              </BtnLink>
              <BtnLink href="/watch" variant="ghostOnDark" size="lg">
                <Play className="size-4 fill-current" /> Watch online
              </BtnLink>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-5">
              {[
                {
                  icon: Clock,
                  k: `${service.day}s ${service.startTime}`,
                  v: service.doorsOpen
                    ? `Doors from ${service.doorsOpen}`
                    : "Come a little early for a coffee",
                },
                {
                  icon: MapPin,
                  k: location.venue,
                  v: `${location.campus} · ${location.postcode}`,
                },
              ].map(({ icon: Icon, k, v }) => (
                <li key={k}>
                  <p className="font-heading flex items-center gap-2 text-[15px] font-bold text-white">
                    <Icon className="text-green size-[18px]" />
                    {k}
                  </p>
                  <p className="mt-0.5 pl-[26px] text-[13.5px] text-white/65">
                    {v}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== I'm new ===== */}
      <Section id="imnew">
        <SectionHeading
          eyebrow="First time?"
          title="We'd love to meet you"
          lead="Coming to a new church can feel like a big step. Here's everything you need to feel at home before you even arrive."
          align="center"
          className="reveal"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map(({ icon: Icon, title, body, href, cta, image }) => (
            <Link
              key={title}
              href={href}
              /*
               * No overflow-hidden on the card: the icon badge straddles the
               * image edge, and clipping here would slice it in half. The
               * image gets its own clipping container instead.
               */
              className="reveal group border-grey-100 hover:shadow-card-lg relative flex flex-col rounded-2xl border bg-white transition duration-250 hover:-translate-y-1.5"
            >
              <div className="relative">
                <div className="bg-green-100 relative aspect-4/3 overflow-hidden rounded-t-2xl">
                  {image ? (
                    <>
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span
                        aria-hidden
                        className="from-ink/35 absolute inset-0 bg-linear-to-t to-transparent"
                      />
                    </>
                  ) : (
                    <span
                      aria-hidden
                      className="from-green-100 to-green/35 absolute inset-0 bg-linear-to-br"
                    />
                  )}
                </div>
                {/* Sits outside the clipping container so it can overhang. */}
                <span className="bg-green shadow-card absolute bottom-0 left-6 grid size-14 translate-y-1/2 place-items-center rounded-2xl">
                  <Icon className="text-ink size-6" />
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6 pt-12">
                <h3 className="text-[21px] font-bold">{title}</h3>
                <p className="text-grey-500 mt-2 flex-1 text-[15px]">{body}</p>
                <span className="font-heading text-green-600 mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5">
                  {cta} <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="reveal mt-11 text-center">
          <BtnLink href="/im-new" variant="navy" size="lg">
            Plan my visit — everything you need to know
          </BtnLink>
        </div>
      </Section>

      {/* ===== Watch — live stream or latest message from YouTube ===== */}
      <Suspense fallback={<WatchSkeleton />}>
        <HomeWatchSection />
      </Suspense>

      {/* ===== What's on — upcoming events from Supabase ===== */}
      <Suspense fallback={<EventsSkeleton />}>
        <HomeEventsSection />
      </Suspense>

      {/* ===== Get involved (dark) ===== */}
      <Section tone="ink" id="involve">
        <SectionHeading
          eyebrow="Community"
          title="Don't do life alone"
          lead="Church is more than a Sunday. Find your people, use your gifts, and grow."
          tone="onInk"
          className="reveal"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {involveCards.map(({ icon: Icon, title, body, href }) => (
            <Link
              key={title}
              href={href}
              className="reveal hover:border-green/40 rounded-2xl border border-white/10 bg-white/4 p-7 transition duration-250 hover:-translate-y-1.5 hover:bg-white/8"
            >
              <span className="bg-green/16 mb-4.5 grid size-[50px] place-items-center rounded-[13px]">
                <Icon className="text-green size-6" />
              </span>
              <h3 className="mb-1.5 text-[19px] font-bold text-white">
                {title}
              </h3>
              <p className="text-sm text-white/60">{body}</p>
            </Link>
          ))}
        </div>
      </Section>

    </>
  );
}
