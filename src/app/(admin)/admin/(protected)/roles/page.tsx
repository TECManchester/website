import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoleEditor, type EditableRole } from "@/components/admin/role-editor";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Roles & permissions" };

export default async function RolesPage() {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("roles.manage")) redirect("/admin/users");

  const admin = createAdminClient();
  const [{ data: roles }, { data: profiles }] = await Promise.all([
    admin.from("roles").select("*").order("name"),
    admin.from("profiles").select("role_id"),
  ]);

  const counts = new Map<string, number>();
  for (const p of profiles ?? []) {
    if (p.role_id) counts.set(p.role_id, (counts.get(p.role_id) ?? 0) + 1);
  }

  const editable: EditableRole[] = (roles ?? []).map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    capabilities: r.capabilities,
    is_system: r.is_system,
    memberCount: counts.get(r.id) ?? 0,
  }));

  return (
    <>
      <p className="eyebrow">People</p>
      <h1 className="mt-2 text-3xl font-bold">Roles &amp; permissions</h1>
      <p className="text-grey-500 mt-2 max-w-2xl">
        A role is a bundle of permissions. Tick what people with that role are
        allowed to see and do — the tabs down the side of the admin appear and
        disappear to match. Everyone assigned the role gets the change straight
        away.
      </p>

      <div className="mt-8">
        <RoleEditor roles={editable} />
      </div>
    </>
  );
}
