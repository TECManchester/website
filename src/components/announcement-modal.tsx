"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { btn } from "@/components/btn";
import { cn } from "@/lib/utils";

export type ActiveAnnouncement = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  dismiss_hours: number;
  /** Bumps on edit, so a re-worded announcement shows again. */
  updated_at: string;
};

/**
 * Dismissals live in localStorage as a timestamp per announcement version.
 * useSyncExternalStore keeps the read out of render (and SSR-safe); Base UI's
 * Dialog supplies the focus trap, Escape handling and focus return.
 */
const listeners = new Set<() => void>();

function keyFor(a: ActiveAnnouncement) {
  return `ecm-announcement-${a.id}-${Date.parse(a.updated_at)}`;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function dismiss(a: ActiveAnnouncement, nowMs: number) {
  window.localStorage.setItem(keyFor(a), String(nowMs));
  for (const l of listeners) l();
}

export function AnnouncementModal({
  announcement,
  /** Server-provided "now" — keeps render pure; fresh enough at ISR cadence. */
  nowMs,
}: {
  announcement: ActiveAnnouncement;
  nowMs: number;
}) {
  const dismissedAt = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(keyFor(announcement)),
    () => "ssr", // never open during SSR/hydration — avoids a mismatch flash
  );

  const open =
    dismissedAt === null
      ? true
      : dismissedAt === "ssr"
        ? false
        : nowMs - Number(dismissedAt) >
          announcement.dismiss_hours * 3_600_000;

  const close = () => dismiss(announcement, nowMs);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-ink/60 fixed inset-0 z-300 backdrop-blur-sm motion-safe:transition-opacity" />
        <Dialog.Popup className="fixed inset-0 z-301 grid place-items-center p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            {announcement.image_url && (
              <div className="bg-ink relative aspect-16/9">
                <Image
                  src={announcement.image_url}
                  alt=""
                  fill
                  sizes="448px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-7">
              <Dialog.Title className="font-heading text-ink text-2xl font-bold text-balance">
                {announcement.title}
              </Dialog.Title>
              <Dialog.Description className="text-grey-500 mt-3 text-[15px] leading-relaxed whitespace-pre-line">
                {announcement.body}
              </Dialog.Description>

              <div className="mt-6 flex flex-wrap gap-3">
                {announcement.cta_url && (
                  <Link
                    href={announcement.cta_url}
                    onClick={close}
                    className={cn(btn({ variant: "green" }))}
                  >
                    {announcement.cta_label ?? "Find out more"}
                  </Link>
                )}
                <Dialog.Close className={cn(btn({ variant: "ghost" }))}>
                  Not now
                </Dialog.Close>
              </div>
            </div>
          </div>

          <Dialog.Close
            aria-label="Close announcement"
            className="fixed top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
          >
            <X className="size-5" />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
