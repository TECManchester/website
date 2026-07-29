import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BlockRenderer } from "@/components/block-renderer";
import { RESERVED_SLUGS } from "@/lib/blocks";
import { createPublicClient } from "@/lib/supabase/server";

/**
 * Admin-built pages. Static routes always win over this dynamic segment, so
 * code pages are never shadowed; RLS only exposes published pages and
 * published block copies, so drafts cannot leak here.
 */

async function getPublishedPage(slug: string) {
  const supabase = createPublicClient();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, title, description")
    .eq("slug", slug)
    .maybeSingle();
  if (!page) return null;

  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, type, published")
    .eq("page_id", page.id)
    .order("sort");

  return {
    page,
    blocks: (blocks ?? []).map((b) => ({
      id: b.id,
      type: b.type,
      data: (b.published ?? {}) as Record<string, unknown>,
    })),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) return {};
  const result = await getPublishedPage(slug);
  if (!result) return {};
  return {
    title: result.page.title,
    description: result.page.description ?? undefined,
    alternates: { canonical: `/${result.page.slug}` },
  };
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) notFound();

  const result = await getPublishedPage(slug);
  if (!result) {
    // A renamed page leaves a forwarding address.
    const { data: r } = await createPublicClient()
      .from("redirects")
      .select("to_slug")
      .eq("from_slug", slug)
      .maybeSingle();
    if (r) redirect(`/${r.to_slug}`);
    notFound();
  }

  return <BlockRenderer blocks={result.blocks} />;
}
