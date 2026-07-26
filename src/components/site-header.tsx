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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock background scrolling while the full-screen mobile menu is open.
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

  return (
    <>
      <header
        className={cn(
          "border-grey-100 sticky top-0 z-100 border-b bg-white/92 backdrop-blur-xl transition-shadow duration-300",
          scrolled && "shadow-[0_6px_24px_rgb(14_14_44_/_0.07)]",
        )}
      >
        <div className="wrap flex h-[74px] items-center justify-between">
          <Link
            href="/"
            aria-label="Elevation Church Manchester — home"
            className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600"
          >
            <Logo />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "font-heading hover:bg-grey-50 hover:text-green-600 block rounded-[9px] px-3.5 py-2.5 text-[14.5px] font-medium transition-colors",
                      isActive(item.href) ? "text-green-600" : "text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2.5">
            <BtnLink href="/im-new" variant="ghost" className="hidden lg:inline-flex">
              Plan a Visit
            </BtnLink>
            <BtnLink href="/give" variant="green" className="hidden lg:inline-flex">
              Give
            </BtnLink>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="text-ink p-2 lg:hidden"
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
        // Keeps links out of the tab order while the panel is off-screen.
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
