import Link from "next/link";
import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";
import {
  church,
  contact,
  location,
  nav,
  service,
  socials,
} from "@/lib/church";

export function SiteFooter() {
  return (
    <footer className="bg-brand-navy text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo tone="white" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-balance">
            {church.mission}
          </p>
          <p className="wordmark text-brand-green mt-5 text-xs">
            {church.tagline}
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-white">Visit us</h2>
          <address className="space-y-1 text-sm not-italic">
            <p>{location.venue}</p>
            <p>{location.campus}</p>
            <p>
              {location.city} {location.postcode}
            </p>
          </address>
          <p className="mt-4 text-sm">
            {service.day}s at{" "}
            <span className="text-brand-green font-semibold">
              {service.startTime}
            </span>
          </p>
          <Link
            href={location.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-brand-green mt-3 inline-block text-sm underline underline-offset-4"
          >
            Get directions
          </Link>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-white">Explore</h2>
          <ul className="space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-brand-green">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/give" className="hover:text-brand-green">
                Give
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {socials.map((s) => (
            <Link
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-green text-sm"
            >
              {s.name}
            </Link>
          ))}
        </div>

        <div className="mt-6 space-y-1 text-xs text-white/50">
          <p>
            &copy; {new Date().getFullYear()} {church.name}. An expression of
            The Elevation Church.
          </p>
          <p>
            {church.legalName} is a registered charity in England and Wales, no.{" "}
            {church.charityNumber}.
          </p>
          {!contact.emailConfirmed && (
            <p className="text-brand-green/70">
              TODO: confirm the Manchester contact email before launch.
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
