"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Mail, X } from "lucide-react";
import { Btn } from "@/components/btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteUser, revokeInvite } from "@/lib/actions/admin-invites";

export type PendingInvite = {
  id: string;
  email: string;
  roleName: string | null;
  invitedByName: string | null;
  expiresAt: string;
};

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/London",
});

export function InvitePanel({
  roles,
  invites,
}: {
  roles: { key: string; name: string }[];
  invites: PendingInvite[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="border-grey-100 rounded-2xl border bg-white p-5">
      <h2 className="font-heading text-ink flex items-center gap-2 text-lg font-bold">
        <Mail className="text-green-600 size-4.5" /> Invite someone
      </h2>
      <p className="text-grey-500 mt-1 text-sm">
        They&apos;ll get an email with a link to set their own password. Leave
        the role blank to give them no access until you decide.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-fullname">Their name (optional)</Label>
          <Input
            id="invite-fullname"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Starting role</Label>
          <select
            id="invite-role"
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            className="border-grey-300 h-10 w-full rounded-lg border bg-white px-3 text-sm"
          >
            <option value="">No access yet</option>
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <Btn
          type="button"
          variant="green"
          disabled={pending || !email.trim()}
          onClick={() =>
            start(async () => {
              const result = await inviteUser(email, roleKey || null, fullName);
              if (!result.ok) {
                toast.error(result.message);
                return;
              }
              toast.success(result.message);
              setLink(result.link ?? null);
              setEmail("");
              setFullName("");
              setRoleKey("");
              router.refresh();
            })
          }
        >
          Send invite
        </Btn>
      </div>

      {link && (
        <div className="bg-grey-50 mt-4 rounded-xl p-3">
          <p className="text-grey-500 text-xs">
            Send this link to them yourself — it works once and expires in 7
            days.
          </p>
          <div className="mt-2 flex gap-2">
            <code className="border-grey-100 min-w-0 flex-1 truncate rounded-lg border bg-white px-3 py-2 text-xs">
              {link}
            </code>
            <Btn
              type="button"
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? (
                <>
                  <Check className="text-green-600 size-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Copy
                </>
              )}
            </Btn>
          </div>
        </div>
      )}

      {invites.length > 0 && (
        <div className="mt-6">
          <h3 className="font-heading text-ink text-sm font-bold">
            Waiting to be accepted
          </h3>
          <ul className="mt-2 space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="border-grey-100 flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-ink truncate text-sm font-medium">
                    {invite.email}
                  </p>
                  <p className="text-grey-500 text-xs">
                    {invite.roleName ?? "No access yet"}
                    {invite.invitedByName && ` · invited by ${invite.invitedByName}`}
                    {" · expires "}
                    {dateFmt.format(new Date(invite.expiresAt))}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await revokeInvite(invite.id);
                      if (r.ok) {
                        toast.success(r.message);
                        router.refresh();
                      } else toast.error(r.message);
                    })
                  }
                  aria-label={`Cancel the invitation for ${invite.email}`}
                  className="text-grey-500 hover:text-destructive shrink-0 p-1.5 transition"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
