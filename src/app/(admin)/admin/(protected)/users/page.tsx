import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, SlidersHorizontal } from "lucide-react";
import { InvitePanel, type PendingInvite } from "@/components/admin/invite-panel";
import {
  ApproveControls,
  MemberControls,
  ReinstateControls,
} from "@/components/admin/user-row-actions";
import { getAdminContext, type AdminProfile } from "@/lib/admin/auth";
import { describeCapabilities } from "@/lib/admin/capabilities";
import { createAdminClient } from "@/lib/supabase/server";
import { createAuthClient } from "@/lib/supabase/server-auth";

export const metadata: Metadata = { title: "Users" };

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/London",
});

function UserCard({
  profile,
  children,
}: {
  profile: AdminProfile;
  children: React.ReactNode;
}) {
  return (
    <li className="border-grey-100 flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-ink truncate font-semibold">
          {profile.full_name || "—"}
        </p>
        <p className="text-grey-500 truncate text-sm">{profile.email}</p>
        <p className="text-grey-500 mt-1 text-xs">
          Joined {dateFmt.format(new Date(profile.created_at))}
          {profile.roles && ` · ${profile.roles.name}`}
        </p>
        <p className="text-grey-500 mt-0.5 text-xs">
          Can see: {profile.roles ? describeCapabilities(profile.roles.capabilities) : "No access yet"}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}

export default async function UsersPage() {
  const ctx = (await getAdminContext())!;

  if (!ctx.can("users.approve")) {
    return (
      <div className="border-grey-100 rounded-2xl border bg-white p-10 text-center">
        <ShieldAlert className="text-grey-500 mx-auto size-8" />
        <h1 className="text-ink mt-4 text-lg font-bold">No access</h1>
        <p className="text-grey-500 mt-1 text-sm">
          Your role doesn&apos;t include user management.
        </p>
      </div>
    );
  }

  // Read as the signed-in user — the approver RLS policy is what grants this.
  const supabase = await createAuthClient();
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, roles(*)")
      .order("created_at", { ascending: false }),
    supabase.from("roles").select("key, name").order("name"),
  ]);

  // Outstanding invitations, for the invite panel.
  let invites: PendingInvite[] = [];
  if (ctx.can("users.invite")) {
    const { data } = await createAdminClient()
      .from("invitations")
      .select("id, email, expires_at, roles(name), profiles!invitations_invited_by_fkey(full_name, email)")
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    invites = (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      roleName: row.roles?.name ?? null,
      invitedByName: row.profiles?.full_name ?? row.profiles?.email ?? null,
      expiresAt: row.expires_at,
    }));
  }

  const all = (profiles ?? []) as AdminProfile[];
  const roleOptions = roles ?? [];
  const pending = all.filter((p) => p.status === "pending");
  const approved = all.filter((p) => p.status === "approved");
  const inactive = all.filter(
    (p) => p.status === "rejected" || p.status === "suspended",
  );

  return (
    <>
      <p className="eyebrow">Users</p>
      <h1 className="mt-2 text-3xl font-bold">People &amp; access</h1>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <p className="text-grey-500 max-w-2xl">
          Invite people, decide what each person can see and do, and remove
          access when they move on. Every change here is recorded in the
          activity log.
        </p>
        {ctx.can("roles.manage") && (
          <Link
            href="/admin/roles"
            className="border-grey-300 hover:border-green-600 hover:text-green-600 font-heading inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
          >
            <SlidersHorizontal className="size-4" /> Roles &amp; permissions
          </Link>
        )}
      </div>

      {ctx.can("users.invite") && (
        <div className="mt-8">
          <InvitePanel roles={roleOptions} invites={invites} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-heading text-ink text-lg font-bold">
          Waiting for access
          {pending.length > 0 && (
            <span className="bg-green text-ink ml-2.5 rounded-full px-2.5 py-0.5 text-xs font-bold">
              {pending.length}
            </span>
          )}
        </h2>
        {pending.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {pending.map((profile) => (
              <UserCard key={profile.id} profile={profile}>
                <ApproveControls userId={profile.id} roles={roleOptions} />
              </UserCard>
            ))}
          </ul>
        ) : (
          <p className="text-grey-500 mt-3 text-sm">
            Nobody waiting. People who accept an invitation without a role
            appear here until you give them one.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-ink text-lg font-bold">Team</h2>
        <ul className="mt-4 space-y-3">
          {approved.map((profile) => (
            <UserCard key={profile.id} profile={profile}>
              <MemberControls
                userId={profile.id}
                currentRoleKey={profile.roles?.key ?? null}
                roles={roleOptions}
                isSelf={profile.id === ctx.profile.id}
              />
            </UserCard>
          ))}
        </ul>
      </section>

      {inactive.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-ink text-lg font-bold">
            Rejected &amp; suspended
          </h2>
          <ul className="mt-4 space-y-3">
            {inactive.map((profile) => (
              <UserCard key={profile.id} profile={profile}>
                <ReinstateControls userId={profile.id} roles={roleOptions} />
              </UserCard>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
