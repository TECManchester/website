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

  // The dashboard explains the pending state properly now, and a pending user
  // can't reach anything else — a banner on top of that is just noise.
  const blocked =
    ctx.profile.status === "rejected" || ctx.profile.status === "suspended";

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar
        capabilities={ctx.capabilities}
        userName={ctx.profile.full_name || ctx.profile.email}
        roleName={
          ctx.profile.roles?.name ??
          (ctx.profile.status === "pending" ? "Awaiting access" : "No access")
        }
      />
      <div className="min-w-0 flex-1">
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
