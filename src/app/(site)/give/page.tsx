import type { Metadata } from "next";
import { Building2, HandCoins, Mail, ShieldCheck } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { GiftAidForm } from "@/components/gift-aid-form";
import { PageHero, Section, SectionHeading } from "@/components/section";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Give",
  description:
    "Give to Elevation Church Manchester online, by bank transfer or by cheque. UK taxpayers can Gift Aid their gift to add 25% at no extra cost.",
  alternates: { canonical: "/give" },
};

export default async function GivePage() {
  const { church, giving } = await getSettings();
  return (
    <>
      <PageHero
        eyebrow="Generosity"
        title="Give"
        lead="Your generosity fuels the mission in Manchester — Sunday gatherings, our children's and teens' work, and practical care for people who need it."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Online — the primary path */}
          <Card className="border-green/50 shadow-md lg:col-span-2">
            <CardContent>
              <HandCoins className="text-green-600 size-7" />
              <h2 className="font-heading mt-4 text-2xl font-semibold">
                Give online
              </h2>
              <p className="text-grey-500 mt-3 leading-relaxed">
                The quickest way to give — card, PayPal balance, Apple Pay or
                Google Pay. You can make a one-off gift or set up a recurring
                one.
              </p>
              <BtnLink
                href={giving.paypalUrl}
                external
                variant="green"
            className="mt-8"
              >
                Give securely now
              </BtnLink>
              <p className="text-grey-500 mt-4 text-xs">
                You&apos;ll be taken to PayPal&apos;s secure donation page. A
                PayPal account isn&apos;t required to give by card.
              </p>
            </CardContent>
          </Card>

          {/* Gift Aid */}
          <Card className="bg-ink text-white">
            <CardContent>
              <ShieldCheck className="text-green-600 size-7" />
              <h2 className="font-heading mt-4 text-xl font-semibold">
                Gift Aid
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                If you pay UK tax, Gift Aid adds{" "}
                <span className="text-green-600 font-semibold">25%</span> to
                your gift at no extra cost to you — every £10 becomes £12.50.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                {church.legalName} is a registered charity in England and Wales,
                no. {church.charityNumber}.
              </p>
              <div className="mt-6">
                <BtnLink href="#gift-aid" variant="green">
                  Make your declaration
                </BtnLink>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-14" />

        <SectionHeading
          eyebrow="Other ways"
          title="Prefer not to give online?"
          lead="Both of these work just as well, and Gift Aid still applies."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent>
              <Building2 className="text-green-600 size-6" />
              <h3 className="mt-4 text-lg font-semibold">Bank transfer</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-grey-500">Account name</dt>
                  <dd className="font-medium">{giving.bank.accountName}</dd>
                </div>
                <div>
                  <dt className="text-grey-500">Account number</dt>
                  <dd className="font-mono font-medium">
                    {giving.bank.accountNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-grey-500">Sort code</dt>
                  <dd className="font-mono font-medium">
                    {giving.bank.sortCode}
                  </dd>
                </div>
              </dl>
              <p className="text-grey-500 mt-5 text-xs leading-relaxed">
                These details are also shown on screen on a Sunday. If anything
                you see elsewhere differs from this, please check with us in
                person before sending money.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Mail className="text-green-600 size-6" />
              <h3 className="mt-4 text-lg font-semibold">Cheque</h3>
              <p className="text-grey-500 mt-4 text-sm leading-relaxed">
                Make cheques payable to:
              </p>
              <p className="mt-2 text-base font-semibold">
                {giving.chequePayableTo}
              </p>
              <p className="text-grey-500 mt-5 text-sm leading-relaxed">
                Hand it to a member of the team on a Sunday and we&apos;ll make
                sure it reaches the right place.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Gift Aid declaration */}
      <Section id="gift-aid" tone="grey">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="Gift Aid"
            title="Add 25% to your giving, at no cost to you"
            lead="If you pay UK tax, Gift Aid lets us reclaim 25p for every £1 you give — so £10 becomes £12.50. You only need to do this once; it covers your future giving and the past four years."
            align="center"
            className="mx-auto text-center"
          />
          <div className="border-grey-100 shadow-card rounded-2xl border bg-white p-6 sm:p-10">
            <GiftAidForm />
          </div>
          <p className="text-grey-500 mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed">
            We store your declaration securely and use it only to claim Gift Aid
            on your giving. HMRC requires us to keep it for as long as you give,
            and for six years afterwards.
          </p>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-semibold">
            Thank you
          </h2>
          <p className="text-grey-500 mt-4 leading-relaxed">
            Every gift, of every size, goes towards making greatness common in
            this city. If you&apos;d like to know more about how giving is used,
            just ask — we&apos;re happy to talk it through.
          </p>
          <div className="mt-8 flex justify-center">
            <BtnLink href="/contact" variant="ghost">
              Ask about giving
            </BtnLink>
          </div>
        </div>
      </Section>
    </>
  );
}
