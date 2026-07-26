"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "ecm-announcement-dismissed";

export type Announcement = {
  /** Bumping this re-shows the bar for people who dismissed the previous one. */
  id: string;
  text: React.ReactNode;
  href?: string;
  linkLabel?: string;
};

/**
 * Tiny store over localStorage.
 *
 * useSyncExternalStore rather than an effect: the dismissed flag is external
 * browser state, and reading it in an effect would mean a setState-triggered
 * second render on every mount.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keep tabs in sync if it's dismissed elsewhere.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY);
}

/** Server render: nothing is dismissed yet. */
function getServerSnapshot(): string | null {
  return null;
}

function dismiss(id: string) {
  window.localStorage.setItem(STORAGE_KEY, id);
  for (const listener of listeners) listener();
}

export function AnnouncementBar({
  announcement,
}: {
  announcement: Announcement;
}) {
  const dismissedId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (dismissedId === announcement.id) return null;

  return (
    <div className="bg-ink relative px-10 py-[9px] text-center text-[13.5px] font-medium text-white">
      {announcement.text}
      {announcement.href && (
        <>
          {" "}
          <Link
            href={announcement.href}
            className="text-green underline underline-offset-2 transition-colors hover:text-white"
          >
            {announcement.linkLabel ?? "Find out more"} →
          </Link>
        </>
      )}
      <button
        type="button"
        onClick={() => dismiss(announcement.id)}
        aria-label="Dismiss announcement"
        className="absolute top-1/2 right-3.5 -translate-y-1/2 p-1 text-white/60 transition-colors hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
