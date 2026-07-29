import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PhasePlaceholder } from "@/components/admin/phase-placeholder";

export const metadata: Metadata = { title: "Events" };

export default function Page() {
  return (
    <PhasePlaceholder
      title="Events"
      phase={1}
      capability={"events.view"}
      icon={CalendarDays}
      description="Create and edit events, upload flyers, and publish straight to the site — no developer needed."
    />
  );
}
