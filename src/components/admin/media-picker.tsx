"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Btn } from "@/components/btn";
import { MediaLibrary } from "@/components/admin/media-library";
import { listMedia, type MediaItem } from "@/lib/actions/admin-media";

/**
 * "Choose image" field: shows the current selection, opens the media library
 * in an overlay to change it. Value is the public URL (what content stores).
 */
export function MediaPicker({
  value,
  alt,
  onChange,
  canUpload = true,
  label = "Image",
}: {
  value: string | null;
  alt?: string;
  onChange: (url: string | null, alt: string) => void;
  canUpload?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[] | null>(null);

  async function openPicker() {
    setOpen(true);
    if (items === null) setItems(await listMedia());
  }

  return (
    <div>
      <p className="text-ink mb-1.5 text-sm font-medium">{label}</p>
      {value ? (
        <div className="border-grey-100 relative w-full max-w-sm overflow-hidden rounded-xl border">
          <div className="bg-grey-100 relative aspect-video">
            <Image src={value} alt={alt ?? ""} fill sizes="384px" className="object-cover" />
          </div>
          <div className="flex gap-2 p-2">
            <Btn type="button" variant="ghost" size="default" onClick={openPicker}>
              Change
            </Btn>
            <Btn type="button" variant="ghost" onClick={() => onChange(null, "")}>
              Remove
            </Btn>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="border-grey-300 text-grey-500 hover:border-green-600 hover:text-green-600 flex aspect-video w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-white text-sm transition"
        >
          <ImagePlus className="size-6" />
          Choose from the media library
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Media library"
          className="bg-ink/60 fixed inset-0 z-200 overflow-y-auto p-4 backdrop-blur-sm sm:p-10"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-ink text-lg font-bold">
                Choose an image
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-grey-500 hover:text-ink p-1"
              >
                <X className="size-5" />
              </button>
            </div>
            {items === null ? (
              <p className="text-grey-500 py-10 text-center text-sm">Loading…</p>
            ) : (
              <MediaLibrary
                initial={items}
                canUpload={canUpload}
                canDelete={false}
                onSelect={(item) => {
                  onChange(item.url, item.alt);
                  setOpen(false);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
