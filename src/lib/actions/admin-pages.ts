"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { getAdminContext } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/server";
import { RESERVED_SLUGS, slugify, type EditorBlock } from "@/lib/blocks";
import type { Json } from "@/lib/supabase/types";

function actionFailure(where: string, error: unknown): {
  ok: false;
  message: string;
} {
  // redirect()/notFound() signal via a thrown sentinel — rethrow it, or the
  // catch turns a successful redirect into a silent failure.
  unstable_rethrow(error);
  console.error(`${where} threw`, error);
  const name = error instanceof Error ? error.message : String(error);
  return { ok: false, message: `Something went wrong (${name.slice(0, 120)}).` };
}

export type PageActionResult =
  | { ok: true; message: string; id?: string; slug?: string; updatedAt?: string }
  | { ok: false; message: string; conflict?: boolean };

async function requireCap(cap: string) {
  const ctx = await getAdminContext();
  if (!ctx || ctx.profile.status !== "approved" || !ctx.can(cap)) return null;
  return ctx;
}

function validSlug(slug: string): string | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return "Lowercase letters, numbers and hyphens only.";
  if (RESERVED_SLUGS.has(slug)) return "That URL is reserved by the site.";
  return null;
}

export async function checkSlug(
  raw: string,
  excludePageId?: string,
): Promise<{ slug: string; available: boolean; reason?: string }> {
  const slug = slugify(raw);
  const invalid = slug ? validSlug(slug) : "Type a title first.";
  if (invalid) return { slug, available: false, reason: invalid };

  const ctx = await requireCap("pages.view");
  if (!ctx) return { slug, available: false, reason: "No permission." };

  let query = createAdminClient().from("pages").select("id").eq("slug", slug);
  if (excludePageId) query = query.neq("id", excludePageId);
  const { data } = await query.maybeSingle();
  return data
    ? { slug, available: false, reason: "Already used by another page." }
    : { slug, available: true };
}

async function createPageInner(
  title: string,
  rawSlug: string,
): Promise<PageActionResult> {
  const ctx = await requireCap("pages.create");
  if (!ctx) return { ok: false, message: "You can't create pages." };

  const cleanTitle = title.trim();
  if (!cleanTitle) return { ok: false, message: "Give the page a title." };
  const slug = slugify(rawSlug || cleanTitle);
  const invalid = validSlug(slug);
  if (invalid) return { ok: false, message: invalid };

  const admin = createAdminClient();
  const { data: clash } = await admin
    .from("pages").select("id").eq("slug", slug).maybeSingle();
  if (clash) return { ok: false, message: "That URL is already in use." };

  const { data: page, error } = await admin
    .from("pages")
    .insert({ slug, title: cleanTitle, created_by: ctx.profile.id })
    .select("id")
    .single();
  if (error || !page) {
    console.error("createPage failed", error);
    return { ok: false, message: "Couldn't create the page — try again." };
  }

  // Start with a header block so the editor never opens empty.
  await admin.from("blocks").insert({
    page_id: page.id,
    sort: 0,
    type: "page-hero",
    draft: { eyebrow: "", title: cleanTitle, lead: "" } as unknown as Json,
  });

  await recordAudit(ctx, "page.created", {
    entity: "page", entityId: page.id, detail: { title: cleanTitle, slug },
  });

  // Redirect from the server: the client-side router.push after this action
  // wasn't navigating, leaving people stranded on the form.
  redirect(`/admin/pages/${page.id}`);
}

async function savePageDraftInner(input: {
  pageId: string;
  title: string;
  description: string;
  slug: string;
  blocks: EditorBlock[];
  /** Optimistic lock: the updated_at the editor loaded. */
  baseUpdatedAt: string;
}): Promise<PageActionResult> {
  const ctx = await requireCap("pages.edit");
  if (!ctx) return { ok: false, message: "You can't edit pages." };

  const admin = createAdminClient();
  const { data: page } = await admin
    .from("pages")
    .select("id, slug, status, is_system, updated_at")
    .eq("id", input.pageId)
    .maybeSingle();
  if (!page) return { ok: false, message: "Page not found." };

  if (page.updated_at !== input.baseUpdatedAt)
    return {
      ok: false,
      conflict: true,
      message:
        "Someone saved this page after you opened it. Copy anything important, reload, and re-apply.",
    };

  const slug = page.is_system ? page.slug : slugify(input.slug || page.slug);
  if (!page.is_system) {
    const invalid = validSlug(slug);
    if (invalid) return { ok: false, message: invalid };
    if (slug !== page.slug) {
      const { data: clash } = await admin
        .from("pages").select("id").eq("slug", slug).neq("id", page.id).maybeSingle();
      if (clash) return { ok: false, message: "That URL is already in use." };
    }
  }

  // Snapshot the current draft for undo before replacing it.
  const { data: current } = await admin
    .from("blocks")
    .select("type, draft, sort")
    .eq("page_id", page.id)
    .order("sort");
  await admin.from("page_revisions").insert({
    page_id: page.id,
    snapshot: (current ?? []) as unknown as Json,
    created_by: ctx.profile.id,
  });

  // Replace draft blocks wholesale — published copies live on the new rows.
  const { data: published } = await admin
    .from("blocks")
    .select("sort, published")
    .eq("page_id", page.id)
    .order("sort");
  const publishedBySort = new Map(
    (published ?? []).map((b) => [b.sort, b.published]),
  );

  await admin.from("blocks").delete().eq("page_id", page.id);
  if (input.blocks.length > 0) {
    const { error: insertError } = await admin.from("blocks").insert(
      input.blocks.map((block, i) => ({
        page_id: page.id,
        sort: i,
        type: block.type,
        draft: block.data as unknown as Json,
        // Keep the published copy that used to live at this position, so a
        // draft edit doesn't unpublish content mid-flight.
        published: (publishedBySort.get(i) ?? null) as Json,
      })),
    );
    if (insertError) {
      console.error("savePageDraft insert failed", insertError);
      return { ok: false, message: "Couldn't save — try again." };
    }
  }

  const { data: updated, error } = await admin
    .from("pages")
    .update({ title: input.title.trim() || page.slug, description: input.description.trim() || null, slug })
    .eq("id", page.id)
    .select("updated_at")
    .single();
  if (error || !updated) {
    console.error("savePageDraft page update failed", error);
    return { ok: false, message: "Couldn't save — try again." };
  }

  // A renamed published page leaves a forwarding address.
  if (slug !== page.slug && page.status === "published") {
    await admin.from("redirects").upsert({ from_slug: page.slug, to_slug: slug });
    revalidatePath(`/${page.slug}`);
  }

  await recordAudit(ctx, "page.updated", {
    entity: "page", entityId: page.id, detail: { title: input.title.trim(), slug },
  });

  revalidatePath(`/${slug}`);
  return {
    ok: true,
    message: "Draft saved.",
    slug,
    updatedAt: updated.updated_at,
  };
}

async function publishPageInner(pageId: string): Promise<PageActionResult> {
  const ctx = await requireCap("pages.publish");
  if (!ctx) return { ok: false, message: "You can't publish pages." };

  const admin = createAdminClient();
  const { data: page } = await admin
    .from("pages").select("slug").eq("id", pageId).maybeSingle();
  if (!page) return { ok: false, message: "Page not found." };

  const { data: blocks } = await admin
    .from("blocks").select("id, draft").eq("page_id", pageId);
  for (const block of blocks ?? []) {
    await admin.from("blocks").update({ published: block.draft }).eq("id", block.id);
  }

  const { data: updated, error } = await admin
    .from("pages")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", pageId)
    .select("updated_at")
    .single();
  if (error) return { ok: false, message: "Couldn't publish — try again." };

  await recordAudit(ctx, "page.published", {
    entity: "page", entityId: pageId, detail: { slug: page.slug },
  });

  revalidatePath(`/${page.slug}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Published — the page is live.", updatedAt: updated?.updated_at };
}

export async function unpublishPage(pageId: string): Promise<PageActionResult> {
  const ctx = await requireCap("pages.publish");
  if (!ctx) return { ok: false, message: "You can't publish pages." };

  const admin = createAdminClient();
  const { data: page } = await admin
    .from("pages").select("slug, is_system").eq("id", pageId).maybeSingle();
  if (!page) return { ok: false, message: "Page not found." };
  if (page.is_system)
    return { ok: false, message: "System pages can't be unpublished." };

  const { data: updated, error } = await admin
    .from("pages")
    .update({ status: "draft" })
    .eq("id", pageId)
    .select("updated_at")
    .single();
  if (error) return { ok: false, message: "Couldn't unpublish — try again." };

  await recordAudit(ctx, "page.unpublished", {
    entity: "page", entityId: pageId, detail: { slug: page.slug },
  });

  revalidatePath(`/${page.slug}`);
  return { ok: true, message: "Unpublished — the page now 404s.", updatedAt: updated?.updated_at };
}

export async function deletePage(pageId: string): Promise<PageActionResult> {
  const ctx = await requireCap("pages.delete");
  if (!ctx) return { ok: false, message: "You can't delete pages." };

  const admin = createAdminClient();
  const { data: page } = await admin
    .from("pages").select("slug, is_system").eq("id", pageId).maybeSingle();
  if (!page) return { ok: false, message: "Already gone." };
  if (page.is_system)
    return { ok: false, message: "System pages can't be deleted." };

  const { error } = await admin.from("pages").delete().eq("id", pageId);
  if (error) return { ok: false, message: "Couldn't delete — try again." };

  await recordAudit(ctx, "page.deleted", {
    entity: "page", entityId: pageId, detail: { slug: page.slug },
  });

  revalidatePath(`/${page.slug}`);
  return { ok: true, message: "Page deleted." };
}

export async function restoreRevision(
  pageId: string,
  revisionId: string,
): Promise<PageActionResult> {
  const ctx = await requireCap("pages.edit");
  if (!ctx) return { ok: false, message: "You can't edit pages." };

  const admin = createAdminClient();
  const { data: revision } = await admin
    .from("page_revisions")
    .select("snapshot")
    .eq("id", revisionId)
    .eq("page_id", pageId)
    .maybeSingle();
  if (!revision) return { ok: false, message: "Revision not found." };

  const snapshot = (revision.snapshot ?? []) as {
    type: string;
    draft: Json;
    sort: number;
  }[];

  await admin.from("blocks").delete().eq("page_id", pageId);
  if (snapshot.length > 0) {
    await admin.from("blocks").insert(
      snapshot.map((block, i) => ({
        page_id: pageId,
        sort: i,
        type: block.type,
        draft: block.draft,
      })),
    );
  }
  const { data: updated } = await admin
    .from("pages")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", pageId)
    .select("updated_at")
    .single();

  await recordAudit(ctx, "page.restored", {
    entity: "page", entityId: pageId, detail: { revisionId },
  });

  return {
    ok: true,
    message: "Revision restored to draft. Publish to make it live.",
    updatedAt: updated?.updated_at,
  };
}

export async function savePageDraft(
  ...args: Parameters<typeof savePageDraftInner>
): Promise<PageActionResult> {
  try {
    return await savePageDraftInner(...args);
  } catch (error) {
    return actionFailure("savePageDraft", error);
  }
}

export async function publishPage(
  ...args: Parameters<typeof publishPageInner>
): Promise<PageActionResult> {
  try {
    return await publishPageInner(...args);
  } catch (error) {
    return actionFailure("publishPage", error);
  }
}

export async function createPage(
  ...args: Parameters<typeof createPageInner>
): Promise<PageActionResult> {
  try {
    return await createPageInner(...args);
  } catch (error) {
    return actionFailure("createPage", error);
  }
}
