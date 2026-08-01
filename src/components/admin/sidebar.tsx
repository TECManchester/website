"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Settings,
  SlidersHorizontal,
  History,
  UserRound,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Shown only if the user's role carries this capability (or 'all'). */
  capability?: string | string[];
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Events", href: "/admin/events", icon: CalendarDays, capability: "events.view" },
  { label: "Pages", href: "/admin/pages", icon: FileText, capability: "pages.view" },
  { label: "Media", href: "/admin/media", icon: ImageIcon, capability: "media.view" },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone, capability: "announcements.manage" },
  {
    label: "Submissions",
    href: "/admin/submissions",
    icon: Inbox,
    capability: [
      "submissions.contact.view",
      "submissions.prayer.view",
      "submissions.giftaid.view",
    ],
  },
  { label: "Settings", href: "/admin/settings", icon: Settings, capability: "settings.edit" },
  {
    label: "People",
    href: "/admin/users",
    icon: Users,
    capability: ["users.approve", "users.invite"],
  },
  {
    label: "Roles",
    href: "/admin/roles",
    icon: SlidersHorizontal,
    capability: "roles.manage",
  },
  { label: "Activity", href: "/admin/audit", icon: History, capability: "audit.view" },
];

export function AdminSidebar({
  capabilities,
  userName,
  roleName,
}: {
  capabilities: string[];
  userName: string;
  roleName: string;
}) {
  const pathname = usePathname();

  const can = (cap?: string | string[]) => {
    if (!cap) return true;
    if (capabilities.includes("all")) return true;
    const wanted = Array.isArray(cap) ? cap : [cap];
    return wanted.some((c) => capabilities.includes(c));
  };

  const items = NAV.filter((item) => can(item.capability));

  return (
    <aside className="bg-ink flex h-dvh w-64 shrink-0 flex-col max-lg:hidden">
      <div className="px-6 pt-7 pb-6">
        <Link href="/admin" aria-label="Admin dashboard">
          <Logo tone="white" className="h-10 sm:h-10" />
        </Link>
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {items.map(({ label, href, icon: Icon }) => {
            const active =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "font-heading flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon
                    className={cn("size-[18px]", active ? "text-green" : "")}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link
          href="/admin/account"
          className={cn(
            "flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/5",
            pathname.startsWith("/admin/account") && "bg-white/10",
          )}
        >
          <span className="bg-green text-ink font-heading grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold">
            {userName.trim().charAt(0).toUpperCase() || <UserRound className="size-4" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">
              {userName}
            </span>
            <span className="text-green block text-[11px] font-bold tracking-[0.1em] uppercase">
              {roleName}
            </span>
          </span>
        </Link>
        <div className="mt-3 px-2.5">
          <SignOutButton className="text-white/50 hover:text-white" />
        </div>
      </div>
    </aside>
  );
}
