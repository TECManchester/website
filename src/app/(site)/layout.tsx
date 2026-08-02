import type { Metadata } from "next";
import { Geist_Mono, Inter, Sora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RevealProvider } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AnnouncementModal } from "@/components/announcement-modal";
import { ConsentProvider } from "@/components/consent-provider";
import { CookieBanner } from "@/components/cookie-banner";
import { getActiveAnnouncement } from "@/lib/announcements";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import "../globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Display face from the approved design template.
const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Every public route re-renders within 5 minutes of a settings/content change;
 * admin saves also revalidate the layout immediately.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { church, service, location } = await getSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${church.name} | ${church.tagline}`,
      template: `${church.name} | %s`,
    },
    description: `A Spirit-filled church family in Manchester on one mission: making greatness common. Join us ${service.day}s at ${service.startTime}, ${location.venue}, ${location.campus}.`,
    keywords: [
      "church in Manchester",
      "Elevation Church Manchester",
      "TEC Manchester",
      "Pentecostal church Manchester",
      "Salford church",
    ],
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: church.name,
      title: `${church.name} | ${church.tagline}`,
      description: `Join us ${service.day}s at ${service.startTime} — ${location.full}.`,
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${church.name} | ${church.tagline}`,
      description: `Join us ${service.day}s at ${service.startTime} — ${location.full}.`,
    },
    alternates: { canonical: "/" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ service }, announcement] = await Promise.all([
    getSettings(),
    getActiveAnnouncement(),
  ]);
  const nowMs = new Date().getTime();
  return (
    <html
      lang="en-GB"
      className={`${inter.variable} ${sora.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ConsentProvider>
          <a
            href="#main"
            className="bg-primary text-primary-foreground focus:ring-ring sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:ring-2"
          >
            Skip to content
          </a>
          <SiteHeader service={service} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          {announcement && (
            <AnnouncementModal announcement={announcement} nowMs={nowMs} />
          )}
          <RevealProvider />
          <Toaster />
          <CookieBanner />
        </ConsentProvider>
      </body>
    </html>
  );
}
