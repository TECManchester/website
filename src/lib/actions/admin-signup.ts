"use server";

import { recordAudit } from "@/lib/admin/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";
import { sendMagicLink, emailConfigured } from "@/lib/email";

/**
 * Self sign-up, by magic link.
 *
 * Anyone can ask for an account, but asking gets them nothing: the account is
 * created with no role and status 'pending', so they can see the dashboard and
 * literally nothing else until a super admin grants permissions. The magic link
 * is what proves they own the address — no password is chosen until they've
 * clicked it.
 *
 * Public signup stays disabled at the Supabase project, so this server action
 * is the only route in and every account is created deliberately, by us.
 */

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (raw || "http://localhost:3000").replace(/\/+$/, "");
}

export async function requestAccess(
  fullNameRaw: string,
  emailRaw: string,
  honeypot: string,
): Promise<{ ok: boolean; message: string }> {
  const email = emailRaw.trim().toLowerCase();
  const fullName = fullNameRaw.trim().slice(0, 120);

  /*
   * One answer for every outcome — new account, existing account, send
   * failure. Otherwise this form tells a stranger which addresses are
   * registered.
   */
  const sameAnswer = {
    ok: true,
    message:
      "Check your email. If we can set an account up for that address, there's a link on its way — it expires in an hour.",
  };

  // Bots fill hidden fields. Answer as though it worked.
  if (honeypot.trim()) return sameAnswer;

  if (!fullName) {
    return { ok: false, message: "Please tell us your name." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, message: "That doesn't look like a valid email address." };
  }

  const { allowed, retryAfterSeconds } = await checkRateLimit("signup", {
    max: 5,
    windowSeconds: 900,
  });
  if (!allowed) {
    const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    return {
      ok: false,
      message: `That's a few attempts in a short time. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  if (!emailConfigured()) {
    console.error("sign-up requested but email is not configured");
    return {
      ok: false,
      message:
        "We can't send sign-up emails at the moment. Please contact the communications team directly.",
    };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!existing) {
    /*
     * email_confirm is set here because the emailed link is the actual proof of
     * ownership — the account is unusable until it's clicked (no password) and
     * carries no permissions even then. Someone typing a stranger's address
     * achieves nothing except sending that stranger one rate-limited email.
     */
    const { error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) {
      console.error("signup createUser failed", error);
      return sameAnswer;
    }
    // The handle_new_user trigger creates the profile as pending with no role.
    await admin.from("profiles").update({ full_name: fullName }).eq("email", email);
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data.properties?.hashed_token) {
    console.error("signup generateLink failed", error);
    return sameAnswer;
  }

  const link = `${siteUrl()}/admin/welcome?token_hash=${encodeURIComponent(
    data.properties.hashed_token,
  )}`;
  await sendMagicLink({ to: email, link, isNew: !existing });

  if (!existing) {
    await recordAudit(null, "user.signed_up", {
      entity: "profile",
      detail: { email, name: fullName },
    });
  }

  return sameAnswer;
}
