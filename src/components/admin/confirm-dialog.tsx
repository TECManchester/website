"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Btn } from "@/components/btn";
import { cn } from "@/lib/utils";

/**
 * Confirmation dialog, replacing window.confirm().
 *
 * The browser dialog was wrong here for three reasons: it's unstyled and looks
 * like a scam popup on a site people are trusting with church data, it can't
 * explain a consequence beyond one line, and Safari lets people tick "prevent
 * this page creating more dialogs" — after which every delete silently
 * succeeds without asking. This can't be suppressed.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  busy = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-ink/50 fixed inset-0 z-50 backdrop-blur-[2px] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity" />
        <Dialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-white p-6 shadow-2xl transition-all",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          )}
        >
          <div className="flex gap-4">
            {destructive && (
              <span className="bg-destructive/10 grid size-10 shrink-0 place-items-center rounded-xl">
                <AlertTriangle className="text-destructive size-5" />
              </span>
            )}
            <div className="min-w-0">
              <Dialog.Title className="font-heading text-ink text-lg font-bold">
                {title}
              </Dialog.Title>
              {body && (
                <Dialog.Description
                  render={<div />}
                  className="text-grey-500 mt-1.5 text-sm leading-relaxed"
                >
                  {body}
                </Dialog.Description>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Btn
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Btn>
            <Btn
              type="button"
              variant={destructive ? "navy" : "green"}
              disabled={busy}
              onClick={onConfirm}
              className={
                destructive
                  ? "bg-destructive hover:bg-destructive/90 text-white"
                  : undefined
              }
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Working…
                </>
              ) : (
                confirmLabel
              )}
            </Btn>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Hook form for the common case: a button that needs confirming before it runs.
 *
 * Returns the props for the dialog plus an `ask` function to open it, so a
 * caller only writes the trigger and the action.
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return {
    open,
    busy,
    ask: () => setOpen(true),
    close: () => setOpen(false),
    setBusy,
    dialogProps: {
      open,
      busy,
      onOpenChange: (next: boolean) => {
        if (!busy) setOpen(next);
      },
    },
  };
}
