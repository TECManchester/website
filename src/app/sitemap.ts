import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const routes = [
  { path: "/", priority: 1 },
  { path: "/im-new", priority: 0.9 },
  { path: "/about", priority: 0.8 },
  { path: "/about/what-we-believe", priority: 0.7 },
  { path: "/watch", priority: 0.8 },
  { path: "/events", priority: 0.8 },
  { path: "/get-involved", priority: 0.8 },
  { path: "/give", priority: 0.9 },
  { path: "/prayer", priority: 0.7 },
  { path: "/contact", priority: 0.7 },
  { path: "/privacy", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: "weekly",
    priority,
  }));
}
