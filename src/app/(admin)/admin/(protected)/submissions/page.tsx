import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { PhasePlaceholder } from "@/components/admin/phase-placeholder";

export const metadata: Metadata = { title: "Submissions" };

export default function Page() {
  return (
    <PhasePlaceholder
      title="Submissions"
      phase={6}
      capability={["submissions.contact.view","submissions.prayer.view","submissions.giftaid.view"]}
      icon={Inbox}
      description="Contact messages, prayer requests and Gift Aid declarations — each visible only to the roles allowed to see them."
    />
  );
}
