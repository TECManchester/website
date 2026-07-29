import type { Metadata } from "next";
import { Image as ImageIcon } from "lucide-react";
import { PhasePlaceholder } from "@/components/admin/phase-placeholder";

export const metadata: Metadata = { title: "Media" };

export default function Page() {
  return (
    <PhasePlaceholder
      title="Media"
      phase={1}
      capability={"media.view"}
      icon={ImageIcon}
      description="Upload photos once, reuse them anywhere — banners, event flyers and page images."
    />
  );
}
