import type { Metadata } from "next";
import Link from "next/link";
import { Download, Inbox, ShieldAlert } from "lucide-react";
import { SubmissionStatus } from "@/components/admin/submission-status";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Submissions" };

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

const when = (iso: string) => dateFmt.format(new Date(iso));

type Tab = { key: string; label: string; cap: string };

const TABS: Tab[] = [
  { key: "contact", label: "Contact", cap: "submissions.contact.view" },
  { key: "prayer", label: "Prayer", cap: "submissions.prayer.view" },
  { key: "giftaid", label: "Gift Aid", cap: "submissions.giftaid.view" },
  { key: "newsletter", label: "Newsletter", cap: "submissions.contact.view" },
  { key: "visits", label: "Planned visits", cap: "submissions.contact.view" },
];

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = (await getAdminContext())!;
  const visible = TABS.filter((t) => ctx.can(t.cap));

  if (visible.length === 0) {
    return (
      <div className="border-grey-100 rounded-2xl border bg-white p-10 text-center">
        <ShieldAlert className="text-grey-500 mx-auto size-8" />
        <p className="text-grey-500 mt-3 text-sm">
          Your role doesn&apos;t include any submission inboxes.
        </p>
      </div>
    );
  }

  const { tab: requested } = await searchParams;
  const tab = visible.find((t) => t.key === requested)?.key ?? visible[0].key;
  const admin = createAdminClient();

  return (
    <>
      <p className="eyebrow">Submissions</p>
      <h1 className="mt-2 text-3xl font-bold">Inbox</h1>
      <p className="text-grey-500 mt-2">
        What people send through the site. You only see the inboxes your role
        allows.
      </p>

      <div className="mt-7 flex flex-wrap gap-2" role="tablist">
        {visible.map((t) => (
          <Link
            key={t.key}
            href={`/admin/submissions?tab=${t.key}`}
            role="tab"
            aria-selected={tab === t.key}
            className={cn(
              "font-heading rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === t.key
                ? "bg-ink text-white"
                : "text-grey-500 hover:text-ink bg-white",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {tab === "contact" && (
          <List
            rows={
              (await admin
                .from("contact_messages")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(100)).data ?? []
            }
            empty="No contact messages yet."
            render={(m) => (
              <Card
                key={m.id}
                heading={m.name}
                sub={`${m.email}${m.phone ? ` · ${m.phone}` : ""} · ${when(m.created_at)}`}
                body={`${m.subject ? `${m.subject} — ` : ""}${m.message}`}
                aside={<SubmissionStatus kind="contact" id={m.id} status={m.status} />}
              />
            )}
          />
        )}

        {tab === "prayer" && (
          <List
            rows={
              (await admin
                .from("prayer_requests")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(100)).data ?? []
            }
            empty="No prayer requests yet."
            render={(p) => (
              <Card
                key={p.id}
                heading={p.name || "Anonymous"}
                sub={`${p.email ?? "no email"}${p.phone ? ` · ${p.phone}` : ""} · ${when(p.created_at)}${p.is_urgent ? " · URGENT" : ""}`}
                body={p.request}
                aside={<SubmissionStatus kind="prayer" id={p.id} status={p.status} />}
              />
            )}
          />
        )}

        {tab === "giftaid" && (
          <>
            <div className="mb-4 flex justify-end">
              <a
                href="/admin/submissions/gift-aid.csv"
                className="font-heading text-green-600 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
              >
                <Download className="size-4" /> Download CSV for HMRC
              </a>
            </div>
            <List
              rows={
                (await admin
                  .from("gift_aid_declarations")
                  .select("*")
                  .order("declared_at", { ascending: false })
                  .limit(200)).data ?? []
              }
              empty="No Gift Aid declarations yet."
              render={(d) => (
                <Card
                  key={d.id}
                  heading={`${d.title ? `${d.title} ` : ""}${d.first_name} ${d.last_name}`}
                  sub={`${d.address_line1}, ${d.postcode} · declared ${when(d.declared_at)}${d.cancelled_at ? " · CANCELLED" : ""}`}
                  body={d.email ?? ""}
                />
              )}
            />
          </>
        )}

        {tab === "newsletter" && (
          <List
            rows={
              (await admin
                .from("newsletter_subscribers")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(500)).data ?? []
            }
            empty="No subscribers yet."
            render={(n) => (
              <Card
                key={n.id}
                heading={n.email}
                sub={`${n.name ?? ""} · joined ${when(n.created_at)}${n.unsubscribed_at ? " · unsubscribed" : ""}`}
                body=""
              />
            )}
          />
        )}

        {tab === "visits" && (
          <List
            rows={
              (await admin
                .from("visit_plans")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(100)).data ?? []
            }
            empty="No planned visits yet."
            render={(v) => (
              <Card
                key={v.id}
                heading={v.name}
                sub={`${v.email} · ${when(v.created_at)}`}
                body={`${v.adults} adult(s), ${v.children} child(ren)${v.children_ages ? ` (${v.children_ages})` : ""}${v.notes ? ` — ${v.notes}` : ""}`}
                aside={<SubmissionStatus kind="visit" id={v.id} status={v.status} />}
              />
            )}
          />
        )}
      </div>
    </>
  );
}

function List<T>({
  rows,
  empty,
  render,
}: {
  rows: T[];
  empty: string;
  render: (row: T) => React.ReactNode;
}) {
  if (rows.length === 0)
    return (
      <div className="border-grey-100 rounded-2xl border border-dashed bg-white p-10 text-center">
        <Inbox className="text-grey-500 mx-auto size-7" />
        <p className="text-grey-500 mt-3 text-sm">{empty}</p>
      </div>
    );
  return <ul className="space-y-3">{rows.map(render)}</ul>;
}

function Card({
  heading,
  sub,
  body,
  aside,
}: {
  heading: string;
  sub: string;
  body: string;
  aside?: React.ReactNode;
}) {
  return (
    <li className="border-grey-100 rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ink font-semibold">{heading}</p>
          <p className="text-grey-500 mt-0.5 text-xs">{sub}</p>
        </div>
        {aside}
      </div>
      {body && (
        <p className="text-grey-700 mt-3 text-sm leading-relaxed whitespace-pre-line">
          {body}
        </p>
      )}
    </li>
  );
}
