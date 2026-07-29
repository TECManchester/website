import type { Metadata } from "next";
import { Baby, Car, Clock, Shirt, Users } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { Card, CardContent } from "@/components/ui/card";
import { kidsAndYouth } from "@/lib/church";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "I'm New",
  description:
    "Planning your first visit to Elevation Church Manchester? Here's what to expect on a Sunday, where to park, and what happens with your kids.",
  alternates: { canonical: "/im-new" },
};

const expectations = (service: {
  startTime: string;
  doorsOpen: string | null;
}) => [
  {
    icon: Clock,
    title: "When should I arrive?",
    // No end time published — services vary in length week to week.
    body: service.doorsOpen
      ? `Doors open at ${service.doorsOpen} and we start at ${service.startTime}. Come a little early if you'd like to say hello, and stay afterwards for coffee — we'd genuinely love to meet you.`
      : `We start at ${service.startTime}. Come a little early if you'd like to say hello, and stay afterwards for coffee — we'd genuinely love to meet you.`,
  },
  {
    icon: Shirt,
    title: "What should I wear?",
    body: "Whatever you're comfortable in. You'll see suits and you'll see trainers — nobody is checking.",
  },
  {
    icon: Users,
    title: "What actually happens?",
    body: "Passionate worship, a practical message from the Bible, and time to pray. It's Spirit-filled, warm and jargon-light — you won't feel lost.",
  },
  {
    icon: Baby,
    title: "What about my children?",
    body: "The Seeds runs every Sunday for children, including a baby class, and 412 Nation is for teenagers. Our team will help you get them settled.",
  },
  {
    icon: Car,
    title: "Where do I park?",
    body: "We meet in the Mary Seacole Building on the University of Salford campus. Our Protocol team will point you in the right direction when you arrive.",
  },
];

export default async function ImNewPage() {
  const { service, location } = await getSettings();
  const cards = expectations(service);
  return (
    <>
      <PageHero
        eyebrow="Plan a visit"
        title="Your first Sunday, made simple"
        lead="Walking into a new church can feel like a lot. Here's everything you need so that it doesn't."
      />

      <Section>
        <SectionHeading
          eyebrow="What to expect"
          title="The honest answers to the questions everyone asks"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="h-full">
              <CardContent>
                <Icon className="text-green-600 size-6" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="text-grey-500 mt-2 text-sm leading-relaxed">
                  {body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="grey">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Find us"
              title="Where we meet"
              lead={`We gather every ${service.day} at ${service.startTime} in the ${location.venue} on the ${location.campus} campus.`}
            />
            <address className="mt-8 space-y-1 text-base not-italic">
              <p className="font-semibold">{location.venue}</p>
              <p>{location.campus}</p>
              <p>
                {location.city} {location.postcode}
              </p>
            </address>
            <div className="mt-8 flex flex-wrap gap-3">
              <BtnLink variant="navy" href={location.mapsUrl} external>
                Open in Google Maps
              </BtnLink>
              <BtnLink href="/contact" variant="ghost">
                Ask us a question
              </BtnLink>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border shadow-sm">
            <iframe
              title={`Map showing ${location.full}`}
              src={location.embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-4/3 w-full"
            />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="For your family"
          title="Kids and teens are looked after"
          lead="They get their own space, their own team and their own thing going on — while you get to be present in the service."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {kidsAndYouth.map((group) => (
            <Card key={group.name} className="h-full">
              <CardContent>
                <h3 className="font-heading text-xl font-semibold">
                  {group.name}
                </h3>
                <p className="eyebrow mt-2">{group.forWho}</p>
                <p className="text-grey-500 mt-3 text-sm leading-relaxed">
                  {group.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="ink">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <SectionHeading
            title="Still have a question?"
            lead="Send it over before you come. No question is too small."
            tone="onInk"
          />
          <BtnLink
            href="/contact"
            variant="green"
            className="shrink-0"
          >
            Get in touch
          </BtnLink>
        </div>
      </Section>
    </>
  );
}
