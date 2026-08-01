import path from "node:path";
import type { NextConfig } from "next";

/*
 * Derived from the env var rather than hardcoded: the Supabase project ref used
 * to appear literally here, so pointing at a different project (or provider)
 * meant a code change as well as a config change.
 */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home directory makes Turbopack infer the
  // wrong workspace root. Pin it to this project.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  experimental: {
    /*
     * Server actions cap request bodies at 1 MB by default — a phone photo
     * upload through the media library dies at the door with a digest-only
     * 500 before our own 10 MB check ever runs. 12 MB = our limit plus
     * multipart overhead.
     */
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
    /*
     * Next only serves qualities listed here and 400s on anything else; the
     * default is [75] alone. 90 is for the hero, which is full-bleed and gets
     * upscaled by the browser on high-DPI screens — 75 on top of the source
     * JPEG's own compression was visibly soft.
     */
    qualities: [75, 90],
    remotePatterns: [
      // YouTube video thumbnails.
      { protocol: "https", hostname: "i.ytimg.com" },
      // Supabase Storage (media library uploads).
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
      { protocol: "https", hostname: "yt3.ggpht.com" },
    ],
  },
  async headers() {
    /*
     * Baseline hardening. The admin holds prayer requests and Gift Aid
     * records, so the important one is frame-ancestors: without it the admin
     * can be framed by another site and an editor click-jacked.
     *
     * 'unsafe-inline' on script-src is required by Next's inline bootstrap and
     * hydration payload; a nonce-based policy needs every response to be
     * dynamic, which would cost us static rendering on the whole public site.
     * Given no user-authored HTML is ever injected (Tiptap renders through
     * React elements, never dangerouslySetInnerHTML), the XSS surface this
     * would defend is already closed.
     */
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com https://yt3.ggpht.com",
      "font-src 'self' data:",
      "media-src 'self' https://*.supabase.co",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Nothing under /admin should ever be cached by a shared proxy or
        // stored by the browser — it's all personal data behind a session.
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
