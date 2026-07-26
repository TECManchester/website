"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Btn } from "@/components/btn";
import {
  initialFormState,
  subscribeToNewsletter,
} from "@/lib/actions/submissions";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(
    subscribeToNewsletter,
    initialFormState,
  );

  if (state.status === "success") {
    return (
      <p className="text-green relative flex items-center justify-center gap-2 font-medium">
        <CheckCircle2 className="size-5" />
        {state.message}
      </p>
    );
  }

  return (
    <div className="relative z-2">
      <form
        action={action}
        className="mx-auto flex max-w-[480px] flex-col gap-2.5 sm:flex-row"
        noValidate
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.message ? "newsletter-status" : undefined}
          className="focus-visible:outline-green flex-1 rounded-full border-none px-5.5 py-3.5 text-[15px] text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <Btn type="submit" variant="green" size="lg" disabled={pending}>
          {pending ? "Subscribing…" : "Subscribe"}
        </Btn>
      </form>

      {state.message && (
        <p
          id="newsletter-status"
          role={state.status === "error" ? "alert" : "status"}
          className="mt-4 text-sm text-white/70"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
