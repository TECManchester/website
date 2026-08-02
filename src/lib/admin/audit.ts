import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { AdminContext } from "@/lib/admin/auth";
import type { Json } from "@/lib/supabase/types";

/**
 * The activity trail: who did what, when.
 *
 * Actor name and email are written onto the row rather than joined at read
 * time. Profiles can be deleted, and `actor_id` is a FK that nulls out when
 * they are — which would quietly erase the very thing the log exists to
 * record. Denormalising means the trail survives someone leaving the church.
 *
 * Never throws. A failed audit write must not roll back or fail the action the
 * person was performing; it logs loudly to the server instead.
 */

export type AuditAction =
  // Pages
  | "page.created" | "page.updated" | "page.published" | "page.unpublished"
  | "page.deleted" | "page.restored"
  // Events
  | "event.created" | "event.updated" | "event.deleted"
  // Media
  | "media.uploaded" | "media.updated" | "media.deleted"
  // Announcements
  | "announcement.created" | "announcement.updated" | "announcement.deleted"
  // Settings
  | "settings.updated"
  // People
  | "user.invited" | "user.invite_revoked" | "user.invite_accepted"
  | "user.approved" | "user.rejected" | "user.suspended" | "user.role_changed"
  | "user.password_reset" | "user.signed_up"
  // Roles
  | "role.created" | "role.updated" | "role.deleted"
  // Sensitive reads — who looked at personal data matters as much as who changed it
  | "submissions.giftaid.exported"
  | "submission.status_changed";

export async function recordAudit(
  actor: Pick<AdminContext, "profile"> | null,
  action: AuditAction,
  options: {
    entity?: string;
    entityId?: string;
    detail?: Record<string, unknown>;
  } = {},
): Promise<void> {
  try {
    const { error } = await createAdminClient()
      .from("audit_log")
      .insert({
        actor_id: actor?.profile.id ?? null,
        actor_email: actor?.profile.email ?? null,
        actor_name: actor?.profile.full_name ?? null,
        action,
        entity: options.entity ?? null,
        entity_id: options.entityId ?? null,
        detail: (options.detail ?? {}) as Json,
      });
    if (error) console.error("audit write failed", action, error);
  } catch (error) {
    console.error("audit write threw", action, error);
  }
}

/** How each action reads in the activity log. */
export const AUDIT_LABELS: Record<string, string> = {
  "page.created": "created a page",
  "page.updated": "edited a page",
  "page.published": "published a page",
  "page.unpublished": "unpublished a page",
  "page.deleted": "deleted a page",
  "page.restored": "restored an earlier version of a page",
  "event.created": "added an event",
  "event.updated": "edited an event",
  "event.deleted": "deleted an event",
  "media.uploaded": "uploaded a photo",
  "media.updated": "edited a photo description",
  "media.deleted": "deleted a photo",
  "announcement.created": "created an announcement",
  "announcement.updated": "edited an announcement",
  "announcement.deleted": "deleted an announcement",
  "settings.updated": "changed the church details",
  "user.invited": "invited someone",
  "user.invite_revoked": "cancelled an invitation",
  "user.invite_accepted": "accepted an invitation and created their account",
  "user.approved": "approved someone",
  "user.rejected": "rejected someone",
  "user.suspended": "suspended someone",
  "user.role_changed": "changed someone's role",
  "user.password_reset": "reset their password",
  "user.signed_up": "signed up and is waiting for access",
  "role.created": "created a role",
  "role.updated": "changed what a role can do",
  "role.deleted": "deleted a role",
  "submissions.giftaid.exported": "downloaded the Gift Aid export",
  "submission.status_changed": "updated a submission",
};

export const auditLabel = (action: string): string =>
  AUDIT_LABELS[action] ?? action;
