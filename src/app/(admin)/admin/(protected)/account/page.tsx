import type { Metadata } from "next";
import { PasswordForm } from "@/components/admin/password-form";
import { getAdminContext } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const ctx = (await getAdminContext())!;

  return (
    <>
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-3xl font-bold">Your details</h1>

      <div className="border-grey-100 mt-8 rounded-2xl border bg-white p-6">
        <dl className="grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-grey-500 text-xs font-semibold tracking-wide uppercase">
              Name
            </dt>
            <dd className="text-ink mt-1 font-medium">
              {ctx.profile.full_name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-grey-500 text-xs font-semibold tracking-wide uppercase">
              Email
            </dt>
            <dd className="text-ink mt-1 font-medium">{ctx.profile.email}</dd>
          </div>
          <div>
            <dt className="text-grey-500 text-xs font-semibold tracking-wide uppercase">
              Role
            </dt>
            <dd className="text-ink mt-1 font-medium">
              {ctx.profile.roles?.name ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-grey-100 mt-6 rounded-2xl border bg-white p-6">
        <h2 className="font-heading text-ink text-lg font-bold">
          Change password
        </h2>
        <p className="text-grey-500 mt-1 mb-5 text-sm">
          If you were given a temporary password, change it here now.
        </p>
        <PasswordForm />
      </div>
    </>
  );
}
