import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock3, ShieldX } from "lucide-react";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { getAdminContext } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Awaiting approval" };

/**
 * Holding screen for signed-in users who aren't approved yet (or were
 * rejected/suspended). Approved users are bounced straight into the admin.
 */
export default async function PendingPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (ctx.profile.status === "approved") redirect("/admin");

  const rejected =
    ctx.profile.status === "rejected" || ctx.profile.status === "suspended";

  return (
    <main className="bg-ink relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <span className="brand-glow top-[-180px] right-[-120px] size-[560px]" />

      <div className="relative w-full max-w-[440px] text-center">
        <div className="mb-8 flex justify-center">
          <Logo tone="white" />
        </div>

        <div className="shadow-card-lg rounded-2xl bg-white p-10">
          <span
            className={
              rejected
                ? "bg-destructive/10 mx-auto grid size-14 place-items-center rounded-2xl"
                : "bg-green-100 mx-auto grid size-14 place-items-center rounded-2xl"
            }
          >
            {rejected ? (
              <ShieldX className="text-destructive size-7" />
            ) : (
              <Clock3 className="text-green-600 size-7" />
            )}
          </span>

          <h1 className="text-ink mt-5 text-xl font-bold">
            {rejected ? "Access not available" : "Waiting for approval"}
          </h1>
          <p className="text-grey-500 mt-2 text-sm leading-relaxed">
            {rejected
              ? "This account doesn't currently have admin access. If you think that's a mistake, speak to the communications team."
              : `Signed in as ${ctx.profile.email}. A super admin needs to approve your account and assign a role before you can continue — check back soon.`}
          </p>

          <div className="mt-7 flex justify-center">
            <SignOutButton />
          </div>
        </div>
      </div>
    </main>
  );
}
