import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit announcement" };

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("announcements.manage")) redirect("/admin/announcements");

  const { id } = await params;
  const { data } = await createAdminClient()
    .from("announcements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  return (
    <>
      <p className="eyebrow">Announcements</p>
      <h1 className="mt-2 mb-8 text-3xl font-bold">Edit announcement</h1>
      <AnnouncementForm announcement={data} />
    </>
  );
}
