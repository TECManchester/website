import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { getAdminContext } from "@/lib/admin/auth";
import { auditLabel } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Activity log" };

const stamp = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

const dayOf = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
});

/** Turn the stored detail blob into a short human phrase. */
function describe(detail: unknown): string | null {
  if (!detail || typeof detail !== "object") return null;
  const d = detail as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof d.title === "string") parts.push(`"${d.title}"`);
  if (typeof d.name === "string") parts.push(`"${d.name}"`);
  if (typeof d.slug === "string") parts.push(`/${d.slug}`);
  if (typeof d.email === "string") parts.push(d.email);
  if (typeof d.role === "string" && d.role !== "none") parts.push(`role: ${d.role}`);
  if (Array.isArray(d.added) && d.added.length)
    parts.push(`added ${d.added.length} permission${d.added.length === 1 ? "" : "s"}`);
  if (Array.isArray(d.removed) && d.removed.length)
    parts.push(`removed ${d.removed.length} permission${d.removed.length === 1 ? "" : "s"}`);
  if (typeof d.groups === "string") parts.push(d.groups);
  if (typeof d.count === "number") parts.push(`${d.count} records`);

  return parts.length ? parts.join(" · ") : null;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = (await getAdminContext())!;
  if (!ctx.can("audit.view")) redirect("/admin");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const perPage = 60;
  const from = (page - 1) * perPage;

  const { data: entries, count } = await createAdminClient()
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  const rows = entries ?? [];
  const total = count ?? 0;
  const hasMore = from + rows.length < total;

  // Group by day so the log reads like a diary rather than a wall of rows.
  const byDay = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = dayOf.format(new Date(row.created_at));
    byDay.set(key, [...(byDay.get(key) ?? []), row]);
  }

  return (
    <>
      <p className="eyebrow">People</p>
      <h1 className="mt-2 text-3xl font-bold">Activity log</h1>
      <p className="text-grey-500 mt-2 max-w-2xl">
        Every change made in the admin — who did it, what they changed and when.
        Records are kept even if the person&apos;s account is later removed.
      </p>

      {rows.length === 0 ? (
        <div className="border-grey-100 mt-8 rounded-2xl border bg-white p-10 text-center">
          <History className="text-grey-500 mx-auto size-8" />
          <p className="text-grey-500 mt-3 text-sm">
            Nothing recorded yet.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {[...byDay.entries()].map(([day, dayRows]) => (
            <section key={day}>
              <h2 className="font-heading text-grey-500 text-xs font-bold tracking-wide uppercase">
                {day}
              </h2>
              <ul className="border-grey-100 mt-3 divide-y divide-grey-100 overflow-hidden rounded-2xl border bg-white">
                {dayRows.map((row) => {
                  const who =
                    row.actor_name || row.actor_email || "Someone (account removed)";
                  const extra = describe(row.detail);
                  return (
                    <li key={row.id} className="flex flex-wrap gap-x-2 gap-y-1 px-5 py-3 text-sm">
                      <span className="text-ink font-semibold">{who}</span>
                      <span className="text-grey-500">{auditLabel(row.action)}</span>
                      {extra && <span className="text-grey-500">{extra}</span>}
                      <span className="text-grey-500 ml-auto shrink-0 text-xs">
                        {stamp.format(new Date(row.created_at))}
                      </span>
                      {row.actor_email && row.actor_name && (
                        <span className="text-grey-500 w-full text-xs">
                          {row.actor_email}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="mt-8 flex items-center justify-between">
          <a
            href={`/admin/audit?page=${page - 1}`}
            aria-disabled={page === 1}
            className={
              page === 1
                ? "text-grey-300 pointer-events-none text-sm"
                : "text-green-600 text-sm font-semibold hover:underline"
            }
          >
            ← Newer
          </a>
          <span className="text-grey-500 text-xs">
            {total} entries
          </span>
          <a
            href={`/admin/audit?page=${page + 1}`}
            aria-disabled={!hasMore}
            className={
              hasMore
                ? "text-green-600 text-sm font-semibold hover:underline"
                : "text-grey-300 pointer-events-none text-sm"
            }
          >
            Older →
          </a>
        </div>
      )}
    </>
  );
}
