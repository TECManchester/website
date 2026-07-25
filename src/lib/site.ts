/**
 * Canonical origin for metadata, sitemap and robots.
 *
 * CONFIRM: whether this build replaces elevationmanchester.org or sits on a new
 * domain. Until that's settled, set NEXT_PUBLIC_SITE_URL in the environment —
 * Vercel preview deploys will otherwise fall back to the production guess below.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://elevationmanchester.org";
