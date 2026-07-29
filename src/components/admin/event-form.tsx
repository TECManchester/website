"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Btn } from "@/components/btn";
import { MediaPicker } from "@/components/admin/media-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@/lib/actions/admin-events";
import { utcIsoToLondonNaive } from "@/lib/london-time";
import type { ChurchEvent } from "@/lib/events";

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-grey-500 text-xs">{hint}</p>}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export function EventForm({ event }: { event?: ChurchEvent }) {
  const router = useRouter();
  const editing = Boolean(event);

  const startNaive = event ? utcIsoToLondonNaive(event.starts_at) : "";
  const endNaive = event?.ends_at ? utcIsoToLondonNaive(event.ends_at) : "";

  const [title, setTitle] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [timeTbc, setTimeTbc] = useState(event?.time_tbc ?? false);
  const [image, setImage] = useState<string | null>(event?.image_url ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const autoSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const data = new FormData(e.currentTarget);
    data.set("image_url", image ?? "");
    const result = editing
      ? await updateEvent(event!.id, data)
      : await createEvent(data);
    setBusy(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.push("/admin/events");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Title" htmlFor="ev-title" error={errors.title}>
          <Input
            id="ev-title"
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(autoSlug(e.target.value));
            }}
            required
          />
        </Field>
        <Field
          label="URL slug"
          htmlFor="ev-slug"
          error={errors.slug}
          hint={`Public page: /events/${slug || "…"}`}
        >
          <Input
            id="ev-slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(autoSlug(e.target.value));
            }}
          />
        </Field>
      </div>

      <Field
        label="One-line summary"
        htmlFor="ev-summary"
        hint="Shown on the event card and under the title."
      >
        <Input id="ev-summary" name="summary" defaultValue={event?.summary ?? ""} />
      </Field>

      <Field
        label="Full description"
        htmlFor="ev-description"
        hint="Blank line between paragraphs."
      >
        <Textarea
          id="ev-description"
          name="description"
          rows={7}
          defaultValue={event?.description ?? ""}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Date" htmlFor="ev-date" error={errors.date}>
          <Input
            id="ev-date"
            name="date"
            type="date"
            defaultValue={startNaive.slice(0, 10)}
            required
          />
        </Field>
        <Field label="Start time" htmlFor="ev-start" error={errors.start_time}>
          <Input
            id="ev-start"
            name="start_time"
            type="time"
            defaultValue={timeTbc ? "" : startNaive.slice(11, 16)}
            disabled={timeTbc}
          />
        </Field>
        <Field label="End time (optional)" htmlFor="ev-end">
          <Input
            id="ev-end"
            name="end_time"
            type="time"
            defaultValue={endNaive.slice(11, 16)}
            disabled={timeTbc}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="time_tbc"
          checked={timeTbc}
          onChange={(e) => setTimeTbc(e.target.checked)}
          className="size-4"
        />
        Time to be confirmed — the site shows &ldquo;Time to be confirmed&rdquo;
        instead of a start time
      </label>

      <Field
        label="Venue"
        htmlFor="ev-venue"
        hint="Leave blank to use the regular church venue."
      >
        <Input id="ev-venue" name="venue" defaultValue={event?.venue ?? ""} />
      </Field>

      <MediaPicker
        label="Event image (flyer)"
        value={image}
        onChange={(url) => setImage(url)}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Button label (optional)"
          htmlFor="ev-cta-label"
          hint="e.g. Register now"
        >
          <Input
            id="ev-cta-label"
            name="cta_label"
            defaultValue={event?.cta_label ?? ""}
          />
        </Field>
        <Field label="Button link" htmlFor="ev-cta-url" error={errors.cta_url}>
          <Input
            id="ev-cta-url"
            name="cta_url"
            defaultValue={event?.cta_url ?? ""}
            placeholder="https://…"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={event?.is_published ?? true}
            className="size-4"
          />
          Published — visible on the site
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={event?.is_featured ?? false}
            className="size-4"
          />
          Featured
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Btn type="submit" variant="green" size="lg" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : editing ? (
            "Save event"
          ) : (
            "Create event"
          )}
        </Btn>
        {editing && (
          <Btn
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              if (!confirm("Delete this event? This can't be undone.")) return;
              const result = await deleteEvent(event!.id);
              if (result.ok) {
                toast.success(result.message);
                router.push("/admin/events");
                router.refresh();
              } else toast.error(result.message);
            }}
          >
            <Trash2 className="size-4" /> Delete
          </Btn>
        )}
      </div>
    </form>
  );
}
