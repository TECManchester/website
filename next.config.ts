import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home directory makes Turbopack infer the
  // wrong workspace root. Pin it to this project.
  turbopack: {
    root: path.resolve(import.meta.dirname),
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
      { protocol: "https", hostname: "yt3.ggpht.com" },
    ],
  },
};

export default nextConfig;
