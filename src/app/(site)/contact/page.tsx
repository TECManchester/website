import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { PageHero, Section } from "@/components/section";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Elevation Church Manchester — Mary Seacole Building, University of Salford. Sundays at 10:30am.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { contact, location, service, socials } = await getSettings();
  return (
    <>
      <PageHero
        eyebrow="Say hello"
        title="Get in touch"
        lead="Questions about visiting, joining a Connect Group, serving, or anything else — this reaches a real person."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <ContactForm />

          <aside className="space-y-8">
            <div>
              <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
                <MapPin className="text-green-600 size-5" />
                Where we meet
              </h2>
              <address className="text-grey-500 mt-3 space-y-1 text-sm not-italic">
                <p>{location.venue}</p>
                <p>{location.campus}</p>
                <p>
                  {location.city} {location.postcode}
                </p>
              </address>
              <Link
                href={location.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-ink mt-3 inline-block text-sm font-medium underline underline-offset-4"
              >
                Get directions
              </Link>
            </div>

            <div>
              <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
                <Clock className="text-green-600 size-5" />
                Sunday service
              </h2>
              <p className="text-grey-500 mt-3 text-sm">
                {service.day}s at {service.startTime}
              </p>
            </div>

            <div>
              <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
                <Mail className="text-green-600 size-5" />
                Email
              </h2>
              <a
                href={`mailto:${contact.email}`}
                className="text-ink mt-3 inline-block text-sm font-medium underline underline-offset-4"
              >
                {contact.email}
              </a>
            </div>

            <div>
              <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
                <Phone className="text-green-600 size-5" />
                Phone
              </h2>
              <a
                href={`tel:${contact.phone.tel}`}
                className="text-ink mt-3 inline-block text-sm font-medium underline underline-offset-4"
              >
                {contact.phone.label}
              </a>
            </div>

            <div>
              <h2 className="font-heading text-lg font-semibold">Follow us</h2>
              <ul className="mt-3 space-y-2">
                {socials.map((s) => (
                  <li key={s.name}>
                    <Link
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-grey-500 hover:text-green-600 text-sm"
                    >
                      <span className="text-ink font-medium">
                        {s.name}
                      </span>{" "}
                      {s.handle}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      <div className="border-t">
        <iframe
          title={`Map showing ${location.full}`}
          src={location.embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[420px] w-full"
        />
      </div>
    </>
  );
}
