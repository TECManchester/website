"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSettings } from "@/lib/settings";
import {
  DECLARATION_STATEMENT,
  DECLARATION_VERSION,
  UK_POSTCODE_RE,
  normalisePostcode,
} from "@/lib/gift-aid";

/**
 * Per-form switches. All live: submissions land in Supabase and are read in
 * the admin inbox by the roles allowed to see each kind.
 */
const FORMS_ENABLED = {
  prayer: true,
  contact: true,
  newsletter: true,
  giftAid: true,
} as const;

export type FormState = {
  status: "idle" | "success" | "error" | "disabled";
  message: string;
  fieldErrors?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle", message: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Deliberately explicit rather than silently succeeding.
 *
 * A prayer request that appears to send but goes nowhere is worse than a form
 * that tells you to email instead — so if the backend isn't wired up, say so.
 */
async function notConfigured(): Promise<FormState> {
  const { contact } = await getSettings();
  return {
    status: "error",
    message: `Our form isn't connected yet — sorry. Please email us at ${contact.email} and we'll pick it up from there.`,
  };
}

async function contactEmail(): Promise<string> {
  return (await getSettings()).contact.email;
}

function formsDisabled(): FormState {
  return {
    status: "disabled",
    message:
      "This form isn't live yet, so nothing has been sent. Please speak to us on a Sunday in the meantime.",
  };
}

export async function submitPrayerRequest(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const request = text(data, "request");
  const email = text(data, "email");

  const fieldErrors: Record<string, string> = {};
  if (!request) {
    fieldErrors.request = "Please tell us what we can pray for.";
  }
  if (email && !EMAIL_RE.test(email)) {
    fieldErrors.email = "That doesn't look like a valid email address.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please check the form.", fieldErrors };
  }

  if (!FORMS_ENABLED.prayer) return formsDisabled();
  if (!isSupabaseConfigured) return await notConfigured();

  const { error } = await createAdminClient()
    .from("prayer_requests")
    .insert({
      name: text(data, "name") || null,
      email: email || null,
      phone: text(data, "phone") || null,
      request,
      share_with_team: data.get("share_with_team") === "on",
      is_urgent: data.get("is_urgent") === "on",
    });

  if (error) {
    console.error("prayer_requests insert failed", error);
    return {
      status: "error",
      message: `Something went wrong our end. Please email ${await contactEmail()} and we'll make sure it's prayed for.`,
    };
  }

  return {
    status: "success",
    message:
      "Thank you — we've received your request and our prayer team will be praying.",
  };
}

export async function subscribeToNewsletter(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const email = text(data, "email");

  if (!email || !EMAIL_RE.test(email)) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
      fieldErrors: { email: "Please enter a valid email address." },
    };
  }

  if (!FORMS_ENABLED.newsletter) return formsDisabled();
  if (!isSupabaseConfigured) return await notConfigured();

  // Re-subscribing shouldn't error on the unique index.
  const { error } = await createAdminClient()
    .from("newsletter_subscribers")
    .upsert({ email, name: text(data, "name") || null }, { onConflict: "email" });

  if (error) {
    console.error("newsletter_subscribers upsert failed", error);
    return {
      status: "error",
      message: "Something went wrong our end. Please try again shortly.",
    };
  }

  return {
    status: "success",
    message: "You're on the list — check your inbox to confirm.",
  };
}

/**
 * Gift Aid declaration.
 *
 * Validation here mirrors what HMRC will reject at audit rather than what's
 * merely convenient: full forename (not an initial), a home address with house
 * name/number, a full postcode, and an explicitly ticked declaration. A record
 * missing any of these is not a claimable declaration, so it's better to stop
 * it at the form than to store something unusable.
 */
export async function submitGiftAidDeclaration(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const firstName = text(data, "first_name");
  const lastName = text(data, "last_name");
  const addressLine1 = text(data, "address_line1");
  const postcodeRaw = text(data, "postcode");
  const email = text(data, "email");
  const accepted = data.get("declaration_accepted") === "on";

  const fieldErrors: Record<string, string> = {};

  if (!firstName) {
    fieldErrors.first_name = "Please give your first name.";
  } else if (firstName.replace(/[.\s]/g, "").length < 2) {
    // HMRC does not accept initials.
    fieldErrors.first_name =
      "HMRC needs your full first name, not an initial.";
  }

  if (!lastName || lastName.length < 2) {
    fieldErrors.last_name = "Please give your surname.";
  }

  if (!addressLine1) {
    fieldErrors.address_line1 =
      "Please give your home address, including house name or number.";
  } else if (!/\d/.test(addressLine1) && addressLine1.length < 4) {
    fieldErrors.address_line1 =
      "Please include your house name or number — HMRC requires it.";
  }

  if (!postcodeRaw) {
    fieldErrors.postcode = "Please give your full postcode.";
  } else if (!UK_POSTCODE_RE.test(postcodeRaw)) {
    fieldErrors.postcode = "That doesn't look like a full UK postcode.";
  }

  if (email && !EMAIL_RE.test(email)) {
    fieldErrors.email = "That doesn't look like a valid email address.";
  }

  if (!accepted) {
    fieldErrors.declaration_accepted =
      "Please confirm the declaration so we can claim Gift Aid.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  if (!FORMS_ENABLED.giftAid) return formsDisabled();
  if (!isSupabaseConfigured) return await notConfigured();

  const { error } = await createAdminClient()
    .from("gift_aid_declarations")
    .insert({
      title: text(data, "title") || null,
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_line2: text(data, "address_line2") || null,
      city: text(data, "city") || null,
      postcode: normalisePostcode(postcodeRaw),
      email: email || null,
      phone: text(data, "phone") || null,
      declaration_accepted: true,
      covers_past_four_years: true,
      covers_future_donations: true,
      // Stored verbatim so an audit can show exactly what was agreed to.
      declaration_text: DECLARATION_STATEMENT,
      declaration_version: DECLARATION_VERSION,
    });

  if (error) {
    console.error("gift_aid_declarations insert failed", error);
    return {
      status: "error",
      message: `We couldn't save your declaration. Please email ${await contactEmail()} and we'll sort it out.`,
    };
  }

  return {
    status: "success",
    message:
      "Thank you — your Gift Aid declaration is recorded. Every £10 you give is now worth £12.50 to the church, at no extra cost to you.",
  };
}

export async function submitContactMessage(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const name = text(data, "name");
  const email = text(data, "email");
  const message = text(data, "message");

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Please tell us your name.";
  if (!email) {
    fieldErrors.email = "We need an email address to reply to.";
  } else if (!EMAIL_RE.test(email)) {
    fieldErrors.email = "That doesn't look like a valid email address.";
  }
  if (!message) fieldErrors.message = "Please write your message.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please check the form.", fieldErrors };
  }

  if (!FORMS_ENABLED.contact) return formsDisabled();
  if (!isSupabaseConfigured) return await notConfigured();

  const { error } = await createAdminClient()
    .from("contact_messages")
    .insert({
      name,
      email,
      phone: text(data, "phone") || null,
      subject: text(data, "subject") || null,
      message,
    });

  if (error) {
    console.error("contact_messages insert failed", error);
    return {
      status: "error",
      message: `Something went wrong our end. Please email ${await contactEmail()} directly.`,
    };
  }

  return {
    status: "success",
    message: "Thank you — we've got your message and we'll be in touch soon.",
  };
}
