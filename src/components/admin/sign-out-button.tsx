"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={cn(
        "font-heading text-grey-500 hover:text-ink inline-flex items-center gap-2 text-sm font-medium transition disabled:opacity-50",
        className,
      )}
    >
      <LogOut className="size-4" />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
