import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, HandCoins, Mail, Users } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient, createPublicClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const ctx = (await getAdminContext())!;

  const firstName =
    (ctx.profile.full_name || ctx.profile.email).split(/[\s@]/)[0] ?? "there";

  /*
   * Someone with no permissions gets a dedicated screen rather than the normal
   * dashboard with everything stripped out. An empty dashboard reads as "this
   * is broken"; this reads as "you're in, you're waiting on someone", and says
   * who to chase.
   */
  const hasAnyAccess =
    ctx.profile.status === "approved" && ctx.capabilities.length > 0;

  if (!hasAnyAccess) {
    const { contact } = await getSettings();
    const suspended =
      ctx.profile.status === "rejected" || ctx.profile.status === "suspended";

    return (
      <div className="mx-auto max-w-xl py-6">
        <span className="bg-green-100 grid size-14 place-items-center rounded-2xl">
          <Clock className="text-green-600 size-6" />
        </span>
        <p className="eyebrow mt-6">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">Hello, {firstName}</h1>

        {suspended ? (
          <p className="text-grey-500 mt-3 leading-relaxed">
            This account&apos;s access has been turned off. If you think
            that&apos;s a mistake, get in touch with the communications team and
            they can put it right.
          </p>
        ) : (
          <>
            <p className="text-grey-500 mt-3 leading-relaxed">
              You&apos;re signed in — but you don&apos;t have permission to
              manage anything yet.
            </p>
            <div className="border-grey-100 mt-6 rounded-2xl border bg-white p-6">
              <h2 className="font-heading text-ink font-bold">
                What happens next
              </h2>
              <p className="text-grey-500 mt-2 text-sm leading-relaxed">
                A super admin needs to give you permissions. Once they do, the
                things you can work on — events, pages, photos and so on — will
                appear in the menu on the left, and this page will fill in.
              </p>
              <p className="text-grey-500 mt-4 text-sm leading-relaxed">
                Nothing else to do at your end. If it&apos;s been a while,
                nudge whoever asked you to sign up.
              </p>
              <a
                href={`mailto:${contact.email}`}
                className="text-green-600 mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
              >
                <Mail className="size-4" /> {contact.email}
              </a>
            </div>
          </>
        )}

        <p className="text-grey-500 mt-6 text-xs">
          Signed in as {ctx.profile.email}
        </p>
      </div>
    );
  }

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
        {ctx.profile.status !== "approved"
          ? "Welcome — your account is awaiting approval. Once a super admin assigns your role, the sections you can manage will appear in the menu."
          : (ctx.profile.roles?.description ??
            "Manage the site from the menu on the left.")}
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
          What you can do here
        </h2>
        <p className="text-grey-500 mt-2 text-sm leading-relaxed">
          Run events, upload photos, edit the site&apos;s settings (address,
          times, socials, giving, banner), put up announcement popups, build
          and publish new pages, and read what people send through the forms —
          all depending on your role.
        </p>
      </div>
    </>
  );
}
