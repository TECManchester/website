/**
 * Canonical origin for metadata, sitemap and robots.
 *
 * Confirmed 26 July 2026: this build will replace the existing
 * elevationmanchester.org, so that stays the canonical domain.
 *
 * Set NEXT_PUBLIC_SITE_URL locally and on preview deploys so they don't
 * advertise production URLs in their metadata.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://elevationmanchester.org";
