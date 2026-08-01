"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  notifyContactMessage,
  notifyGiftAid,
  notifyPrayerRequest,
} from "@/lib/email";
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

/**
 * Length ceilings for anything a stranger can post.
 *
 * The server-action body limit is 12 MB (raised for photo uploads, and it
 * applies to every action), so without these a single request could push
 * megabytes of text into the database.
 */
const LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  subject: 200,
  message: 5000,
  request: 5000,
  address: 200,
  postcode: 12,
  short: 100,
} as const;

function text(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Returns an error message if the field is over its ceiling. */
function tooLong(
  value: string,
  limit: number,
  label: string,
): string | null {
  return value.length > limit
    ? `${label} is too long — keep it under ${limit} characters.`
    : null;
}

/**
 * Bots fill in every field they find, including ones positioned off-screen.
 * A filled honeypot means it isn't a person, so we return the same success
 * message a human would see — telling a bot it failed just teaches it.
 */
function isBot(data: FormData): boolean {
  return text(data, "website") !== "" || text(data, "company") !== "";
}

const botSuccess = (message: string): FormState => ({
  status: "success",
  message,
});

/** Same ceiling everywhere: a person filling in a form a few times is fine. */
async function throttled(bucket: string): Promise<FormState | null> {
  const { allowed, retryAfterSeconds } = await checkRateLimit(bucket, {
    max: 5,
    windowSeconds: 600,
  });
  if (allowed) return null;
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return {
    status: "error",
    message: `That's a few submissions in a short time. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`,
  };
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

  const name = text(data, "name");
  const phone = text(data, "phone");

  const successMessage =
    "Thank you — we've received your request and our prayer team will be praying.";
  if (isBot(data)) return botSuccess(successMessage);

  const fieldErrors: Record<string, string> = {};
  if (!request) {
    fieldErrors.request = "Please tell us what we can pray for.";
  }
  if (email && !EMAIL_RE.test(email)) {
    fieldErrors.email = "That doesn't look like a valid email address.";
  }
  const overLong =
    tooLong(request, LIMITS.request, "Your request") ??
    tooLong(name, LIMITS.name, "Your name") ??
    tooLong(email, LIMITS.email, "Your email") ??
    tooLong(phone, LIMITS.phone, "Your phone number");
  if (overLong) fieldErrors.request = overLong;
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please check the form.", fieldErrors };
  }

  if (!FORMS_ENABLED.prayer) return formsDisabled();
  if (!isSupabaseConfigured) return await notConfigured();

  const limited = await throttled("prayer");
  if (limited) return limited;

  const shareWithTeam = data.get("share_with_team") === "on";
  const isUrgent = data.get("is_urgent") === "on";

  const { error } = await createAdminClient()
    .from("prayer_requests")
    .insert({
      name: name || null,
      email: email || null,
      phone: phone || null,
      request,
      share_with_team: shareWithTeam,
      is_urgent: isUrgent,
    });

  if (error) {
    console.error("prayer_requests insert failed", error);
    return {
      status: "error",
      message: `Something went wrong our end. Please email ${await contactEmail()} and we'll make sure it's prayed for.`,
    };
  }

  // The record is already saved; a failed notification must not surface as a
  // failed submission.
  await notifyPrayerRequest({
    name: name || null,
    email: email || null,
    phone: phone || null,
    request,
    isUrgent,
    shareWithTeam,
  });

  return { status: "success", message: successMessage };
}

export async function subscribeToNewsletter(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const email = text(data, "email");

  const successMessage = "You're on the list — thank you.";
  if (isBot(data)) return botSuccess(successMessage);

  if (!email || !EMAIL_RE.test(email) || email.length > LIMITS.email) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
      fieldErrors: { email: "Please enter a valid email address." },
    };
  }

  if (!FORMS_ENABLED.newsletter) return formsDisabled();
  if (!isSupabaseConfigured) return await notConfigured();

  const limited = await throttled("newsletter");
  if (limited) return limited;

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

  return { status: "success", message: successMessage };
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

  const successMessage =
    "Thank you — your Gift Aid declaration is recorded. Every £10 you give is now worth £12.50 to the church, at no extra cost to you.";
  if (isBot(data)) return botSuccess(successMessage);

  const fieldErrors: Record<string, string> = {};

  const overLong =
    tooLong(firstName, LIMITS.name, "First name") ??
    tooLong(lastName, LIMITS.name, "Surname") ??
    tooLong(addressLine1, LIMITS.address, "Address") ??
    tooLong(text(data, "address_line2"), LIMITS.address, "Address") ??
    tooLong(text(data, "city"), LIMITS.short, "Town or city") ??
    tooLong(postcodeRaw, LIMITS.postcode, "Postcode") ??
    tooLong(email, LIMITS.email, "Email") ??
    tooLong(text(data, "phone"), LIMITS.phone, "Phone number") ??
    tooLong(text(data, "title"), LIMITS.short, "Title");
  if (overLong) fieldErrors.first_name = overLong;

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

  const limited = await throttled("giftaid");
  if (limited) return limited;

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

  await notifyGiftAid({
    name: `${firstName} ${lastName}`,
    postcode: normalisePostcode(postcodeRaw),
  });

  return { status: "success", message: successMessage };
}

export async function submitContactMessage(
  _prev: FormState,
  data: FormData,
): Promise<FormState> {
  const name = text(data, "name");
  const email = text(data, "email");
  const message = text(data, "message");
  const phone = text(data, "phone");
  const subject = text(data, "subject");

  const successMessage =
    "Thank you — your message is with us and we'll be in touch soon.";
  if (isBot(data)) return botSuccess(successMessage);

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Please tell us your name.";
  if (!email) {
    fieldErrors.email = "We need an email address to reply to.";
  } else if (!EMAIL_RE.test(email)) {
    fieldErrors.email = "That doesn't look like a valid email address.";
  }
  if (!message) fieldErrors.message = "Please write your message.";

  const overLong =
    tooLong(name, LIMITS.name, "Your name") ??
    tooLong(email, LIMITS.email, "Your email") ??
    tooLong(phone, LIMITS.phone, "Your phone number") ??
    tooLong(subject, LIMITS.subject, "The subject") ??
    tooLong(message, LIMITS.message, "Your message");
  if (overLong) fieldErrors.message = overLong;

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please check the form.", fieldErrors };
  }

  if (!FORMS_ENABLED.contact) return formsDisabled();
  if (!isSupabaseConfigured) return await notConfigured();

  const limited = await throttled("contact");
  if (limited) return limited;

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

  await notifyContactMessage({ name, email, phone: phone || null, subject: subject || null, message });

  return { status: "success", message: successMessage };
}
