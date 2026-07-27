"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { Logo } from "@/components/logo";
import { nav, service } from "@/lib/church";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Only the homepage has a full-height hero for the header to sit over.
  const isHome = pathname === "/";

  useEffect(() => {
    // Flip once the hero has largely scrolled past, so the header doesn't
    // fight the image behind it on the way down.
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  /** Sitting over the hero image, rather than on a white page. */
  const overHero = isHome && !scrolled;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-100 border-b transition-[background-color,box-shadow,border-color] duration-300",
          overHero
            ? "border-transparent bg-transparent"
            : "border-grey-100 bg-white/92 backdrop-blur-xl",
          scrolled && "shadow-[0_6px_24px_rgb(14_14_44_/_0.07)]",
        )}
      >
        <div className="wrap flex h-[76px] items-center justify-between sm:h-22">
          <Link
            href="/"
            aria-label="Elevation Church Manchester — home"
            className="focus-visible:outline-green-600 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {isHome ? (
              /*
               * Both lockups render and crossfade. Swapping the src on scroll
               * would pop the first time, because the second file hasn't been
               * fetched yet.
               */
              <span className="relative block">
                <Logo
                  priority
                  tone="white"
                  className={cn(
                    "transition-opacity duration-300",
                    overHero ? "opacity-100" : "opacity-0",
                  )}
                />
                <Logo
                  priority
                  tone="ink"
                  className={cn(
                    "absolute top-0 left-0 transition-opacity duration-300",
                    overHero ? "opacity-0" : "opacity-100",
                  )}
                />
              </span>
            ) : (
              <Logo priority tone="ink" />
            )}
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "font-heading block rounded-[9px] px-3.5 py-2.5 text-[14.5px] font-medium transition-colors",
                      overHero
                        ? isActive(item.href)
                          ? "text-green"
                          : "text-white/85 hover:bg-white/10 hover:text-white"
                        : isActive(item.href)
                          ? "text-green-600"
                          : "text-ink hover:bg-grey-50 hover:text-green-600",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2.5">
            <BtnLink
              href="/im-new"
              variant={overHero ? "ghostOnDark" : "ghost"}
              className="hidden lg:inline-flex"
            >
              Plan a Visit
            </BtnLink>
            <BtnLink
              href="/give"
              variant="green"
              className="hidden lg:inline-flex"
            >
              Give
            </BtnLink>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className={cn(
                "p-2 transition-colors lg:hidden",
                overHero ? "text-white" : "text-ink",
              )}
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu */}
      <div
        className={cn(
          "bg-ink fixed inset-0 z-200 flex flex-col p-7 transition-transform duration-350 ease-[cubic-bezier(.4,0,.2,1)] lg:hidden",
          menuOpen ? "translate-x-0" : "translate-x-full",
        )}
        inert={!menuOpen}
      >
        <div className="mb-8 flex items-center justify-between">
          <Logo tone="white" />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="p-1 text-white"
          >
            <X className="size-7" />
          </button>
        </div>

        <nav aria-label="Mobile" className="overflow-y-auto">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-heading hover:text-green block border-b border-white/10 py-3.5 text-[26px] font-semibold text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <p className="text-sm text-white/60">
            {service.day}s at {service.startTime}
          </p>
          <BtnLink
            href="/im-new"
            variant="ghostOnDark"
            size="lg"
            block
            onClick={() => setMenuOpen(false)}
          >
            Plan a Visit
          </BtnLink>
          <BtnLink
            href="/give"
            variant="green"
            size="lg"
            block
            onClick={() => setMenuOpen(false)}
          >
            Give
          </BtnLink>
        </div>
      </div>
    </>
  );
}
