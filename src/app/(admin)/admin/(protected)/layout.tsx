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
  if (ctx.profile.status !== "approved") redirect("/admin/pending");

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar
        capabilities={ctx.capabilities}
        userName={ctx.profile.full_name || ctx.profile.email}
        roleName={ctx.profile.roles?.name ?? "No role"}
      />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-5xl px-6 py-10 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
