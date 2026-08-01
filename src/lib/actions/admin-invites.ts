"use server";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAdminContext, type AdminContext } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/server";
import { sendInvite, emailConfigured } from "@/lib/email";

export type InviteResult = { ok: boolean; message: string; link?: string };

const INVITE_TTL_DAYS = 7;

/**
 * Only the hash is stored. The raw token exists in the email and nowhere else,
 * so a leaked database backup can't be used to accept an outstanding invite.
 */
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

async function requireInviter() {
  const ctx = await getAdminContext();
  if (!ctx || ctx.profile.status !== "approved" || !ctx.can("users.invite")) {
    return null;
  }
  return ctx;
}

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (raw || "http://localhost:3000").replace(/\/+$/, "");
}

export async function inviteUser(
  emailRaw: string,
  roleKey: string | null,
  fullName: string,
): Promise<InviteResult> {
  const ctx = await requireInviter();
  if (!ctx) return { ok: false, message: "You can't invite people." };

  const email = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, message: "That doesn't look like a valid email address." };
  if (email.length > 254)
    return { ok: false, message: "That email address is too long." };

  const admin = createAdminClient();

  // Already has an account? Inviting again would be confusing — say so.
  const { data: existing } = await admin
    .from("profiles")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();
  if (existing)
    return {
      ok: false,
      message: "That person already has an account — manage them in the list below.",
    };

  let roleId: string | null = null;
  let roleName: string | null = null;
  if (roleKey) {
    const { data: role } = await admin
      .from("roles")
      .select("id, name")
      .eq("key", roleKey)
      .maybeSingle();
    if (!role) return { ok: false, message: "Unknown role." };
    roleId = role.id;
    roleName = role.name;
  }

  // Replace any outstanding invite for this address rather than colliding with
  // the one-live-invite index — re-inviting should just work.
  await admin
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("email", email)
    .is("accepted_at", null)
    .is("revoked_at", null);

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400_000);

  const { data: invite, error } = await admin
    .from("invitations")
    .insert({
      email,
      token_hash: hashToken(token),
      role_id: roleId,
      invited_by: ctx.profile.id,
      invited_name: fullName.trim() || null,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !invite) {
    console.error("invite insert failed", error);
    return { ok: false, message: "Couldn't create the invitation — try again." };
  }

  const link = `${siteUrl()}/admin/invite/${token}`;

  await recordAudit(ctx, "user.invited", {
    entity: "invitation",
    entityId: invite.id,
    detail: { email, role: roleKey ?? "none" },
  });
  revalidatePath("/admin/users");

  if (!emailConfigured()) {
    // No mail configured: hand back the link so the invite still works rather
    // than silently creating one nobody can use.
    return {
      ok: true,
      message: "Invitation created, but email isn't configured — copy the link below and send it yourself.",
      link,
    };
  }

  const sent = await sendInvite({
    to: email,
    link,
    invitedBy: ctx.profile.full_name || ctx.profile.email,
    roleName,
    expiresAt,
  });

  return sent.sent
    ? { ok: true, message: `Invitation sent to ${email}.` }
    : {
        ok: true,
        message: `Invitation created, but the email didn't send (${sent.reason ?? "unknown"}). Copy the link below.`,
        link,
      };
}

export async function revokeInvite(inviteId: string): Promise<InviteResult> {
  const ctx = await requireInviter();
  if (!ctx) return { ok: false, message: "You can't manage invitations." };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invitations")
    .select("email")
    .eq("id", inviteId)
    .maybeSingle();
  if (!invite) return { ok: false, message: "That invitation is already gone." };

  const { error } = await admin
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .is("accepted_at", null);
  if (error) return { ok: false, message: "Couldn't cancel it — try again." };

  await recordAudit(ctx, "user.invite_revoked", {
    entity: "invitation",
    entityId: inviteId,
    detail: { email: invite.email },
  });
  revalidatePath("/admin/users");
  return { ok: true, message: `Invitation for ${invite.email} cancelled.` };
}

export type InviteCheck =
  | { valid: true; email: string; invitedName: string | null }
  | { valid: false; reason: string };

/**
 * Look up an invite by its raw token.
 *
 * Compared with timingSafeEqual on the hashes. The lookup is by hash so the
 * database does the work, but the explicit compare keeps the check constant
 * time even if a future change moves to scanning.
 */
export async function checkInvite(token: string): Promise<InviteCheck> {
  if (!token || token.length > 200) return { valid: false, reason: "That invitation link isn't valid." };

  const hash = hashToken(token);
  const { data: invite } = await createAdminClient()
    .from("invitations")
    .select("id, email, invited_name, token_hash, expires_at, accepted_at, revoked_at")
    .eq("token_hash", hash)
    .maybeSingle();

  if (!invite) return { valid: false, reason: "That invitation link isn't valid." };

  const a = Buffer.from(invite.token_hash);
  const b = Buffer.from(hash);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return { valid: false, reason: "That invitation link isn't valid." };

  if (invite.revoked_at) return { valid: false, reason: "That invitation was cancelled." };
  if (invite.accepted_at) return { valid: false, reason: "That invitation has already been used." };
  if (new Date(invite.expires_at) < new Date())
    return { valid: false, reason: "That invitation has expired. Ask for a new one." };

  return { valid: true, email: invite.email, invitedName: invite.invited_name };
}

/**
 * Accept an invitation: create the account and consume the invite.
 *
 * The user is created through the admin API with the email already confirmed —
 * possession of the emailed link IS the proof of address, and it means public
 * signup can stay switched off at the Supabase project level.
 */
export async function acceptInvite(
  token: string,
  fullName: string,
  password: string,
): Promise<{ ok: boolean; message: string }> {
  const check = await checkInvite(token);
  if (!check.valid) return { ok: false, message: check.reason };

  if (password.length < 10)
    return { ok: false, message: "Use at least 10 characters for your password." };
  if (password.length > 200)
    return { ok: false, message: "That password is too long." };
  if (!fullName.trim())
    return { ok: false, message: "Please give your full name." };

  const admin = createAdminClient();
  const hash = hashToken(token);

  // Re-read inside the mutation and claim the invite FIRST. Two people opening
  // the same link can't both get through: the second update matches no rows.
  const { data: claimed } = await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("token_hash", hash)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .select("id, email, role_id")
    .maybeSingle();

  if (!claimed)
    return { ok: false, message: "That invitation has already been used." };

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: claimed.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName.trim() },
    });

  if (createError || !created.user) {
    // Hand the invite back so a transient failure doesn't burn it.
    await admin.from("invitations").update({ accepted_at: null }).eq("id", claimed.id);
    console.error("acceptInvite createUser failed", createError);
    return {
      ok: false,
      message: createError?.message ?? "Couldn't create your account — try again.",
    };
  }

  // The handle_new_user trigger already made a pending profile. Apply the role
  // the inviter chose; with no role they stay pending and see almost nothing
  // until a super admin grants access.
  await admin
    .from("profiles")
    .update({
      full_name: fullName.trim(),
      role_id: claimed.role_id,
      status: claimed.role_id ? "approved" : "pending",
      approved_at: claimed.role_id ? new Date().toISOString() : null,
    })
    .eq("id", created.user.id);

  // Recorded against the person who accepted, not nobody — "who created this
  // account" is exactly the question the log needs to answer later.
  await recordAudit(
    {
      profile: {
        id: created.user.id,
        email: claimed.email,
        full_name: fullName.trim(),
      } as AdminContext["profile"],
    },
    "user.invite_accepted",
    { entity: "profile", entityId: created.user.id, detail: { email: claimed.email } },
  );

  return {
    ok: true,
    message: claimed.role_id
      ? "Account created — you can sign in now."
      : "Account created. A super admin will grant your access; sign in to check.",
  };
}
