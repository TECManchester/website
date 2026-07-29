import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewPageForm } from "@/components/admin/new-page-form";
import { getAdminContext } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "New page" };

export default async function NewPagePage() {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("pages.create")) redirect("/admin/pages");
  return (
    <>
      <p className="eyebrow">Pages</p>
      <h1 className="mt-2 mb-8 text-3xl font-bold">New page</h1>
      <NewPageForm />
    </>
  );
}
