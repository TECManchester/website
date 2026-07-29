"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type ActionResult = { ok: boolean; message: string };

/**
 * User management actions.
 *
 * Every mutation: verify the actor's capability server-side, apply with the
 * service client, write the audit log, revalidate. The capability check here
 * is belt; RLS on profiles is braces.
 */

async function requireApprover() {
  const ctx = await getAdminContext();
  if (!ctx || ctx.profile.status !== "approved" || !ctx.can("users.approve")) {
    return null;
  }
  return ctx;
}

async function audit(
  actorId: string,
  action: string,
  entityId: string,
  detail: Json,
) {
  const { error } = await createAdminClient().from("audit_log").insert({
    actor_id: actorId,
    action,
    entity: "profile",
    entity_id: entityId,
    detail,
  });
  if (error) console.error("audit_log insert failed", error);
}

export async function approveUser(
  userId: string,
  roleKey: string,
): Promise<ActionResult> {
  const ctx = await requireApprover();
  if (!ctx) return { ok: false, message: "You don't have permission to do that." };

  const admin = createAdminClient();

  const { data: role } = await admin
    .from("roles")
    .select("id, name")
    .eq("key", roleKey)
    .maybeSingle();
  if (!role) return { ok: false, message: "Choose a role before approving." };

  const { error } = await admin
    .from("profiles")
    .update({
      status: "approved",
      role_id: role.id,
      approved_at: new Date().toISOString(),
      approved_by: ctx.profile.id,
    })
    .eq("id", userId);

  if (error) {
    console.error("approveUser failed", error);
    return { ok: false, message: "Something went wrong — try again." };
  }

  await audit(ctx.profile.id, "user.approved", userId, { role: roleKey });
  revalidatePath("/admin/users");
  return { ok: true, message: `Approved as ${role.name}.` };
}

export async function rejectUser(userId: string): Promise<ActionResult> {
  const ctx = await requireApprover();
  if (!ctx) return { ok: false, message: "You don't have permission to do that." };
  if (userId === ctx.profile.id)
    return { ok: false, message: "You can't reject your own account." };

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ status: "rejected", role_id: null })
    .eq("id", userId);

  if (error) {
    console.error("rejectUser failed", error);
    return { ok: false, message: "Something went wrong — try again." };
  }

  await audit(ctx.profile.id, "user.rejected", userId, {});
  revalidatePath("/admin/users");
  return { ok: true, message: "Access request rejected." };
}

export async function suspendUser(userId: string): Promise<ActionResult> {
  const ctx = await requireApprover();
  if (!ctx) return { ok: false, message: "You don't have permission to do that." };
  if (userId === ctx.profile.id)
    return { ok: false, message: "You can't suspend your own account." };

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ status: "suspended" })
    .eq("id", userId);

  if (error) {
    console.error("suspendUser failed", error);
    return { ok: false, message: "Something went wrong — try again." };
  }

  await audit(ctx.profile.id, "user.suspended", userId, {});
  revalidatePath("/admin/users");
  return { ok: true, message: "Account suspended." };
}

export async function changeUserRole(
  userId: string,
  roleKey: string,
): Promise<ActionResult> {
  const ctx = await requireApprover();
  if (!ctx) return { ok: false, message: "You don't have permission to do that." };
  if (userId === ctx.profile.id)
    return { ok: false, message: "You can't change your own role." };

  const admin = createAdminClient();
  const { data: role } = await admin
    .from("roles")
    .select("id, name")
    .eq("key", roleKey)
    .maybeSingle();
  if (!role) return { ok: false, message: "Unknown role." };

  const { error } = await admin
    .from("profiles")
    .update({ role_id: role.id })
    .eq("id", userId);

  if (error) {
    console.error("changeUserRole failed", error);
    return { ok: false, message: "Something went wrong — try again." };
  }

  await audit(ctx.profile.id, "user.role_changed", userId, { role: roleKey });
  revalidatePath("/admin/users");
  return { ok: true, message: `Role changed to ${role.name}.` };
}
