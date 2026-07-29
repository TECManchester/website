import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, HandCoins, Users } from "lucide-react";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient, createPublicClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const ctx = (await getAdminContext())!;

  const firstName =
    (ctx.profile.full_name || ctx.profile.email).split(/[\s@]/)[0] ?? "there";

  // Counts are gated by the same capabilities as the pages they link to.
  const [eventCount, pendingCount, giftAidCount] = await Promise.all([
    ctx.can("events.view")
      ? createPublicClient()
          .from("events")
          .select("id", { count: "exact", head: true })
          .gte("starts_at", new Date().toISOString())
          .then((r) => r.count ?? 0)
      : Promise.resolve(null),
    ctx.can("users.approve")
      ? createAdminClient()
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .then((r) => r.count ?? 0)
      : Promise.resolve(null),
    ctx.can("submissions.giftaid.view")
      ? createAdminClient()
          .from("gift_aid_declarations")
          .select("id", { count: "exact", head: true })
          .is("cancelled_at", null)
          .then((r) => r.count ?? 0)
      : Promise.resolve(null),
  ]);

  const stats = [
    eventCount !== null && {
      label: "Upcoming events",
      value: eventCount,
      href: "/admin/events",
      icon: CalendarDays,
    },
    pendingCount !== null && {
      label: "Access requests",
      value: pendingCount,
      href: "/admin/users",
      icon: Users,
      attention: pendingCount > 0,
    },
    giftAidCount !== null && {
      label: "Gift Aid declarations",
      value: giftAidCount,
      href: "/admin/submissions",
      icon: HandCoins,
    },
  ].filter(Boolean) as {
    label: string;
    value: number;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    attention?: boolean;
  }[];

  return (
    <>
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-2 text-3xl font-bold">Hello, {firstName}</h1>
      <p className="text-grey-500 mt-2">
        {ctx.profile.roles?.description ??
          "Manage the site from the menu on the left."}
      </p>

      {stats.length > 0 && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ label, value, href, icon: Icon, attention }) => (
            <Link
              key={href + label}
              href={href}
              className="group border-grey-100 shadow-card hover:shadow-card-lg relative rounded-2xl border bg-white p-6 transition duration-250 hover:-translate-y-1"
            >
              <span className="bg-green-100 grid size-11 place-items-center rounded-xl">
                <Icon className="text-green-600 size-5" />
              </span>
              <p className="font-heading text-ink mt-4 text-3xl font-extrabold">
                {value}
                {attention && (
                  <span className="bg-green ml-2 inline-block size-2.5 rounded-full align-middle" />
                )}
              </p>
              <p className="text-grey-500 mt-1 flex items-center gap-1.5 text-sm">
                {label}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="border-grey-100 mt-10 rounded-2xl border bg-white p-6">
        <h2 className="font-heading text-ink text-lg font-bold">
          What&apos;s built so far
        </h2>
        <p className="text-grey-500 mt-2 text-sm leading-relaxed">
          Phase 0 — sign-in, access requests, roles and approvals. Events
          management, the media library, page editing and the submissions inbox
          arrive in the next phases; their menu entries lead to a preview of
          what&apos;s coming.
        </p>
      </div>
    </>
  );
}
