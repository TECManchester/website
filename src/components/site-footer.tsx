import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { socialIcons } from "@/components/social-icons";
import { getSettings } from "@/lib/settings";

const columns = [
  {
    heading: "Visit",
    links: [
      { label: "Plan a visit", href: "/im-new" },
      { label: "What to expect", href: "/im-new#what-to-expect" },
      { label: "Times & location", href: "/im-new#find-us" },
      { label: "Kids & youth", href: "/im-new#kids" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "Watch messages", href: "/watch" },
      { label: "Events", href: "/events" },
      { label: "Get involved", href: "/get-involved" },
      { label: "Give", href: "/give" },
    ],
  },
  {
    heading: "Connect",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Prayer request", href: "/prayer" },
      { label: "Connect Groups", href: "/get-involved#connect-groups" },
      { label: "What we believe", href: "/about/what-we-believe" },
    ],
  },
];

export async function SiteFooter() {
  const { church, contact, location, service, socials } = await getSettings();
  return (
    <footer className="bg-ink-800 pt-16 pb-8 text-white/60">
      <div className="wrap">
        <div className="mb-11 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="white" />
            <p className="my-[18px] max-w-[280px] text-[14.5px] leading-relaxed">
              {church.mission}
            </p>
            <ul className="flex gap-2.5">
              {socials.map((s) => {
                const Icon =
                  socialIcons[s.name as keyof typeof socialIcons] ?? null;
                return (
                  <li key={s.name}>
                    <Link
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${church.shortName} on ${s.name}`}
                      className="hover:bg-green hover:text-ink grid size-10 place-items-center rounded-[11px] bg-white/6 text-white transition-colors"
                    >
                      {Icon ? (
                        <Icon className="size-[18px]" />
                      ) : (
                        <span className="text-xs font-bold">
                          {s.name.charAt(0)}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h2 className="font-heading mb-[18px] text-sm tracking-[0.1em] text-white uppercase">
                {col.heading}
              </h2>
              <ul>
                {col.links.map((link) => (
                  <li key={link.href} className="mb-[11px]">
                    <Link
                      href={link.href}
                      className="hover:text-green text-[14.5px] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Practical details strip */}
        <div className="mb-7 flex flex-wrap items-center gap-x-7 gap-y-3 rounded-[14px] bg-white/4 px-6 py-5">
          <p className="font-heading flex items-center gap-2.5 font-semibold text-white">
            <Clock className="text-green size-[18px]" />
            {service.day}s {service.startTime}
          </p>
          <p className="font-heading flex items-center gap-2.5 font-semibold text-white">
            <MapPin className="text-green size-[18px]" />
            {location.venue}, {location.campus}, {location.postcode}
          </p>
          <a
            href={`mailto:${contact.email}`}
            className="hover:text-green flex items-center gap-2.5 text-sm transition-colors"
          >
            <Mail className="size-[18px]" />
            {contact.email}
          </a>
          <a
            href={`tel:${contact.phone.tel}`}
            className="hover:text-green flex items-center gap-2.5 text-sm transition-colors"
          >
            <Phone className="size-[18px]" />
            {contact.phone.label}
          </a>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-white/8 pt-6 text-[13px]">
          <p>
            &copy; {new Date().getFullYear()} {church.name}. An expression of The
            Elevation Church.
          </p>
          <p>
            {church.legalName} · registered charity no. {church.charityNumber}
          </p>
        </div>
      </div>
    </footer>
  );
}
