import type { Metadata } from "next";
import { Geist_Mono, Inter, Sora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RevealProvider } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { church, location, service } from "@/lib/church";
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

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${inter.variable} ${sora.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="bg-primary text-primary-foreground focus:ring-ring sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:ring-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <RevealProvider />
        <Toaster />
      </body>
    </html>
  );
}
