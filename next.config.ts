import path from "node:path";
import type { NextConfig } from "next";

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
      { protocol: "https", hostname: "imsmgftkwjbwaaqqzwta.supabase.co" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
    ],
  },
};

export default nextConfig;
