import type { Metadata } from "next";
import Link from "next/link";
import { ConsentControls } from "@/components/cookie-banner";
import { PageHero, Section } from "@/components/section";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How Elevation Church Manchester collects, uses and protects your personal information, and the choices you have.",
};

/**
 * Privacy notice.
 *
 * Written against what the site actually does rather than from a template —
 * every processor named here is one the code genuinely talks to, and the
 * retention periods match what the database and HMRC's Gift Aid rules require.
 */

/** Last substantive change. Update when the content below changes. */
const LAST_UPDATED = "2 August 2026";

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="font-heading text-ink mt-12 scroll-mt-28 text-2xl font-bold first:mt-0"
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-grey-700 mt-4 leading-relaxed">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="text-grey-700 mt-4 list-disc space-y-2 pl-6 leading-relaxed">
      {children}
    </ul>
  );
}

export default async function PrivacyPage() {
  const { church, contact, location } = await getSettings();

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy notice"
        lead="What we collect, why we collect it, how long we keep it, and what you can ask us to do about it."
      />

      <Section>
        <div className="mx-auto max-w-[760px]">
          <p className="text-grey-500 text-sm">
            Last updated {LAST_UPDATED}.
          </p>

          <H2 id="who-we-are">Who we are</H2>
          <P>
            {church.name} is part of {church.legalName}, a charity registered in
            England and Wales (number {church.charityNumber}). We meet at{" "}
            {location.venue}, {location.campus}, {location.postcode}.
          </P>
          <P>
            For data protection purposes we are the &ldquo;controller&rdquo; of
            the information described here — that means we decide what is
            collected and why. If you have any question about this notice, or
            want to make a request about your information, email us at{" "}
            <a
              href={`mailto:${contact.email}`}
              className="text-green-600 font-medium underline underline-offset-2"
            >
              {contact.email}
            </a>
            .
          </P>

          <H2 id="what-we-collect">What we collect, and why</H2>
          <P>
            We only collect information you choose to give us. There is no
            tracking on this website — no analytics, no advertising, no
            profiling, and nothing that follows you to other sites.
          </P>

          <h3 className="font-heading text-ink mt-8 text-lg font-bold">
            When you contact us
          </h3>
          <P>
            The contact form asks for your name and email address, and
            optionally a phone number and subject. We use it to answer you. Our
            lawful basis is <b>legitimate interests</b> — you have asked us a
            question and we need your details to reply.
          </P>

          <h3 className="font-heading text-ink mt-8 text-lg font-bold">
            When you send a prayer request
          </h3>
          <P>
            You can send a prayer request anonymously. If you give your name or
            contact details, they are stored with the request. A prayer request
            may reveal things about your religious beliefs or your health, which
            the law treats as{" "}
            <b>special category data</b> and protects more strictly.
          </P>
          <P>
            Our lawful basis is <b>consent</b>, and the additional condition we
            rely on for special category data is your{" "}
            <b>explicit consent</b>, given when you submit the form. You can
            withdraw it at any time by emailing us, and we will delete the
            request.
          </P>
          <P>
            Prayer requests are treated as pastoral confidences. They are
            readable only by people whose role in the admin system specifically
            grants access to them, and they are sent to a separate prayer inbox
            rather than the church&apos;s general email. If you tick the box to
            share a request with the wider prayer team, we take that as your
            permission to pass it beyond the immediate pastoral team; if you
            don&apos;t, we won&apos;t.
          </P>

          <h3 className="font-heading text-ink mt-8 text-lg font-bold">
            When you make a Gift Aid declaration
          </h3>
          <P>
            To claim Gift Aid we are required by HMRC to record your title,
            full first name and surname, your home address including house name
            or number, and your postcode. We also record the wording of the
            declaration you agreed to and when you made it. Email and phone are
            optional and used only to confirm the declaration or contact you
            about changes.
          </P>
          <P>
            Our lawful basis is <b>legal obligation</b> — we cannot make a valid
            Gift Aid claim without these details. This information is shared
            with <b>HM Revenue &amp; Customs</b> when we make a claim.
          </P>

          <h3 className="font-heading text-ink mt-8 text-lg font-bold">
            When you join the mailing list
          </h3>
          <P>
            We store your email address, and your name if you give it, to send
            you church news. Our lawful basis is <b>consent</b>. Every email
            includes an unsubscribe link, and you can ask us to remove you at
            any time.
          </P>

          <h3 className="font-heading text-ink mt-8 text-lg font-bold">
            When you have an admin account
          </h3>
          <P>
            If you help run the website, we store your name, email address, the
            permissions you have been given, and a record of the changes you
            make in the system. Keeping that record is how we can tell who
            changed what — it protects both the church and you. Our lawful basis
            is <b>legitimate interests</b> in running the site securely.
          </P>

          <H2 id="how-long">How long we keep it</H2>
          <UL>
            <li>
              <b>Gift Aid declarations</b> — for at least six years after the
              end of the tax year they relate to, because HMRC requires it. A
              cancelled declaration is kept for the same period as evidence of
              when it applied.
            </li>
            <li>
              <b>Prayer requests</b> — kept only while they are being prayed
              for and followed up, then deleted. Ask us sooner and we will
              delete them straight away.
            </li>
            <li>
              <b>Contact messages</b> — kept while we deal with your enquiry and
              for a reasonable period afterwards in case you get back in touch.
            </li>
            <li>
              <b>Mailing list</b> — until you unsubscribe.
            </li>
            <li>
              <b>Admin accounts and activity records</b> — for as long as the
              account is active, and the activity record afterwards so the
              history of changes stays intact.
            </li>
          </UL>

          <H2 id="who-we-share-with">Who else is involved</H2>
          <P>
            We do not sell your information and we do not share it for
            marketing. We use a small number of suppliers to run the site, who
            process information on our instructions:
          </P>
          <UL>
            <li>
              <b>Supabase</b> — the database and login system that stores form
              submissions and admin accounts. Our data is held in the European
              Union (Frankfurt).
            </li>
            <li>
              <b>Vercel</b> — hosts the website itself.
            </li>
            <li>
              <b>Resend</b> — sends our emails, such as prayer notifications and
              sign-in links.
            </li>
            <li>
              <b>Google</b> — provides the embedded maps and the YouTube videos.
              These only load if you allow them (see below).
            </li>
            <li>
              <b>HM Revenue &amp; Customs</b> — receives Gift Aid claims.
            </li>
          </UL>
          <P>
            Some of these suppliers are based outside the UK. Where information
            is transferred abroad, it is protected by the safeguards UK data
            protection law requires, such as the International Data Transfer
            Agreement or an adequacy decision.
          </P>

          <H2 id="cookies">Cookies and similar technology</H2>
          <P>
            This website sets <b>no cookies of its own</b> on its public pages.
            There is no analytics, no advertising and no tracking of any kind.
          </P>
          <P>
            Two things do store something on your device, and neither is used to
            track you:
          </P>
          <UL>
            <li>
              <b>Your privacy choice</b> — when you choose whether maps and
              videos should load, we remember that in your browser&apos;s local
              storage so we don&apos;t have to ask again. It never leaves your
              device.
            </li>
            <li>
              <b>Dismissed announcements</b> — if you close a pop-up notice, we
              remember that in local storage so it doesn&apos;t reappear
              immediately.
            </li>
          </UL>
          <P>
            If you log in to the admin area, we set a <b>login cookie</b> so the
            system knows it is you. That is essential to the service and cannot
            be turned off while you are signed in.
          </P>
          <P>
            <b>Embedded maps and videos</b> come from Google. Loading one tells
            Google your IP address and details about your browser, and Google
            may set its own cookies. Because of that we don&apos;t load them
            until you say so — you will see a placeholder with a button
            instead. You can change your mind here at any time:
          </P>
          <div className="mt-5">
            <ConsentControls />
          </div>

          <H2 id="your-rights">Your rights</H2>
          <P>You have the right to:</P>
          <UL>
            <li>ask for a copy of the information we hold about you;</li>
            <li>ask us to correct anything that is wrong;</li>
            <li>
              ask us to delete it, where we don&apos;t have a legal reason to
              keep it;
            </li>
            <li>ask us to restrict how we use it, or object to our using it;</li>
            <li>
              ask us to transfer it to you or another organisation, where it was
              given with your consent;
            </li>
            <li>
              withdraw consent at any time, where consent is what we relied on.
            </li>
          </UL>
          <P>
            To exercise any of these, email{" "}
            <a
              href={`mailto:${contact.email}`}
              className="text-green-600 font-medium underline underline-offset-2"
            >
              {contact.email}
            </a>
            . We will respond within one month. There is no charge.
          </P>

          <H2 id="complaints">If you&apos;re unhappy</H2>
          <P>
            Please tell us first — we would rather put it right. If you are
            still not satisfied, you can complain to the Information
            Commissioner&apos;s Office, the UK regulator for data protection, at{" "}
            <a
              href="https://ico.org.uk/make-a-complaint/"
              target="_blank"
              rel="noreferrer"
              className="text-green-600 font-medium underline underline-offset-2"
            >
              ico.org.uk/make-a-complaint
            </a>{" "}
            or on 0303 123 1113.
          </P>

          <H2 id="changes">Changes to this notice</H2>
          <P>
            If we change how we use your information we will update this page
            and the date at the top. If the change is significant we will say so
            clearly on the site.
          </P>

          <p className="text-grey-500 mt-12 border-t pt-6 text-sm">
            Looking for something else?{" "}
            <Link
              href="/contact"
              className="text-green-600 font-medium underline underline-offset-2"
            >
              Get in touch
            </Link>{" "}
            and we&apos;ll help.
          </p>
        </div>
      </Section>
    </>
  );
}
