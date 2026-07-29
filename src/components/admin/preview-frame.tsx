"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";

const WIDTHS = [
  { key: "desktop", label: "Desktop", icon: Monitor, width: "100%" },
  { key: "tablet", label: "Tablet", icon: Tablet, width: "768px" },
  { key: "mobile", label: "Mobile", icon: Smartphone, width: "390px" },
] as const;

/**
 * Wraps the draft render in a resizable frame so editors can check the page
 * at desktop, tablet and phone widths before publishing.
 */
export function PreviewFrame({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref: string;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<(typeof WIDTHS)[number]["key"]>("desktop");
  const active = WIDTHS.find((w) => w.key === mode)!;

  return (
    <div className="-mx-6 -my-8 min-h-dvh lg:-mx-10">
      <div className="bg-ink sticky top-0 z-50 flex items-center justify-between gap-4 px-5 py-3">
        <Link
          href={backHref}
          className="hover:text-green flex items-center gap-2 text-sm font-semibold text-white/80"
        >
          <ArrowLeft className="size-4" /> Back to editor
        </Link>
        <p className="hidden truncate text-sm font-semibold text-white sm:block">
          Preview · {title} <span className="text-gold">(draft)</span>
        </p>
        <div className="flex gap-1" role="group" aria-label="Preview width">
          {WIDTHS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              aria-label={label}
              aria-pressed={mode === key}
              className={cn(
                "grid size-9 place-items-center rounded-lg transition",
                mode === key
                  ? "bg-green text-ink"
                  : "text-white/60 hover:text-white",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-grey-100 flex justify-center overflow-x-auto p-4 sm:p-8">
        <div
          className={cn(
            "w-full overflow-hidden bg-white shadow-2xl transition-[max-width] duration-300",
            mode !== "desktop" && "rounded-3xl",
          )}
          style={{ maxWidth: active.width }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
