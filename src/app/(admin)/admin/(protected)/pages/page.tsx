import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Lock, Plus, ShieldAlert } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { SYSTEM_ROUTES } from "@/lib/blocks";

export const metadata: Metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("pages.view")) {
    return (
      <div className="border-grey-100 rounded-2xl border bg-white p-10 text-center">
        <ShieldAlert className="text-grey-500 mx-auto size-8" />
        <p className="text-grey-500 mt-3 text-sm">
          Your role doesn&apos;t include pages.
        </p>
      </div>
    );
  }

  const { data } = await createAdminClient()
    .from("pages")
    .select("id, slug, title, status, updated_at")
    .eq("is_system", false)
    .order("updated_at", { ascending: false });
  const pages = data ?? [];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Pages</p>
          <h1 className="mt-2 text-3xl font-bold">Pages</h1>
          <p className="text-grey-500 mt-2">
            Build new pages from sections, hold them in draft, preview, and
            publish when ready.
          </p>
        </div>
        {ctx.can("pages.create") && (
          <BtnLink href="/admin/pages/new" variant="green">
            <Plus className="size-4" /> New page
          </BtnLink>
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-heading text-ink text-lg font-bold">Your pages</h2>
        {pages.length === 0 ? (
          <div className="border-grey-100 mt-4 rounded-2xl border border-dashed bg-white p-10 text-center">
            <FileText className="text-grey-500 mx-auto size-7" />
            <p className="text-grey-500 mt-3 text-sm">
              No custom pages yet — create your first.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {pages.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/pages/${p.id}`}
                  className="border-grey-100 hover:shadow-card flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 transition"
                >
                  <div className="min-w-0">
                    <p className="text-ink truncate font-semibold">
                      {p.title}
                      <span
                        className={
                          p.status === "published"
                            ? "bg-green text-ink ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase"
                            : "bg-grey-100 text-grey-500 ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase"
                        }
                      >
                        {p.status}
                      </span>
                    </p>
                    <p className="text-grey-500 mt-0.5 text-sm">/{p.slug}</p>
                  </div>
                  <span className="text-green-600 shrink-0 text-sm font-semibold">
                    Edit
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-ink flex items-center gap-2 text-lg font-bold">
          <Lock className="size-4" /> Built-in pages
        </h2>
        <p className="text-grey-500 mt-1 text-sm">
          These are part of the site&apos;s code. Their content comes from
          Settings, Events and the media library rather than the page builder.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEM_ROUTES.map((route) => (
            <li
              key={route.slug}
              className="border-grey-100 flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm"
            >
              <span className="text-ink font-medium">{route.title}</span>
              <Link
                href={`/${route.slug}`}
                target="_blank"
                className="text-green-600 font-semibold hover:underline"
              >
                /{route.slug || ""}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
