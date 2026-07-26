"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  initialFormState,
  submitContactMessage,
} from "@/lib/actions/submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormMessage } from "@/components/form-message";

export function ContactForm() {
  const [state, action, pending] = useActionState(
    submitContactMessage,
    initialFormState,
  );

  if (state.status === "success") {
    return (
      <div className="border-green/50 bg-green-100 rounded-xl border p-8 text-center">
        <CheckCircle2 className="text-green-600 mx-auto size-10" />
        <h2 className="font-heading mt-4 text-2xl font-semibold">
          Message received
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
          <Label htmlFor="name">
            Your name <span aria-hidden>*</span>
          </Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby={
              state.fieldErrors?.name ? "name-error" : undefined
            }
          />
          <FieldError id="name-error" message={state.fieldErrors?.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span aria-hidden>*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={
              state.fieldErrors?.email ? "contact-email-error" : undefined
            }
          />
          <FieldError
            id="contact-email-error"
            message={state.fieldErrors?.email}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">What&apos;s it about?</Label>
          <Input
            id="subject"
            name="subject"
            placeholder="Visiting, Connect Groups, serving…"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">
          Your message <span aria-hidden>*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={6}
          required
          aria-invalid={Boolean(state.fieldErrors?.message)}
          aria-describedby={
            state.fieldErrors?.message ? "message-error" : undefined
          }
        />
        <FieldError id="message-error" message={state.fieldErrors?.message} />
      </div>

      <FormMessage state={state} />

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
