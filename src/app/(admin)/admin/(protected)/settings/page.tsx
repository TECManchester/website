import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PhasePlaceholder } from "@/components/admin/phase-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <PhasePlaceholder
      title="Settings"
      phase={2}
      capability={"settings.edit"}
      icon={Settings}
      description="Address, service times, socials and giving details — change once, updates everywhere it appears."
    />
  );
}
