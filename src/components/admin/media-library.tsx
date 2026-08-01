"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Btn } from "@/components/btn";
import { mediaUrl } from "@/lib/media-url";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteMedia,
  updateMediaAlt,
  uploadMedia,
  type MediaItem,
} from "@/lib/actions/admin-media";

function UploadPanel({ onDone }: { onDone?: (item: MediaItem) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose an image first.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("That image is over 10 MB — resize it and try again.");
      return;
    }
    setBusy(true);
    const data = new FormData();
    data.set("file", file);
    data.set("alt", alt);
    const result = await uploadMedia(data);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Uploaded.");
    setAlt("");
    if (fileRef.current) fileRef.current.value = "";
    onDone?.(result.item);
  }

  return (
    <form
      onSubmit={upload}
      className="border-grey-300 flex flex-wrap items-end gap-4 rounded-2xl border border-dashed bg-white p-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="media-file">Image</Label>
        <Input
          id="media-file"
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="max-w-60"
        />
      </div>
      <div className="min-w-56 flex-1 space-y-1.5">
        <Label htmlFor="media-alt">What does it show? (alt text)</Label>
        <Input
          id="media-alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="e.g. Worship at the Sunday gathering"
          required
        />
      </div>
      <Btn type="submit" variant="green" disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <UploadCloud className="size-4" /> Upload
          </>
        )}
      </Btn>
    </form>
  );
}

function MediaCard({
  item,
  canDelete,
  onSelect,
}: {
  item: MediaItem;
  canDelete: boolean;
  onSelect?: (item: MediaItem) => void;
}) {
  const [alt, setAlt] = useState(item.alt);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  return (
    <figure className="border-grey-100 overflow-hidden rounded-2xl border bg-white">
      <button
        type="button"
        onClick={() => onSelect?.(item)}
        disabled={!onSelect}
        className="bg-grey-100 relative block aspect-video w-full enabled:cursor-pointer"
        aria-label={onSelect ? `Use ${item.alt}` : item.alt}
      >
        <Image
          src={mediaUrl(item.path)}
          alt={item.alt}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
      </button>
      <figcaption className="space-y-2 p-3">
        <div className="flex gap-2">
          <Input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            onBlur={() => {
              if (alt.trim() && alt !== item.alt)
                start(async () => {
                  const r = await updateMediaAlt(item.id, alt);
                  if (!r.ok) toast.error(r.message);
                });
            }}
            aria-label="Alt text"
            className="h-8 text-xs"
          />
        </div>
        <div className="text-grey-500 flex items-center justify-between text-[11px]">
          <span>
            {item.width}×{item.height} · {((item.bytes ?? 0) / 1024).toFixed(0)}KB
          </span>
          <span className="flex gap-1">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(mediaUrl(item.path));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              aria-label="Copy image URL"
              className="hover:text-ink p-1"
            >
              {copied ? (
                <Check className="text-green-600 size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
            {canDelete && (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Delete this image? Pages using it will break."))
                    return;
                  start(async () => {
                    const r = await deleteMedia(item.id);
                    if (r.ok) toast.success(r.message);
                    else toast.error(r.message);
                  });
                }}
                aria-label="Delete image"
                className="text-destructive/70 hover:text-destructive p-1"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}

export function MediaLibrary({
  initial,
  canUpload,
  canDelete,
  onSelect,
}: {
  initial: MediaItem[];
  canUpload: boolean;
  canDelete: boolean;
  /** Present when embedded as a picker — clicking an image selects it. */
  onSelect?: (item: MediaItem) => void;
}) {
  const [items, setItems] = useState(initial);

  return (
    <div className="space-y-6">
      {canUpload && (
        <UploadPanel
          onDone={(item) => {
            setItems((prev) => [item, ...prev]);
            onSelect?.(item);
          }}
        />
      )}
      {items.length === 0 ? (
        <p className="text-grey-500 py-10 text-center text-sm">
          Nothing here yet — upload your first image above.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              canDelete={canDelete}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
