import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { PhasePlaceholder } from "@/components/admin/phase-placeholder";

export const metadata: Metadata = { title: "Announcements" };

export default function Page() {
  return (
    <PhasePlaceholder
      title="Announcements"
      phase={3}
      capability={"announcements.manage"}
      icon={Megaphone}
      description="Site-wide popup notices with a schedule, an image and a dismiss timer."
    />
  );
}
