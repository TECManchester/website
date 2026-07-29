import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import {
  ApproveControls,
  MemberControls,
  ReinstateControls,
} from "@/components/admin/user-row-actions";
import { getAdminContext, type AdminProfile } from "@/lib/admin/auth";
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
          Requested {dateFmt.format(new Date(profile.created_at))}
          {profile.roles && ` · ${profile.roles.name}`}
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
      <p className="text-grey-500 mt-2">
        Approve requests, assign roles, and manage who can do what. Every change
        here is recorded in the audit log.
      </p>

      <section className="mt-10">
        <h2 className="font-heading text-ink text-lg font-bold">
          Access requests
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
            Nothing waiting. New sign-ups appear here for approval.
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
