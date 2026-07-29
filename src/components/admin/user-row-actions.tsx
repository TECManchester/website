"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  approveUser,
  changeUserRole,
  rejectUser,
  suspendUser,
  type ActionResult,
} from "@/lib/actions/admin-users";
import { Btn } from "@/components/btn";
import { cn } from "@/lib/utils";

type RoleOption = { key: string; name: string };

function useAction() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const result = await fn();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  return { pending, run };
}

/** Approve-with-role for pending requests. */
export function ApproveControls({
  userId,
  roles,
}: {
  userId: string;
  roles: RoleOption[];
}) {
  const [roleKey, setRoleKey] = useState("");
  const { pending, run } = useAction();

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <select
        value={roleKey}
        onChange={(e) => setRoleKey(e.target.value)}
        aria-label="Role to assign"
        className="border-grey-300 focus-visible:outline-green-600 h-10 rounded-lg border bg-white px-3 text-sm focus-visible:outline-2"
      >
        <option value="">Assign a role…</option>
        {roles.map((role) => (
          <option key={role.key} value={role.key}>
            {role.name}
          </option>
        ))}
      </select>
      <Btn
        variant="green"
        disabled={pending || !roleKey}
        onClick={() => run(() => approveUser(userId, roleKey))}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Approve"}
      </Btn>
      <Btn
        variant="ghost"
        disabled={pending}
        onClick={() => run(() => rejectUser(userId))}
      >
        Reject
      </Btn>
    </div>
  );
}

/** Role change + suspend for existing members. */
export function MemberControls({
  userId,
  currentRoleKey,
  roles,
  isSelf,
}: {
  userId: string;
  currentRoleKey: string | null;
  roles: RoleOption[];
  isSelf: boolean;
}) {
  const { pending, run } = useAction();

  if (isSelf) {
    return (
      <p className="text-grey-500 text-xs">
        You — manage your details under Account.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", pending && "opacity-60")}>
      <select
        value={currentRoleKey ?? ""}
        onChange={(e) => run(() => changeUserRole(userId, e.target.value))}
        disabled={pending}
        aria-label="Change role"
        className="border-grey-300 focus-visible:outline-green-600 h-10 rounded-lg border bg-white px-3 text-sm focus-visible:outline-2"
      >
        {roles.map((role) => (
          <option key={role.key} value={role.key}>
            {role.name}
          </option>
        ))}
      </select>
      <Btn
        variant="ghost"
        disabled={pending}
        onClick={() => run(() => suspendUser(userId))}
      >
        Suspend
      </Btn>
    </div>
  );
}

/** Re-approve for rejected/suspended accounts. */
export function ReinstateControls({
  userId,
  roles,
}: {
  userId: string;
  roles: RoleOption[];
}) {
  return <ApproveControls userId={userId} roles={roles} />;
}
