"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Status changes for the submissions inbox. Each kind is guarded by its own
 * capability — the whole point of the pastoral/finance role split.
 */

const KIND_TABLE = {
  contact: "contact_messages",
  prayer: "prayer_requests",
  visit: "visit_plans",
} as const;

const KIND_CAP: Record<keyof typeof KIND_TABLE, string> = {
  contact: "submissions.contact.view",
  prayer: "submissions.prayer.view",
  visit: "submissions.contact.view",
};

export type SubmissionKind = keyof typeof KIND_TABLE;

export async function setSubmissionStatus(
  kind: SubmissionKind,
  id: string,
  status: "new" | "in_progress" | "done" | "archived",
): Promise<{ ok: boolean; message: string }> {
  const ctx = await getAdminContext();
  if (
    !ctx ||
    ctx.profile.status !== "approved" ||
    !ctx.can(KIND_CAP[kind])
  )
    return { ok: false, message: "You can't manage these submissions." };

  const { error } = await createAdminClient()
    .from(KIND_TABLE[kind])
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error("setSubmissionStatus failed", error);
    return { ok: false, message: "Couldn't update — try again." };
  }

  revalidatePath("/admin/submissions");
  return { ok: true, message: "Updated." };
}
