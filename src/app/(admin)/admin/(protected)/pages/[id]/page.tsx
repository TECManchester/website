import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CanvasEditor } from "@/components/admin/canvas-editor";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { BlockType } from "@/lib/blocks";

export const metadata: Metadata = { title: "Edit page" };

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("pages.edit")) redirect("/admin/pages");

  const { id } = await params;
  const admin = createAdminClient();
  const [{ data: page }, { data: blocks }, { data: revisions }] =
    await Promise.all([
      admin.from("pages").select("*").eq("id", id).maybeSingle(),
      admin.from("blocks").select("id, type, draft").eq("page_id", id).order("sort"),
      admin
        .from("page_revisions")
        .select("id, created_at")
        .eq("page_id", id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
  if (!page) notFound();

  return (
    <CanvasEditor
        page={page}
      initialBlocks={(blocks ?? []).map((b) => ({
          id: b.id,
          type: b.type as BlockType,
          data: (b.draft ?? {}) as Record<string, unknown>,
        }))}
        revisions={revisions ?? []}
      canPublish={ctx.can("pages.publish")}
      canDelete={ctx.can("pages.delete")}
    />
  );
}
