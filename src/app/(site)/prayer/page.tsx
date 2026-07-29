import type { Metadata } from "next";
import { PageHero, Section } from "@/components/section";
import { PrayerForm } from "@/components/prayer-form";
import { contact } from "@/lib/church";

export const metadata: Metadata = {
  title: "Prayer",
  description:
    "Send a prayer request to Elevation Church Manchester. Our team will pray, and nothing you share is made public.",
  alternates: { canonical: "/prayer" },
};

export default function PrayerPage() {
  return (
    <>
      <PageHero
        eyebrow="Prayer"
        title="Let us pray with you"
        lead="Whatever you're carrying, you don't have to carry it on your own. Tell us and our team will pray."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <PrayerForm />

          <aside className="space-y-8">
            <div className="bg-grey-50 rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold">
                Who sees this?
              </h2>
              <p className="text-grey-500 mt-3 text-sm leading-relaxed">
                Prayer requests go to our pastoral team only. Nothing you write
                is published on this site, and it&apos;s never shared beyond the
                team unless you tick the box asking us to.
              </p>
            </div>

            <div className="bg-grey-50 rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold">
                Need to talk to someone?
              </h2>
              <p className="text-grey-500 mt-3 text-sm leading-relaxed">
                We offer free, confidential counselling, alongside Family Life
                support for marriage, premarital and parenting.
              </p>
              <p className="text-grey-500 mt-3 text-sm leading-relaxed">
                Email{" "}
                <a
                  href={`mailto:${contact.email}`}
                  className="text-ink font-medium underline underline-offset-4"
                >
                  {contact.email}
                </a>{" "}
                and we&apos;ll arrange it.
              </p>
            </div>

            <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-6">
              <h2 className="font-heading text-lg font-semibold">
                If it&apos;s an emergency
              </h2>
              <p className="text-grey-500 mt-3 text-sm leading-relaxed">
                This form isn&apos;t monitored around the clock. If you or
                someone else is in immediate danger, please call{" "}
                <strong>999</strong>. For urgent mental health support, call{" "}
                <strong>111</strong>, or Samaritans free on{" "}
                <strong>116 123</strong>, any time.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
