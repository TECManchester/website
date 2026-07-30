import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BlockRenderer } from "@/components/block-renderer";
import { PreviewFrame } from "@/components/admin/preview-frame";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Preview" };

/**
 * Draft preview — renders the DRAFT copies with the real public renderer, so
 * what you see is what publish will produce. Admin-only by layout + here.
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Outside the (protected) group — no sidebar — so it does its own gate.
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (ctx.profile.status !== "approved" || !ctx.can("pages.view"))
    redirect("/admin/pages");

  const { id } = await params;
  const admin = createAdminClient();
  const [{ data: page }, { data: blocks }] = await Promise.all([
    admin.from("pages").select("title, slug, status").eq("id", id).maybeSingle(),
    admin.from("blocks").select("id, type, draft").eq("page_id", id).order("sort"),
  ]);
  if (!page) notFound();

  return (
    <PreviewFrame title={page.title} backHref={`/admin/pages/${id}`}>
      <BlockRenderer
        blocks={(blocks ?? []).map((b) => ({
          id: b.id,
          type: b.type,
          data: (b.draft ?? {}) as Record<string, unknown>,
        }))}
      />
    </PreviewFrame>
  );
}
