"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  setSubmissionStatus,
  type SubmissionKind,
} from "@/lib/actions/admin-submissions";
import { cn } from "@/lib/utils";

const STATUSES = [
  ["new", "New"],
  ["in_progress", "In progress"],
  ["done", "Done"],
] as const;

export function SubmissionStatus({
  kind,
  id,
  status,
}: {
  kind: SubmissionKind;
  id: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div
      className={cn("flex gap-1", pending && "opacity-50")}
      role="group"
      aria-label="Status"
    >
      {STATUSES.map(([value, label]) => (
        <button
          key={value}
          type="button"
          disabled={pending || status === value}
          onClick={() =>
            start(async () => {
              const r = await setSubmissionStatus(kind, id, value);
              if (!r.ok) toast.error(r.message);
            })
          }
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase transition",
            status === value
              ? value === "done"
                ? "bg-green text-ink"
                : value === "in_progress"
                  ? "bg-gold/30 text-ink"
                  : "bg-ink text-white"
              : "bg-grey-100 text-grey-500 hover:text-ink",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
