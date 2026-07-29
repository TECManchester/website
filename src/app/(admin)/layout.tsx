import type { Metadata } from "next";
import { Geist_Mono, Inter, Sora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

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
  title: {
    default: "Admin · Elevation Church Manchester",
    template: "%s · Admin",
  },
  // Staff tooling — keep every admin page out of search engines.
  robots: { index: false, follow: false },
};

/**
 * Root layout for /admin. A separate root from the public site, so the admin
 * never inherits the marketing header, footer, or slideshow.
 */
export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      className={`${inter.variable} ${sora.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-grey-50 min-h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
