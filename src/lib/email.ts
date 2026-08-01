import "server-only";

import { Resend } from "resend";

/**
 * Transactional email.
 *
 * Two rules hold everywhere in here:
 *
 *  1. Sending NEVER throws into the caller. A prayer request that saved fine
 *     must not report failure because Resend had a bad minute — the record is
 *     already safe in the database and the admin inbox will show it.
 *  2. Nothing is sent unless it's configured. Missing keys log once and no-op,
 *     rather than crashing a form in production.
 */

type SendResult = { sent: boolean; reason?: string };

const from = () => process.env.EMAIL_FROM?.trim() ?? "";
const generalInbox = () => process.env.EMAIL_TO?.trim() ?? "";

/**
 * Where prayer requests go. Deliberately separate from the general inbox:
 * prayer requests are pastoral confidences and shouldn't land in whatever
 * shared mailbox handles enquiries. Falls back only if no dedicated one exists.
 */
const prayerInbox = () =>
  process.env.PRAYER_INBOX?.trim() || generalInbox();

export const emailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY?.trim() && from());

let client: Resend | null = null;
function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

async function send(options: {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}): Promise<SendResult> {
  const api = resend();
  if (!api) return { sent: false, reason: "RESEND_API_KEY is not set" };
  if (!from()) return { sent: false, reason: "EMAIL_FROM is not set" };
  if (!options.to) return { sent: false, reason: "no recipient configured" };

  try {
    const { error } = await api.emails.send({
      from: from(),
      to: options.to,
      subject: options.subject,
      replyTo: options.replyTo,
      text: options.body,
      html: htmlShell(options.subject, options.body),
    });
    if (error) {
      console.error("resend send failed", error);
      return { sent: false, reason: error.message };
    }
    return { sent: true };
  } catch (error) {
    console.error("resend send threw", error);
    return { sent: false, reason: String(error) };
  }
}

/**
 * Plain-text content wrapped in minimal HTML.
 *
 * Everything is escaped — submission text is attacker-controlled, and an
 * unescaped message body in an HTML email is a live injection into whatever
 * webmail client the team opens it in.
 */
function htmlShell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f5f4;font-family:ui-sans-serif,system-ui,sans-serif;color:#1c1c1a">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px">
<h1 style="margin:0 0 16px;font-size:18px;color:#1c1c1a">${escapeHtml(title)}</h1>
<div style="font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(body)}</div>
<p style="margin:24px 0 0;font-size:12px;color:#78716c">Elevation Church Manchester</p>
</div></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ------------------------------------------------------------------ */
/* The messages we actually send                                       */
/* ------------------------------------------------------------------ */

export async function sendInvite(options: {
  to: string;
  link: string;
  invitedBy: string;
  roleName: string | null;
  expiresAt: Date;
}): Promise<SendResult> {
  const expires = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(options.expiresAt);

  return send({
    to: options.to,
    subject: "You've been invited to the Elevation Manchester website admin",
    body: [
      `${options.invitedBy} has invited you to help manage the Elevation Church Manchester website.`,
      "",
      "Set your password and finish setting up your account here:",
      options.link,
      "",
      options.roleName
        ? `You'll start with the "${options.roleName}" role.`
        : "You'll start with no access — a super admin will grant your permissions once you've signed in.",
      "",
      `This link expires on ${expires} and can only be used once.`,
      "",
      "If you weren't expecting this, you can ignore it — no account is created until the link is used.",
    ].join("\n"),
  });
}

export async function sendPasswordReset(options: {
  to: string;
  link: string;
}): Promise<SendResult> {
  return send({
    to: options.to,
    subject: "Reset your Elevation Manchester admin password",
    body: [
      "Someone asked to reset the password for this account.",
      "",
      "Set a new password here:",
      options.link,
      "",
      "The link expires in an hour and can only be used once.",
      "",
      "If this wasn't you, ignore this email — your password hasn't changed.",
    ].join("\n"),
  });
}

export async function notifyPrayerRequest(options: {
  name: string | null;
  email: string | null;
  phone: string | null;
  request: string;
  isUrgent: boolean;
  shareWithTeam: boolean;
}): Promise<SendResult> {
  return send({
    to: prayerInbox(),
    replyTo: options.email ?? undefined,
    subject: options.isUrgent
      ? "URGENT prayer request"
      : "New prayer request",
    body: [
      options.isUrgent ? "*** MARKED URGENT ***\n" : "",
      `From: ${options.name || "Anonymous"}`,
      `Email: ${options.email || "not given"}`,
      `Phone: ${options.phone || "not given"}`,
      `Share with the wider prayer team: ${options.shareWithTeam ? "yes" : "no — keep confidential"}`,
      "",
      "Request:",
      options.request,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function notifyContactMessage(options: {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
}): Promise<SendResult> {
  return send({
    to: generalInbox(),
    replyTo: options.email,
    subject: options.subject
      ? `Website enquiry: ${options.subject}`
      : "New website enquiry",
    body: [
      `From: ${options.name}`,
      `Email: ${options.email}`,
      `Phone: ${options.phone || "not given"}`,
      "",
      options.message,
    ].join("\n"),
  });
}

export async function notifyGiftAid(options: {
  name: string;
  postcode: string;
}): Promise<SendResult> {
  return send({
    to: generalInbox(),
    subject: "New Gift Aid declaration",
    body: [
      `${options.name} (${options.postcode}) has made a Gift Aid declaration.`,
      "",
      // Deliberately no personal detail beyond this: the full record lives in
      // the admin behind the finance role, and email is not the place for it.
      "The full declaration is in the admin under Submissions → Gift Aid.",
    ].join("\n"),
  });
}
