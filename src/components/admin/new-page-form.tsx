"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { Btn } from "@/components/btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkSlug, createPage } from "@/lib/actions/admin-pages";
import { slugify } from "@/lib/blocks";

export function NewPageForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [check, setCheck] = useState<{ available: boolean; reason?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced live availability check. All setState happens inside the timer
  // callback (async, post-render), never synchronously in the effect body.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (!slug) {
        setCheck(null);
        return;
      }
      const result = await checkSlug(slug);
      setCheck({ available: result.available, reason: result.reason });
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await createPage(title, slug);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Page created — build it below, then publish.");
    router.push(`/admin/pages/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="np-title">Page title</Label>
        <Input
          id="np-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          placeholder="e.g. Alpha Course"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="np-slug">URL</Label>
        <div className="flex items-center gap-2">
          <span className="text-grey-500 text-sm">yoursite.org/</span>
          <Input
            id="np-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>
        {check && (
          <p
            className={
              check.available
                ? "text-green-600 flex items-center gap-1.5 text-xs"
                : "text-destructive flex items-center gap-1.5 text-xs"
            }
          >
            {check.available ? (
              <>
                <Check className="size-3.5" /> /{slug} is available
              </>
            ) : (
              <>
                <X className="size-3.5" /> {check.reason}
              </>
            )}
          </p>
        )}
      </div>

      <Btn
        type="submit"
        variant="green"
        size="lg"
        disabled={busy || !title || (check !== null && !check.available)}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : "Create page"}
      </Btn>
    </form>
  );
}
