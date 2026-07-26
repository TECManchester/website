import { AlertCircle, Info } from "lucide-react";
import type { FormState } from "@/lib/actions/submissions";

/** Form-level status. Announced to screen readers as it appears. */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;

  // "Disabled" isn't a failure — the form simply isn't live yet, so it reads as
  // a neutral notice rather than something the visitor did wrong.
  if (state.status === "disabled") {
    return (
      <p
        role="status"
        className="text-grey-500 bg-grey-50 flex items-start gap-2 rounded-lg p-4 text-sm"
      >
        <Info className="mt-0.5 size-4 shrink-0" />
        {state.message}
      </p>
    );
  }

  if (state.status !== "error") return null;

  return (
    <p role="alert" className="text-destructive flex items-start gap-2 text-sm">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {state.message}
    </p>
  );
}

export function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  );
}
