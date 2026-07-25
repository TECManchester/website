import { AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/actions/submissions";

/** Form-level status. Announced to screen readers as it appears. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status !== "error" || !state.message) return null;

  return (
    <p
      role="alert"
      className="text-destructive flex items-start gap-2 text-sm"
    >
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
