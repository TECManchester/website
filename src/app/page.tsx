import { Suspense } from "react";
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
import { HomeWatchSection } from "@/components/home-watch-section";
import { NewsletterForm } from "@/components/newsletter-form";
import { Section, SectionHeading } from "@/components/section";
import {
  church,
  giving,
  location,
  service,
  socials,
} from "@/lib/church";

const instagram = socials.find((s) => s.name === "Instagram")!;

const newHereCards = [
  {
    icon: Home,
    title: "What to expect",
    body: "Passionate worship, a practical message from the Bible, and time to pray. Come as you are — nobody is checking what you're wearing.",
    href: "/im-new#what-to-expect",
    cta: "Learn more",
  },
  {
    icon: MapPin,
    title: "Times & location",
    body: `${service.day}s at ${service.startTime} in the ${location.venue} on the ${location.campus} campus. We'll help you find your way in.`,
    href: "/im-new#find-us",
    cta: "Get directions",
  },
  {
    icon: Baby,
    title: "Kids & teens",
    body: "The Seeds runs every Sunday for children, including a baby class, and 412 Nation is for teenagers. They're in good hands.",
    href: "/im-new#kids",
    cta: "See their spaces",
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

const stats = [
  { value: "10:30", unit: "AM", label: "Every Sunday" },
  { value: "May", unit: " 2023", label: "Manchester launched" },
  { value: "2", unit: "", label: "Kids & teens ministries" },
  { value: "+25", unit: "%", label: "Gift Aid on your giving" },
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

export default function HomePage() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="bg-ink relative flex min-h-[78vh] items-center overflow-hidden">
        {/*
          TODO: swap this gradient for real congregation photography once we
          have it. Deliberately not using stock imagery of a different church.
        */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_-10%,#26265c_0%,transparent_55%),radial-gradient(ellipse_at_90%_110%,#1a1a3f_0%,transparent_50%)]"
        />
        <span className="brand-glow top-[-160px] right-[-120px] size-[600px] blur-[20px]" />

        <div className="wrap relative z-2 py-15">
          <div className="max-w-[760px]">
            <p className="font-heading mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-[13.5px] font-semibold text-white backdrop-blur-md">
              <span className="bg-green size-2 rounded-full shadow-[0_0_0_4px_rgb(132_194_36_/_0.3)]" />
              Gathering {service.day}s · {service.startTime} · {location.campus}
            </p>

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

            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-5">
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
                {
                  icon: Users,
                  k: "Kids & teens",
                  v: "The Seeds and 412 Nation every week",
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
          {newHereCards.map(({ icon: Icon, title, body, href, cta }) => (
            <Link
              key={title}
              href={href}
              className="reveal group border-grey-100 hover:shadow-card-lg relative overflow-hidden rounded-2xl border bg-white p-8 transition duration-250 hover:-translate-y-1.5 hover:border-transparent"
            >
              <span className="bg-green-100 group-hover:bg-green mb-5 grid size-[54px] place-items-center rounded-[14px] transition-colors duration-250">
                <Icon className="text-green-600 group-hover:text-ink size-[26px] transition-colors duration-250" />
              </span>
              <h3 className="mb-2 text-[21px] font-bold">{title}</h3>
              <p className="text-grey-500 mb-4 text-[15px]">{body}</p>
              <span className="font-heading text-green-600 inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5">
                {cta} <ArrowRight className="size-4" />
              </span>
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

      {/* ===== What's on ===== */}
      <Section>
        <div className="reveal mb-13 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">What&apos;s on</p>
            <h2 className="mt-3.5 text-[clamp(30px,4vw,46px)] font-bold">
              This week at Elevation
            </h2>
          </div>
          <BtnLink href="/events" variant="ghost">
            View all <ArrowRight className="size-4" />
          </BtnLink>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* The Sunday gathering is the one genuinely recurring fixture, so it
              leads. Other events populate from Supabase once they exist. */}
          <article className="reveal border-grey-100 hover:shadow-card-lg overflow-hidden rounded-2xl border bg-white transition duration-250 hover:-translate-y-1.5 md:col-span-2">
            <div className="from-ink to-ink-800 relative aspect-16/10 bg-linear-to-br md:aspect-auto md:h-full md:min-h-[220px]">
              <span className="brand-glow top-[-80px] right-[-60px] size-[280px]" />
              <div className="relative flex h-full flex-col justify-end p-7">
                <p className="eyebrow-on-ink">Every week</p>
                <h3 className="mt-2 text-[26px] font-bold text-white">
                  Sunday Gathering
                </h3>
                <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Clock className="text-green size-4" />
                    {service.startTime}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="text-green size-4" />
                    {location.venue}, {location.postcode}
                  </span>
                </p>
                <div className="mt-5">
                  <BtnLink href="/im-new" variant="green">
                    Plan your visit
                  </BtnLink>
                </div>
              </div>
            </div>
          </article>

          <article className="reveal border-grey-100 flex flex-col justify-center rounded-2xl border bg-white p-8">
            <span className="bg-green-100 mb-5 grid size-[54px] place-items-center rounded-[14px]">
              <Sparkles className="text-green-600 size-[26px]" />
            </span>
            <h3 className="mb-2 text-[21px] font-bold">More coming soon</h3>
            <p className="text-grey-500 mb-5 text-[15px]">
              Conferences, socials and midweek gatherings get announced on
              Instagram first.
            </p>
            <div>
              <BtnLink href={instagram.href} external variant="ghost">
                Follow along
              </BtnLink>
            </div>
          </article>
        </div>
      </Section>

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

      {/* ===== Give ===== */}
      <section className="from-green to-green-600 relative overflow-hidden bg-linear-120 py-16 sm:py-24">
        <div className="wrap grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="reveal">
            <p className="font-heading text-ink text-xs font-bold tracking-[0.14em] uppercase">
              Generosity
            </p>
            <h2 className="text-ink mt-3.5 mb-4 text-[clamp(30px,4vw,44px)] font-bold">
              Fuel greatness in Manchester
            </h2>
            <p className="text-ink/72 mb-6.5 max-w-[480px] text-lg text-pretty">
              Every gift goes towards Sunday gatherings, our children&apos;s and
              teens&apos; work, and practical care for people who need it.
            </p>
            <BtnLink href="/give" variant="navy" size="lg">
              Ways to give <ArrowRight className="size-4" />
            </BtnLink>
          </div>

          <div className="reveal shadow-card-lg rounded-[20px] bg-white p-7.5">
            <h3 className="mb-4.5 text-lg font-bold">Give in seconds</h3>
            <p className="text-grey-500 mb-5 text-[15px]">
              Card, PayPal, Apple Pay or Google Pay — no account needed.
            </p>
            <div className="bg-grey-50 text-grey-700 mb-4 flex items-center gap-2.5 rounded-[11px] px-3.5 py-3 text-[13px]">
              <span className="bg-green grid size-5.5 shrink-0 place-items-center rounded-md">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  className="size-3.5"
                  aria-hidden
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
              <span>
                <b className="text-ink">Gift Aid it</b> — UK taxpayers add 25% at
                no extra cost.
              </span>
            </div>
            <BtnLink
              href={giving.paypalUrl}
              external
              variant="green"
              size="lg"
              block
            >
              Give securely
            </BtnLink>
            <p className="text-grey-500 mt-3 text-center text-xs">
              🔒 Registered charity no. {church.charityNumber}
            </p>
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="py-14">
        <div className="wrap">
          <dl className="border-grey-100 grid grid-cols-2 gap-6 border-y py-8 text-center lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="reveal">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="font-heading text-ink block text-[clamp(30px,4vw,46px)] font-extrabold tracking-[-0.03em]">
                    {s.value}
                    <span className="text-green">{s.unit}</span>
                  </span>
                  <span className="text-grey-500 mt-0.5 block text-sm">
                    {s.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===== Newsletter ===== */}
      <section className="pb-16 sm:pb-24">
        <div className="wrap">
          <div className="bg-ink reveal relative overflow-hidden rounded-[26px] px-6 py-14 text-center sm:p-14">
            <span className="brand-glow top-[-160px] right-[-80px] size-[420px]" />
            <div className="relative">
              <h2 className="mb-3 text-[clamp(28px,4vw,40px)] font-bold text-white">
                Stay in the loop
              </h2>
              <p className="mx-auto mb-7 max-w-[480px] text-white/66">
                Service reminders, event invites and the latest message, straight
                to your inbox.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
