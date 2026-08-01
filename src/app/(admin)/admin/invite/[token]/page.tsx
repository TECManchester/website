import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/logo";
import { AcceptInviteForm } from "@/components/admin/accept-invite-form";
import { checkInvite } from "@/lib/actions/admin-invites";

export const metadata: Metadata = {
  title: "Accept your invitation",
  // An invite link is a bearer credential — keep it out of search engines.
  robots: { index: false, follow: false },
};

/**
 * Invitation acceptance. Reachable while signed out (proxy.ts lets this path
 * through), because by definition the person doesn't have an account yet.
 */
export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await checkInvite(token);

  return (
    <main className="bg-ink relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <span className="brand-glow top-[-180px] right-[-120px] size-[560px]" />
      <span className="brand-glow bottom-[-220px] left-[-140px] size-[480px] opacity-60" />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <Logo tone="white" />
        </div>

        <div className="shadow-card-lg rounded-2xl bg-white p-8">
          {invite.valid ? (
            <AcceptInviteForm
              token={token}
              email={invite.email}
              invitedName={invite.invitedName}
            />
          ) : (
            <div className="text-center">
              <span className="bg-gold/15 mx-auto grid size-12 place-items-center rounded-2xl">
                <ShieldAlert className="text-gold size-6" />
              </span>
              <h1 className="text-ink mt-4 text-xl font-bold">
                This link won&apos;t work
              </h1>
              <p className="text-grey-500 mt-2 text-sm leading-relaxed">
                {invite.reason}
              </p>
              <p className="text-grey-500 mt-4 text-sm">
                Ask whoever invited you to send a new one, or{" "}
                <Link href="/admin/login" className="text-green-600 underline">
                  sign in
                </Link>{" "}
                if you already have an account.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
