import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { church, leadership, personality, values } from "@/lib/church";

export const metadata: Metadata = {
  title: "About",
  description:
    "Our story, our vision and values, and the people who lead Elevation Church Manchester — an expression of The Elevation Church.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="A church family with one mandate"
        lead={church.mission}
      />

      <Section id="our-story">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <SectionHeading eyebrow="Our story" title="How we got here" />
          <div className="text-grey-500 space-y-5 text-lg leading-relaxed text-pretty">
            <p>
              The Elevation Church began in Lagos, Nigeria, on 10 October 2010 —
              10.10.10 — founded by Pastor Godman Akinlabi in response to a
              leading from God, and inaugurated later that year with Rev. Sam
              Adeyemi.
            </p>
            <p>
              What started as one gathering has grown into a global family of
              churches — we call them{" "}
              <span className="text-ink font-medium">expressions</span> —
              across Nigeria, the UK, Europe and the US.
            </p>
            <p>
              TEC Manchester launched on {church.launched}, led by Pastor Tosin
              Babalola, to bring that same message of hope and greatness to this
              city.
            </p>
          </div>
        </div>
      </Section>

      <Section id="vision-values" tone="grey">
        <SectionHeading
          eyebrow="Vision & values"
          title="What we're built on"
          lead={`Everything we do traces back to one line of scripture: "${church.bedrockScripture.text}" — ${church.bedrockScripture.reference}.`}
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => (
            <Card key={v.letter}>
              <CardContent className="flex items-baseline gap-4">
                <span className="font-heading text-green-600 text-4xl font-semibold">
                  {v.letter}
                </span>
                <span className="text-lg font-medium">{v.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-14">
          <p className="eyebrow mb-4">Our personality</p>
          <ul className="flex flex-wrap gap-2">
            {personality.map((trait) => (
              <li key={trait}>
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  {trait}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="leadership">
        <SectionHeading
          eyebrow="Leadership"
          title="The people who serve this house"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {leadership.map((person) => (
            <Card key={person.name} className="h-full">
              <CardContent>
                {/* TODO: add portraits to /public/leadership and render with next/image */}
                <h3 className="font-heading text-xl font-semibold">
                  {person.name}
                </h3>
                <p className="eyebrow mt-2">{person.role}</p>
                <p className="text-grey-500 mt-3 text-sm leading-relaxed">
                  {person.bio}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="ink">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <SectionHeading
            title="What we believe"
            lead="The convictions underneath everything above — set out plainly, with the scripture behind each one."
            tone="onInk"
          />
          <BtnLink
            href="/about/what-we-believe"
            variant="green"
            className="shrink-0"
          >
            Read our statement of faith <ArrowRight className="size-4" />
          </BtnLink>
        </div>
      </Section>
    </>
  );
}
