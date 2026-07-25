import Link from "next/link";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { Section, SectionHeading } from "@/components/section";
import { Card, CardContent } from "@/components/ui/card";
import {
  church,
  growthTrack,
  kidsAndYouth,
  location,
  service,
  values,
} from "@/lib/church";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-brand-navy relative overflow-hidden text-white">
        <div
          aria-hidden
          className="bg-brand-green/20 pointer-events-none absolute -top-32 -right-32 size-96 rounded-full blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="eyebrow mb-4">{church.tagline}</p>
          <h1 className="max-w-4xl text-4xl font-semibold text-balance sm:text-6xl">
            Welcome to Elevation Church Manchester
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-white/80 sm:text-xl">
            We&apos;re a Spirit-filled family in the heart of Manchester on one
            mission: making greatness common. Wherever you&apos;re coming from,
            there&apos;s a place for you here.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink
              href="/im-new"
              size="lg"
              className="bg-brand-green text-brand-navy hover:bg-brand-green/90"
            >
              Plan your visit <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink
              href="/watch"
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Watch a service
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Service details */}
      <div className="border-b">
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 md:grid-cols-3">
          <div className="flex items-start gap-4 py-8 md:pr-8">
            <Clock className="text-brand-green mt-1 size-5 shrink-0" />
            <div>
              <h2 className="font-semibold">Sunday service</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {service.day}s at {service.startTime}
                {service.timeConfirmed && (
                  <>
                    <br />
                    Doors {service.doorsOpen} · {service.approxDuration}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 py-8 md:px-8">
            <MapPin className="text-brand-green mt-1 size-5 shrink-0" />
            <div>
              <h2 className="font-semibold">Where we meet</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {location.venue}, {location.campus}
                <br />
                {location.city} {location.postcode}
              </p>
              <Link
                href={location.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-navy mt-2 inline-block text-sm font-medium underline underline-offset-4"
              >
                Get directions
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-4 py-8 md:pl-8">
            <Sparkles className="text-brand-green mt-1 size-5 shrink-0" />
            <div>
              <h2 className="font-semibold">First time?</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Come as you are. We&apos;ll save you a seat and show you around.
              </p>
              <Link
                href="/im-new"
                className="text-brand-navy mt-2 inline-block text-sm font-medium underline underline-offset-4"
              >
                What to expect
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mission */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Our mission"
            title="Making greatness common"
            lead={church.mission}
          />
          <figure className="border-brand-green border-l-4 pl-6">
            <blockquote className="font-heading text-2xl leading-snug text-balance sm:text-3xl">
              &ldquo;{church.bedrockScripture.text}&rdquo;
            </blockquote>
            <figcaption className="text-muted-foreground mt-4 text-sm font-medium">
              {church.bedrockScripture.reference}
            </figcaption>
            <div className="mt-8">
              <p className="eyebrow mb-3">Our values — ASHLIE</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {values.map((v) => (
                  <li key={v.letter} className="flex items-baseline gap-3">
                    <span className="font-heading text-brand-green w-4 text-lg font-semibold">
                      {v.letter}
                    </span>
                    <span className="text-sm">{v.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </figure>
        </div>
      </Section>

      {/* Growth Track */}
      <Section tone="muted">
        <SectionHeading
          eyebrow="Your next steps"
          title="The Growth Track"
          lead="Four steps that take you from your first Sunday to living out your purpose."
        />
        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {growthTrack.map((step) => (
            <li key={step.step}>
              <Card className="h-full">
                <CardContent>
                  <span className="font-heading text-brand-green text-3xl font-semibold">
                    {step.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {step.body}
                  </p>
                  <p className="text-muted-foreground/70 mt-4 text-xs">
                    {step.scripture}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <ButtonLink href="/get-involved" variant="outline">
            Explore getting involved <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </Section>

      {/* Kids & youth */}
      <Section>
        <SectionHeading
          eyebrow="For the whole family"
          title="Your children are in good hands"
          lead="Every Sunday we run dedicated, safe and joyful spaces for children and teenagers."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {kidsAndYouth.map((group) => (
            <Card key={group.name} className="h-full">
              <CardContent>
                <h3 className="font-heading text-xl font-semibold">
                  {group.name}
                </h3>
                <p className="eyebrow mt-2">{group.forWho}</p>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {group.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Closing CTA */}
      <Section tone="navy">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <SectionHeading
            title="We'd love to meet you this Sunday"
            lead={`${service.day}s at ${service.startTime} — ${location.full}.`}
            tone="onNavy"
          />
          <div className="flex shrink-0 flex-wrap gap-3">
            <ButtonLink
              href="/im-new"
              size="lg"
              className="bg-brand-green text-brand-navy hover:bg-brand-green/90"
            >
              Plan your visit
            </ButtonLink>
            <ButtonLink
              href="/prayer"
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Request prayer
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
