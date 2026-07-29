import "server-only";

import { cache } from "react";
import {
  church as defaultChurch,
  contact as defaultContact,
  giving as defaultGiving,
  heroSlides as defaultHero,
  location as defaultLocation,
  service as defaultService,
  socials as defaultSocials,
  type HeroSlide,
} from "@/lib/church";
import { createPublicClient } from "@/lib/supabase/server";

/**
 * Live site settings: database values override the compiled defaults in
 * church.ts, group by group. A missing row — or a database outage — falls back
 * to defaults, so settings can never take the site down.
 *
 * Change the address once in the admin and every page that shows it updates
 * together; saveSettings revalidates the whole (site) layout.
 */

export type SocialLink = { name: string; handle: string; href: string };

export type SiteSettings = {
  church: {
    name: string;
    legalName: string;
    shortName: string;
    tagline: string;
    mission: string;
    charityNumber: string;
  };
  service: { day: string; startTime: string; doorsOpen: string | null };
  location: {
    venue: string;
    campus: string;
    city: string;
    postcode: string;
    mapsQuery: string;
    full: string;
    mapsUrl: string;
    embedUrl: string;
  };
  contact: { email: string; phone: { label: string; tel: string } };
  socials: SocialLink[];
  giving: {
    paypalUrl: string;
    bank: { accountName: string; accountNumber: string; sortCode: string };
    chequePayableTo: string;
  };
  hero: HeroSlide[];
};

function withComputedLocation(
  loc: Omit<SiteSettings["location"], "full" | "mapsUrl" | "embedUrl">,
): SiteSettings["location"] {
  const mapsQuery =
    loc.mapsQuery || `${loc.venue}, ${loc.campus}, ${loc.postcode}`;
  return {
    ...loc,
    mapsQuery,
    full: `${loc.venue}, ${loc.campus}, ${loc.city} ${loc.postcode}`,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`,
    embedUrl: `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`,
  };
}

const locationDefaults = {
  venue: defaultLocation.venue,
  campus: defaultLocation.campus,
  city: defaultLocation.city,
  postcode: defaultLocation.postcode,
  mapsQuery: defaultLocation.mapsQuery,
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  let overrides: Record<string, unknown> = {};
  try {
    const { data } = await createPublicClient()
      .from("site_settings")
      .select("key, value");
    overrides = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  } catch (error) {
    console.error("site_settings read failed; using defaults", error);
  }

  const group = <T extends object>(key: string, defaults: T): T => ({
    ...defaults,
    ...((overrides[key] as Partial<T> | undefined) ?? {}),
  });

  const givingOverride = (overrides.giving ?? {}) as Partial<
    SiteSettings["giving"]
  >;

  return {
    church: group("church", {
      name: defaultChurch.name,
      legalName: defaultChurch.legalName,
      shortName: defaultChurch.shortName,
      tagline: defaultChurch.tagline,
      mission: defaultChurch.mission,
      charityNumber: defaultChurch.charityNumber,
    }),
    service: group("service", {
      day: defaultService.day,
      startTime: defaultService.startTime,
      doorsOpen: defaultService.doorsOpen as string | null,
    }),
    location: withComputedLocation(group("location", locationDefaults)),
    contact: group("contact", {
      email: defaultContact.email,
      phone: { ...defaultContact.phone },
    }),
    socials: (overrides.socials as SocialLink[] | undefined) ?? [
      ...defaultSocials,
    ],
    giving: {
      paypalUrl: givingOverride.paypalUrl ?? defaultGiving.paypalUrl,
      chequePayableTo:
        givingOverride.chequePayableTo ?? defaultGiving.chequePayableTo,
      bank: { ...defaultGiving.bank, ...(givingOverride.bank ?? {}) },
    },
    hero: (overrides.hero as HeroSlide[] | undefined) ?? [...defaultHero],
  };
});
