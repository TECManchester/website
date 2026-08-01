/**
 * Resolve a stored image reference to a URL.
 *
 * Images used to be stored as absolute Supabase URLs — in `media.url` and, more
 * awkwardly, baked into the JSON of every page block that used one. That made
 * the storage provider impossible to change without rewriting content rows.
 *
 * Stored values are now bucket-relative paths ("2026/worship-abc123.jpg") and
 * the origin is applied here, at render time. Absolute URLs are passed through
 * unchanged so everything created before this still works — no data migration,
 * no broken images, and moving providers becomes a config change rather than a
 * content rewrite.
 *
 * Safe on the client: NEXT_PUBLIC_SUPABASE_URL is in the browser bundle already.
 */
export function mediaUrl(stored: string | null | undefined): string {
  const value = (stored ?? "").trim();
  if (!value) return "";

  // Legacy absolute URL, or an image hosted somewhere else entirely.
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:")) return value;

  const origin = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  if (!origin) return value;

  const path = value.replace(/^\/+/, "");
  return `${origin}/storage/v1/object/public/media/${path}`;
}
