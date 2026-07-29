import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { PhasePlaceholder } from "@/components/admin/phase-placeholder";

export const metadata: Metadata = { title: "Pages" };

export default function Page() {
  return (
    <PhasePlaceholder
      title="Pages"
      phase={4}
      capability={"pages.view"}
      icon={FileText}
      description="Edit every page block by block, preview at desktop and mobile widths, and create new pages with their own URLs."
    />
  );
}
