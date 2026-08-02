"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Btn } from "@/components/btn";
import { ConfirmDialog, useConfirm } from "@/components/admin/confirm-dialog";
import { MediaPicker } from "@/components/admin/media-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "@/lib/actions/admin-announcements";
import { utcIsoToLondonNaive } from "@/lib/london-time";
import type { Tables } from "@/lib/supabase/types";

type Announcement = Tables<"announcements">;

export function AnnouncementForm({
  announcement,
}: {
  announcement?: Announcement;
}) {
  const router = useRouter();
  const editing = Boolean(announcement);
  const [image, setImage] = useState<string | null>(
    announcement?.image_url ?? null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const confirmDelete = useConfirm();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const data = new FormData(e.currentTarget);
    data.set("image_url", image ?? "");
    const result = editing
      ? await updateAnnouncement(announcement!.id, data)
      : await createAnnouncement(data);
    setBusy(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.push("/admin/announcements");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="an-title">Title</Label>
        <Input
          id="an-title"
          name="title"
          defaultValue={announcement?.title ?? ""}
          required
        />
        {errors.title && (
          <p className="text-destructive text-xs">{errors.title}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="an-body">Message</Label>
        <Textarea
          id="an-body"
          name="body"
          rows={5}
          defaultValue={announcement?.body ?? ""}
          required
        />
        {errors.body && <p className="text-destructive text-xs">{errors.body}</p>}
      </div>

      <MediaPicker
        label="Image (optional)"
        value={image}
        onChange={(url) => setImage(url)}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="an-cta-label">Button label (optional)</Label>
          <Input
            id="an-cta-label"
            name="cta_label"
            defaultValue={announcement?.cta_label ?? ""}
            placeholder="Find out more"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="an-cta-url">Button link</Label>
          <Input
            id="an-cta-url"
            name="cta_url"
            defaultValue={announcement?.cta_url ?? ""}
            placeholder="/events/… or https://…"
          />
          {errors.cta_url && (
            <p className="text-destructive text-xs">{errors.cta_url}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="an-starts">Show from (optional)</Label>
          <Input
            id="an-starts"
            name="starts_at"
            type="datetime-local"
            defaultValue={
              announcement?.starts_at
                ? utcIsoToLondonNaive(announcement.starts_at)
                : ""
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="an-ends">Until (optional)</Label>
          <Input
            id="an-ends"
            name="ends_at"
            type="datetime-local"
            defaultValue={
              announcement?.ends_at
                ? utcIsoToLondonNaive(announcement.ends_at)
                : ""
            }
          />
          {errors.ends_at && (
            <p className="text-destructive text-xs">{errors.ends_at}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="an-dismiss">Re-show after (hours)</Label>
          <Input
            id="an-dismiss"
            name="dismiss_hours"
            type="number"
            min={1}
            max={720}
            defaultValue={announcement?.dismiss_hours ?? 24}
          />
          {errors.dismiss_hours && (
            <p className="text-destructive text-xs">{errors.dismiss_hours}</p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={announcement?.is_active ?? false}
          className="size-4"
        />
        Active — turning this on retires any other active announcement
      </label>

      <div className="flex items-center gap-3 pt-2">
        <Btn type="submit" variant="green" size="lg" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : editing ? (
            "Save announcement"
          ) : (
            "Create announcement"
          )}
        </Btn>
        {editing && (
          <Btn
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={confirmDelete.ask}
          >
            <Trash2 className="size-4" /> Delete
          </Btn>
        )}
      </div>
      <ConfirmDialog
        {...confirmDelete.dialogProps}
        title="Delete this announcement?"
        body="It will stop showing on the site immediately. This can't be undone."
        confirmLabel="Delete announcement"
        onConfirm={async () => {
          confirmDelete.setBusy(true);
          const result = await deleteAnnouncement(announcement!.id);
          confirmDelete.setBusy(false);
          confirmDelete.close();
          if (result.ok) {
            toast.success(result.message);
            router.push("/admin/announcements");
            router.refresh();
          } else toast.error(result.message);
        }}
      />
    </form>
  );
}
