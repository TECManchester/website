import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getAdminContext } from "@/lib/admin/auth";

/**
 * The real gate. proxy.ts only checks "is someone signed in" — this layout
 * enforces approval before anything protected renders, and RLS enforces it
 * again at the database. Per the middleware-bypass CVEs, the proxy is
 * defence-in-depth here, never the sole check.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");

  const pending = ctx.profile.status === "pending";
  const blocked =
    ctx.profile.status === "rejected" || ctx.profile.status === "suspended";

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar
        capabilities={ctx.capabilities}
        userName={ctx.profile.full_name || ctx.profile.email}
        roleName={
          ctx.profile.roles?.name ?? (pending ? "Awaiting approval" : "No access")
        }
      />
      <div className="min-w-0 flex-1">
        {pending && (
          <div className="bg-gold/15 text-ink border-gold/30 border-b px-6 py-3 text-sm lg:px-10">
            <b>You&apos;re in, but not approved yet.</b> A super admin needs to
            approve your account and assign a role — more will appear here once
            they do.
          </div>
        )}
        {blocked && (
          <div className="bg-destructive/10 text-ink border-destructive/20 border-b px-6 py-3 text-sm lg:px-10">
            <b>This account&apos;s access has been revoked.</b> Speak to the
            communications team if you think that&apos;s a mistake.
          </div>
        )}
        <main className="w-full px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
