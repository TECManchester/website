"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  initialFormState,
  submitPrayerRequest,
} from "@/lib/actions/submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage, FieldError } from "@/components/form-message";

export function PrayerForm() {
  const [state, action, pending] = useActionState(
    submitPrayerRequest,
    initialFormState,
  );

  if (state.status === "success") {
    return (
      <div className="border-green/50 bg-green-100 rounded-xl border p-8 text-center">
        <CheckCircle2 className="text-green-600 mx-auto size-10" />
        <h2 className="font-heading mt-4 text-2xl font-semibold">
          We&apos;re praying
        </h2>
        <p className="text-grey-500 mt-3 leading-relaxed">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" autoComplete="name" />
          <p className="text-grey-500 text-xs">
            Optional — you&apos;re welcome to stay anonymous.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={
              state.fieldErrors?.email ? "email-error" : undefined
            }
          />
          <FieldError id="email-error" message={state.fieldErrors?.email} />
          <p className="text-grey-500 text-xs">
            Only if you&apos;d like us to follow up.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="request">
          What can we pray for? <span aria-hidden>*</span>
        </Label>
        <Textarea
          id="request"
          name="request"
          rows={6}
          required
          aria-invalid={Boolean(state.fieldErrors?.request)}
          aria-describedby={
            state.fieldErrors?.request ? "request-error" : undefined
          }
        />
        <FieldError id="request-error" message={state.fieldErrors?.request} />
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Options</legend>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="share_with_team"
            className="border-input text-green-600 focus-visible:ring-ring mt-0.5 size-4 rounded focus-visible:ring-2"
          />
          <span>
            Share this with our wider prayer team.
            <span className="text-grey-500 block text-xs">
              Leave unticked and only the pastoral team will see it.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="is_urgent"
            className="border-input text-green-600 focus-visible:ring-ring mt-0.5 size-4 rounded focus-visible:ring-2"
          />
          <span>This is urgent.</span>
        </label>
      </fieldset>

      <FormMessage state={state} />

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send prayer request"}
      </Button>
    </form>
  );
}
