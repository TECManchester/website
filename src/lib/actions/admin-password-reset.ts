"use server";

import { getAdminContext } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPasswordReset, emailConfigured } from "@/lib/email";

/**
 * Password reset.
 *
 * Deliberately does NOT use Supabase's own recovery email: that goes through
 * their built-in SMTP, which is heavily rate limited and on new projects only
 * delivers to team addresses. Instead we mint the recovery token with the admin
 * API and deliver it ourselves through Resend, the same path every other email
 * takes.
 *
 * The link carries `token_hash` and is verified in-app with verifyOtp, so the
 * whole flow stays on our domain rather than bouncing through Supabase's
 * redirect with tokens in the URL fragment.
 */

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (raw || "http://localhost:3000").replace(/\/+$/, "");
}

export async function requestPasswordReset(
  emailRaw: string,
): Promise<{ ok: boolean; message: string }> {
  const email = emailRaw.trim().toLowerCase();

  /*
   * One message for every outcome — unknown address, known address, send
   * failure. Anything else turns this form into a way to discover which
   * addresses have accounts.
   */
  const sameAnswer = {
    ok: true,
    message:
      "If that address has an account, a reset link is on its way. It expires in an hour.",
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return sameAnswer;
  }

  const { allowed } = await checkRateLimit("password-reset", {
    max: 5,
    windowSeconds: 900,
  });
  if (!allowed) {
    return {
      ok: false,
      message: "Too many reset attempts. Please wait a few minutes and try again.",
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (!profile) return sameAnswer;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error || !data.properties?.hashed_token) {
    console.error("generateLink failed", error);
    return sameAnswer;
  }

  if (!emailConfigured()) {
    console.error("password reset requested but email is not configured");
    return sameAnswer;
  }

  const link = `${siteUrl()}/admin/reset-password?token_hash=${encodeURIComponent(
    data.properties.hashed_token,
  )}`;
  await sendPasswordReset({ to: email, link });

  return sameAnswer;
}

/** Recorded after the fact, once we know who actually changed their password. */
export async function recordPasswordReset(): Promise<void> {
  const ctx = await getAdminContext();
  if (ctx) await recordAudit(ctx, "user.password_reset", { entity: "profile", entityId: ctx.profile.id });
}
