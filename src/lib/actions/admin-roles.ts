"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { isKnownCapability } from "@/lib/admin/capabilities";
import { createAdminClient } from "@/lib/supabase/server";

export type RoleResult = { ok: boolean; message: string; id?: string };

async function requireRoleManager() {
  const ctx = await getAdminContext();
  if (!ctx || ctx.profile.status !== "approved" || !ctx.can("roles.manage")) {
    return null;
  }
  return ctx;
}

/**
 * Only capabilities in the catalogue are accepted.
 *
 * Without this, a crafted request could store an arbitrary string — including
 * 'all', which is the wildcard `can()` treats as full access. Whitelisting is
 * what stops the role editor becoming a privilege-escalation tool.
 */
function cleanCapabilities(input: string[]): string[] {
  return [...new Set(input.filter(isKnownCapability))].sort();
}

function slugifyKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function createRole(
  name: string,
  description: string,
  capabilities: string[],
): Promise<RoleResult> {
  const ctx = await requireRoleManager();
  if (!ctx) return { ok: false, message: "You can't manage roles." };

  const cleanName = name.trim();
  if (!cleanName) return { ok: false, message: "Give the role a name." };
  if (cleanName.length > 60)
    return { ok: false, message: "That name is too long." };

  const key = slugifyKey(cleanName);
  if (!key) return { ok: false, message: "Use letters or numbers in the name." };

  const admin = createAdminClient();
  const { data: clash } = await admin
    .from("roles").select("id").eq("key", key).maybeSingle();
  if (clash) return { ok: false, message: "A role with that name already exists." };

  const caps = cleanCapabilities(capabilities);
  const { data: role, error } = await admin
    .from("roles")
    .insert({
      key,
      name: cleanName,
      description: description.trim().slice(0, 300) || null,
      capabilities: caps,
      is_system: false,
    })
    .select("id")
    .single();

  if (error || !role) {
    console.error("createRole failed", error);
    return { ok: false, message: "Couldn't create the role — try again." };
  }

  await recordAudit(ctx, "role.created", {
    entity: "role",
    entityId: role.id,
    detail: { name: cleanName, capabilities: caps },
  });
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  return { ok: true, message: `"${cleanName}" created.`, id: role.id };
}

export async function updateRole(
  roleId: string,
  name: string,
  description: string,
  capabilities: string[],
): Promise<RoleResult> {
  const ctx = await requireRoleManager();
  if (!ctx) return { ok: false, message: "You can't manage roles." };

  const admin = createAdminClient();
  const { data: role } = await admin
    .from("roles")
    .select("id, key, name, capabilities, is_system")
    .eq("id", roleId)
    .maybeSingle();
  if (!role) return { ok: false, message: "Role not found." };

  /*
   * Super admin is the recovery path. If its capabilities could be edited,
   * one mistake could leave the church with nobody able to grant access and no
   * way back in without database surgery.
   */
  if (role.key === "super_admin")
    return {
      ok: false,
      message: "Super admin always has full access — that can't be changed.",
    };

  const cleanName = name.trim();
  if (!cleanName) return { ok: false, message: "Give the role a name." };

  const caps = cleanCapabilities(capabilities);
  const { error } = await admin
    .from("roles")
    .update({
      // Renaming a built-in role is fine; its key is what code depends on.
      name: cleanName,
      description: description.trim().slice(0, 300) || null,
      capabilities: caps,
    })
    .eq("id", roleId);

  if (error) {
    console.error("updateRole failed", error);
    return { ok: false, message: "Couldn't save — try again." };
  }

  const added = caps.filter((c) => !role.capabilities.includes(c));
  const removed = role.capabilities.filter((c) => !caps.includes(c));

  await recordAudit(ctx, "role.updated", {
    entity: "role",
    entityId: roleId,
    detail: { name: cleanName, added, removed },
  });
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  return { ok: true, message: `"${cleanName}" saved.` };
}

export async function deleteRole(roleId: string): Promise<RoleResult> {
  const ctx = await requireRoleManager();
  if (!ctx) return { ok: false, message: "You can't manage roles." };

  const admin = createAdminClient();
  const { data: role } = await admin
    .from("roles")
    .select("id, key, name, is_system")
    .eq("id", roleId)
    .maybeSingle();
  if (!role) return { ok: false, message: "Already gone." };
  if (role.is_system)
    return { ok: false, message: "Built-in roles can't be deleted." };

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", roleId);
  if ((count ?? 0) > 0)
    return {
      ok: false,
      message: `${count} ${count === 1 ? "person is" : "people are"} using this role — move them first.`,
    };

  const { error } = await admin.from("roles").delete().eq("id", roleId);
  if (error) return { ok: false, message: "Couldn't delete — try again." };

  await recordAudit(ctx, "role.deleted", {
    entity: "role",
    entityId: roleId,
    detail: { name: role.name },
  });
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  return { ok: true, message: `"${role.name}" deleted.` };
}
