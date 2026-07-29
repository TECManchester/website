import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Plus, ShieldAlert } from "lucide-react";
import { BtnLink } from "@/components/btn";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Announcements" };

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

export default async function AnnouncementsPage() {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("announcements.manage")) {
    return (
      <div className="border-grey-100 rounded-2xl border bg-white p-10 text-center">
        <ShieldAlert className="text-grey-500 mx-auto size-8" />
        <p className="text-grey-500 mt-3 text-sm">
          Your role doesn&apos;t include announcements.
        </p>
      </div>
    );
  }

  const { data } = await createAdminClient()
    .from("announcements")
    .select("*")
    .order("updated_at", { ascending: false });
  const announcements = data ?? [];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Announcements</p>
          <h1 className="mt-2 text-3xl font-bold">Announcements</h1>
          <p className="text-grey-500 mt-2">
            A popup shown across the site. One can be active at a time; visitors
            who dismiss it see it again after the re-show period.
          </p>
        </div>
        <BtnLink href="/admin/announcements/new" variant="green">
          <Plus className="size-4" /> New announcement
        </BtnLink>
      </div>

      {announcements.length === 0 ? (
        <div className="border-grey-100 mt-8 rounded-2xl border border-dashed bg-white p-10 text-center">
          <Megaphone className="text-grey-500 mx-auto size-7" />
          <p className="text-grey-500 mt-3 text-sm">
            Nothing yet — create one for your next big notice.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {announcements.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/announcements/${a.id}`}
                className="border-grey-100 hover:shadow-card flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 transition"
              >
                <div className="min-w-0">
                  <p className="text-ink truncate font-semibold">
                    {a.title}
                    {a.is_active && (
                      <span className="bg-green text-ink ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase">
                        Active
                      </span>
                    )}
                  </p>
                  <p className="text-grey-500 mt-0.5 truncate text-sm">
                    {a.body.slice(0, 90)}
                    {a.starts_at &&
                      ` · from ${dateFmt.format(new Date(a.starts_at))}`}
                    {a.ends_at && ` until ${dateFmt.format(new Date(a.ends_at))}`}
                  </p>
                </div>
                <span className="text-green-600 shrink-0 text-sm font-semibold">
                  Edit
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
