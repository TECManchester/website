"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { nav, service } from "@/lib/church";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeSheet = () => setOpen(false);

  return (
    <header className="bg-background/90 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="focus-visible:ring-ring shrink-0 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Elevation Church Manchester — home"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Main"
          className="ml-auto hidden items-center gap-1 lg:flex"
        >
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "hover:text-brand-green rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-brand-green" : "text-foreground/80",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <ButtonLink href="/give" className="ml-2">
            Give
          </ButtonLink>
          <ButtonLink
            href="/im-new"
            className="bg-brand-green text-brand-navy hover:bg-brand-green/90"
          >
            Plan a Visit
          </ButtonLink>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <ButtonLink
            href="/im-new"
            size="sm"
            className="bg-brand-green text-brand-navy hover:bg-brand-green/90 hidden sm:inline-flex"
          >
            Plan a Visit
          </ButtonLink>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="outline" size="icon" />}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSheet}
                    className="hover:bg-secondary rounded-md px-3 py-3 text-base font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-2">
                  <ButtonLink href="/give" size="lg" onClick={closeSheet}>
                    Give
                  </ButtonLink>
                  <ButtonLink
                    href="/im-new"
                    size="lg"
                    onClick={closeSheet}
                    className="bg-brand-green text-brand-navy hover:bg-brand-green/90"
                  >
                    Plan a Visit
                  </ButtonLink>
                </div>
                <p className="text-muted-foreground mt-6 px-3 text-sm">
                  {service.day}s at {service.startTime}
                </p>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
