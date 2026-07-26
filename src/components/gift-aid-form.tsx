"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Btn } from "@/components/btn";
import { FieldError, FormMessage } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  initialFormState,
  submitGiftAidDeclaration,
} from "@/lib/actions/submissions";
import {
  ADDRESS_NOTE,
  CHARITY_LINE,
  DECLARATION_NOTES,
  DECLARATION_STATEMENT,
  HIGHER_RATE_NOTE,
  NAME_NOTE,
} from "@/lib/gift-aid";

const TITLES = ["Mr", "Mrs", "Miss", "Ms", "Dr", "Rev", "Pastor"];

export function GiftAidForm() {
  const [state, action, pending] = useActionState(
    submitGiftAidDeclaration,
    initialFormState,
  );

  if (state.status === "success") {
    return (
      <div className="border-green/50 bg-green-100 rounded-2xl border p-8 text-center">
        <CheckCircle2 className="text-green-600 mx-auto size-10" />
        <h3 className="font-heading mt-4 text-2xl font-bold">
          Declaration received
        </h3>
        <p className="text-grey-700 mx-auto mt-3 max-w-md leading-relaxed">
          {state.message}
        </p>
        <p className="text-grey-500 mt-4 text-sm">
          Please let us know if you change your name or address, stop paying
          enough tax, or want to cancel.
        </p>
      </div>
    );
  }

  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-8" noValidate>
      {/* The declaration itself — HMRC model wording, shown before the fields
          so people read what they're agreeing to. */}
      <div className="border-grey-100 bg-grey-50 rounded-2xl border p-6">
        <p className="text-grey-700 leading-relaxed">
          {DECLARATION_STATEMENT}
        </p>
      </div>

      <fieldset className="space-y-5">
        <legend className="font-heading text-ink mb-1 text-lg font-bold">
          Your details
        </legend>

        <div className="grid gap-5 sm:grid-cols-[120px_1fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="ga-title">Title</Label>
            <select
              id="ga-title"
              name="title"
              className="border-input focus-visible:outline-green-600 h-9 w-full rounded-md border bg-transparent px-3 text-sm focus-visible:outline-2"
              defaultValue=""
            >
              <option value="">—</option>
              {TITLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ga-first">
              First name <span aria-hidden>*</span>
            </Label>
            <Input
              id="ga-first"
              name="first_name"
              autoComplete="given-name"
              required
              aria-invalid={Boolean(err.first_name)}
              aria-describedby="ga-first-note ga-first-error"
            />
            <p id="ga-first-note" className="text-grey-500 text-xs">
              {NAME_NOTE}
            </p>
            <FieldError id="ga-first-error" message={err.first_name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ga-last">
              Surname <span aria-hidden>*</span>
            </Label>
            <Input
              id="ga-last"
              name="last_name"
              autoComplete="family-name"
              required
              aria-invalid={Boolean(err.last_name)}
              aria-describedby="ga-last-error"
            />
            <FieldError id="ga-last-error" message={err.last_name} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-heading text-ink mb-1 text-lg font-bold">
          Your home address
        </legend>
        <p className="text-grey-500 -mt-2 text-sm">{ADDRESS_NOTE}</p>

        <div className="space-y-2">
          <Label htmlFor="ga-addr1">
            House name or number, and street <span aria-hidden>*</span>
          </Label>
          <Input
            id="ga-addr1"
            name="address_line1"
            autoComplete="address-line1"
            required
            aria-invalid={Boolean(err.address_line1)}
            aria-describedby="ga-addr1-error"
          />
          <FieldError id="ga-addr1-error" message={err.address_line1} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ga-addr2">Address line 2</Label>
          <Input
            id="ga-addr2"
            name="address_line2"
            autoComplete="address-line2"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ga-city">Town or city</Label>
            <Input
              id="ga-city"
              name="city"
              autoComplete="address-level2"
              defaultValue="Manchester"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ga-postcode">
              Postcode <span aria-hidden>*</span>
            </Label>
            <Input
              id="ga-postcode"
              name="postcode"
              autoComplete="postal-code"
              required
              className="uppercase"
              aria-invalid={Boolean(err.postcode)}
              aria-describedby="ga-postcode-error"
            />
            <FieldError id="ga-postcode-error" message={err.postcode} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-heading text-ink mb-1 text-lg font-bold">
          How we reach you
        </legend>
        <p className="text-grey-500 -mt-2 text-sm">
          Optional, but it helps us confirm your declaration and let you know if
          anything changes.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ga-email">Email</Label>
            <Input
              id="ga-email"
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(err.email)}
              aria-describedby="ga-email-error"
            />
            <FieldError id="ga-email-error" message={err.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ga-phone">Phone</Label>
            <Input id="ga-phone" name="phone" type="tel" autoComplete="tel" />
          </div>
        </div>
      </fieldset>

      {/* The tick box. Without this there is no valid declaration. */}
      <div className="border-green/40 bg-green-100 rounded-2xl border p-6">
        <label className="flex items-start gap-3.5">
          <input
            type="checkbox"
            name="declaration_accepted"
            required
            aria-invalid={Boolean(err.declaration_accepted)}
            aria-describedby="ga-accept-error"
            className="border-grey-300 text-green-600 focus-visible:outline-green-600 mt-1 size-5 shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          <span className="text-grey-700 text-[15px] leading-relaxed">
            <b className="text-ink">Yes, I want to Gift Aid my giving.</b> I
            confirm the declaration above and that I am a UK taxpayer.
          </span>
        </label>
        <FieldError
          id="ga-accept-error"
          message={err.declaration_accepted}
        />
      </div>

      <FormMessage state={state} />

      <Btn type="submit" variant="green" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Submit my declaration"}
      </Btn>

      {/* HMRC-required notes. */}
      <div className="border-grey-100 text-grey-500 space-y-4 border-t pt-6 text-sm">
        {DECLARATION_NOTES.map((note) => (
          <div key={note.heading}>
            <p className="text-ink font-medium">{note.heading}:</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              {note.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        <p>{HIGHER_RATE_NOTE}</p>
        <p>{CHARITY_LINE}</p>
      </div>
    </form>
  );
}
