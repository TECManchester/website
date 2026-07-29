"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/env";
import type { Tables } from "@/lib/supabase/types";

export type MediaItem = Tables<"media">;
export type MediaResult =
  | { ok: true; item: MediaItem }
  | { ok: false; message: string };

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

async function requireCap(cap: string) {
  const ctx = await getAdminContext();
  if (!ctx || ctx.profile.status !== "approved" || !ctx.can(cap)) return null;
  return ctx;
}

/**
 * Upload an image to the media library.
 *
 * Processing is deliberate, not a passthrough: EXIF rotation is applied (phone
 * photos are otherwise sideways), anything over 2560px wide is downscaled, and
 * everything re-encodes to quality-85 JPEG — the phone-camera 8MB originals
 * problem, solved at the door.
 */
export async function uploadMedia(formData: FormData): Promise<MediaResult> {
  const ctx = await requireCap("media.upload");
  if (!ctx) return { ok: false, message: "You can't upload media." };

  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();

  if (!(file instanceof File))
    return { ok: false, message: "Choose an image to upload." };
  if (!alt)
    return {
      ok: false,
      message: "Describe the image (alt text) — it's required for accessibility.",
    };
  if (!ALLOWED.has(file.type))
    return { ok: false, message: "Use a JPEG, PNG or WebP image." };
  if (file.size > MAX_BYTES)
    return { ok: false, message: "Images must be under 10 MB." };

  let buffer: Buffer;
  let width: number;
  let height: number;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const processed = await sharp(input)
      .rotate() // honour EXIF orientation
      .resize({ width: 2560, withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true, progressive: true })
      .toBuffer({ resolveWithObject: true });
    buffer = processed.data;
    width = processed.info.width;
    height = processed.info.height;
  } catch {
    return { ok: false, message: "That file doesn't look like a valid image." };
  }

  const stamp = Date.now().toString(36);
  const safeName = file.name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "image";
  const path = `${new Date().getFullYear()}/${safeName}-${stamp}.jpg`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("media")
    .upload(path, buffer, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (uploadError) {
    console.error("storage upload failed", uploadError);
    return { ok: false, message: "Upload failed — try again." };
  }

  const url = `${supabaseUrl()}/storage/v1/object/public/media/${path}`;
  const { data, error } = await admin
    .from("media")
    .insert({
      path,
      url,
      alt,
      width,
      height,
      bytes: buffer.length,
      mime: "image/jpeg",
      created_by: ctx.profile.id,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("media insert failed", error);
    return { ok: false, message: "Upload failed — try again." };
  }

  revalidatePath("/admin/media");
  return { ok: true, item: data };
}

export async function listMedia(): Promise<MediaItem[]> {
  const ctx = await requireCap("media.view");
  if (!ctx) return [];
  const { data } = await createAdminClient()
    .from("media")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function updateMediaAlt(
  id: string,
  alt: string,
): Promise<{ ok: boolean; message: string }> {
  const ctx = await requireCap("media.upload");
  if (!ctx) return { ok: false, message: "You can't edit media." };
  if (!alt.trim()) return { ok: false, message: "Alt text can't be empty." };

  const { error } = await createAdminClient()
    .from("media")
    .update({ alt: alt.trim() })
    .eq("id", id);
  if (error) return { ok: false, message: "Couldn't save — try again." };
  revalidatePath("/admin/media");
  return { ok: true, message: "Description saved." };
}

export async function deleteMedia(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  const ctx = await requireCap("media.delete");
  if (!ctx) return { ok: false, message: "You can't delete media." };

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("media")
    .select("path")
    .eq("id", id)
    .maybeSingle();
  if (!item) return { ok: false, message: "Already gone." };

  const { error: storageError } = await admin.storage
    .from("media")
    .remove([item.path]);
  if (storageError) console.error("storage remove failed", storageError);

  const { error } = await admin.from("media").delete().eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete — try again." };

  revalidatePath("/admin/media");
  return {
    ok: true,
    message:
      "Deleted. Anywhere still using this image will show a broken picture — replace it there too.",
  };
}
