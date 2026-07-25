import type { Metadata } from "next";
import { HeartHandshake, Users } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { PageHeader, Section, SectionHeading } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  growthTrack,
  kidsAndYouth,
  serveTeams,
  supportMinistries,
} from "@/lib/church";

export const metadata: Metadata = {
  title: "Get Involved",
  description:
    "Connect Groups, serving on the G-Squad, The Seeds and 412 Nation, and the support ministries at Elevation Church Manchester.",
  alternates: { canonical: "/get-involved" },
};

export default function GetInvolvedPage() {
  return (
    <>
      <PageHeader
        eyebrow="Belong here"
        title="Get involved"
        lead="Sunday is the front door, not the whole house. This is where church stops being an event and starts being a family."
      />

      {/* Connect Groups */}
      <Section id="connect-groups">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Connect Groups"
              title="Big enough to receive you, small enough to know you"
              lead="Connect Groups are our small-group system and the main way we care for one another through the week. Some are based on where you live, others on a shared season or interest — families, young couples, professionals, fitness and more."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact">Find a group</ButtonLink>
            </div>
            {/* TODO: replace with the live directory once connect_groups is populated. */}
          </div>
          <Card className="bg-brand-green-soft border-brand-green/40">
            <CardContent>
              <Users className="text-brand-navy size-7" />
              <h3 className="font-heading mt-4 text-xl font-semibold">
                What actually happens
              </h3>
              <ul className="text-muted-foreground mt-4 space-y-3 text-sm leading-relaxed">
                <li>Food, usually. Always conversation.</li>
                <li>
                  Working through what was taught on Sunday, in a room small
                  enough to ask the awkward question.
                </li>
                <li>Praying for each other by name.</li>
                <li>
                  Showing up when life gets hard — the reason the group exists.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* G-Squad */}
      <Section id="serve" tone="muted">
        <SectionHeading
          eyebrow="G-Squad"
          title="Serve on the Greatness Squad"
          lead="The G-Squad is our volunteer workforce and the engine of this church. There are more than forty units to serve on — whatever you're good at, there's a place for it."
        />
        <ul className="mt-10 flex flex-wrap gap-2">
          {serveTeams.map((team) => (
            <li key={team}>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                {team}
              </Badge>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <ButtonLink href="/contact">Join the G-Squad</ButtonLink>
        </div>
      </Section>

      {/* Kids & teens */}
      <Section id="kids-and-teens">
        <SectionHeading
          eyebrow="Kids & teens"
          title="Where the next generation belongs"
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

      {/* Support ministries */}
      <Section id="support" tone="muted">
        <SectionHeading
          eyebrow="Support"
          title="When you need more than a Sunday"
          lead="These are here for anyone — you don't have to be a member, and you don't have to explain yourself first."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {supportMinistries.map((ministry) => (
            <Card key={ministry.name} className="h-full">
              <CardContent>
                <HeartHandshake className="text-brand-green size-6" />
                <h3 className="mt-4 text-lg font-semibold">{ministry.name}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {ministry.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Growth Track */}
      <Section id="next-steps">
        <SectionHeading
          eyebrow="Your next steps"
          title="The Growth Track"
          lead="Not sure where to start? Start at the top and work down."
        />
        <ol className="mt-12 grid gap-8 md:grid-cols-2">
          {growthTrack.map((step) => (
            <li key={step.step} className="border-brand-green border-l-4 pl-6">
              <span className="font-heading text-brand-green text-2xl font-semibold">
                {step.step}
              </span>
              <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                {step.body}
              </p>
              <p className="text-muted-foreground/70 mt-3 text-sm">
                {step.scripture}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="navy">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <SectionHeading
            title="Not sure where you'd fit?"
            lead="Tell us a bit about yourself and we'll point you somewhere sensible."
            tone="onNavy"
          />
          <ButtonLink
            href="/contact"
            size="lg"
            className="bg-brand-green text-brand-navy hover:bg-brand-green/90 shrink-0"
          >
            Talk to us
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
