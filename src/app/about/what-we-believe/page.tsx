import type { Metadata } from "next";
import { ButtonLink } from "@/components/button-link";
import { PageHeader, Section, SectionHeading } from "@/components/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { beliefs, growthTrack } from "@/lib/church";

export const metadata: Metadata = {
  title: "What We Believe",
  description:
    "The statement of faith of Elevation Church Manchester — one God in three persons, salvation by grace through faith, the Baptism of the Holy Spirit, and healing in the atonement.",
  alternates: { canonical: "/about/what-we-believe" },
};

export default function WhatWeBelievePage() {
  return (
    <>
      <PageHeader
        eyebrow="Statement of faith"
        title="What we believe"
        lead="We're a Pentecostal church — Bible-centred and Spirit-filled. Here's what that actually means, in plain English."
      />

      <Section>
        <div className="max-w-3xl">
          {/* Base UI accordions allow multiple open panels by default. */}
          <Accordion
            defaultValue={beliefs.map((b) => b.title)}
            className="w-full"
          >
            {beliefs.map((belief) => (
              <AccordionItem key={belief.title} value={belief.title}>
                <AccordionTrigger className="text-left text-lg font-semibold">
                  {belief.title}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {belief.body}
                  </p>
                  <p className="text-brand-green mt-3 text-sm font-medium">
                    {belief.scripture}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          eyebrow="Your next steps"
          title="The Growth Track"
          lead="Believing is the beginning. This is the path we walk together from there."
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
            title="Questions are welcome here"
            lead="If something above raised a question rather than answered one, that's a good sign. Come and ask."
            tone="onNavy"
          />
          <div className="flex shrink-0 flex-wrap gap-3">
            <ButtonLink
              href="/im-new"
              size="lg"
              className="bg-brand-green text-brand-navy hover:bg-brand-green/90"
            >
              Plan a visit
            </ButtonLink>
            <ButtonLink
              href="/contact"
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Contact us
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
