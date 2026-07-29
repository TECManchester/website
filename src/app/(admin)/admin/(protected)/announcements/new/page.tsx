import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { getAdminContext } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "New announcement" };

export default async function NewAnnouncementPage() {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("announcements.manage")) redirect("/admin/announcements");
  return (
    <>
      <p className="eyebrow">Announcements</p>
      <h1 className="mt-2 mb-8 text-3xl font-bold">New announcement</h1>
      <AnnouncementForm />
    </>
  );
}
