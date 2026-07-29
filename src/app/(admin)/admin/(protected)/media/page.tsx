import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { MediaLibrary } from "@/components/admin/media-library";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Media" };

export default async function AdminMediaPage() {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("media.view")) {
    return (
      <div className="border-grey-100 rounded-2xl border bg-white p-10 text-center">
        <ShieldAlert className="text-grey-500 mx-auto size-8" />
        <p className="text-grey-500 mt-3 text-sm">
          Your role doesn&apos;t include the media library.
        </p>
      </div>
    );
  }

  const { data } = await createAdminClient()
    .from("media")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <p className="eyebrow">Media</p>
      <h1 className="mt-2 text-3xl font-bold">Media library</h1>
      <p className="text-grey-500 mt-2 mb-8">
        Images uploaded here can be used on events, announcements and pages.
        They&apos;re resized and optimised automatically.
      </p>
      <MediaLibrary
        initial={data ?? []}
        canUpload={ctx.can("media.upload")}
        canDelete={ctx.can("media.delete")}
      />
    </>
  );
}
