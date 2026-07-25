"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { contact as contactDetails } from "@/lib/church";

export type FormState = {
  status: "idle" | "success" | "error";
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
function notConfigured(): FormState {
  return {
    status: "error",
    message: `Our form isn't connected yet — sorry. Please email us at ${contactDetails.email} and we'll pick it up from there.`,
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

  if (!isSupabaseConfigured) return notConfigured();

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
      message: `Something went wrong our end. Please email ${contactDetails.email} and we'll make sure it's prayed for.`,
    };
  }

  return {
    status: "success",
    message:
      "Thank you — we've received your request and our prayer team will be praying.",
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

  if (!isSupabaseConfigured) return notConfigured();

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
      message: `Something went wrong our end. Please email ${contactDetails.email} directly.`,
    };
  }

  return {
    status: "success",
    message: "Thank you — we've got your message and we'll be in touch soon.",
  };
}
