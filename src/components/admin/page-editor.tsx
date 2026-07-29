"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  Globe,
  History,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Btn } from "@/components/btn";
import { MediaPicker } from "@/components/admin/media-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePage,
  publishPage,
  restoreRevision,
  savePageDraft,
  unpublishPage,
} from "@/lib/actions/admin-pages";
import {
  BLOCK_META,
  slugify,
  type BlockData,
  type BlockType,
  type EditorBlock,
  type TiptapDoc,
} from "@/lib/blocks";
import { cn } from "@/lib/utils";

type PageInfo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  is_system: boolean;
  updated_at: string;
};

type Revision = { id: string; created_at: string };

const str = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown) =>
  Array.isArray(v) ? (v as Record<string, unknown>[]) : [];

/* ---------- per-type field editors ---------- */

function BlockFields({
  block,
  update,
}: {
  block: EditorBlock;
  update: (data: BlockData) => void;
}) {
  const d = block.data;

  const listEditor = (
    key: string,
    fields: { name: string; label: string; textarea?: boolean }[],
    addLabel: string,
    max: number,
  ) => {
    const items = arr(d[key]);
    return (
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border-grey-100 space-y-2 rounded-lg border p-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  update({ ...d, [key]: items.filter((_, j) => j !== i) })
                }
                aria-label="Remove"
                className="text-grey-500 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {fields.map((f) =>
              f.textarea ? (
                <Textarea
                  key={f.name}
                  rows={2}
                  placeholder={f.label}
                  value={str(item[f.name])}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...item, [f.name]: e.target.value };
                    update({ ...d, [key]: next });
                  }}
                />
              ) : (
                <Input
                  key={f.name}
                  placeholder={f.label}
                  value={str(item[f.name])}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...item, [f.name]: e.target.value };
                    update({ ...d, [key]: next });
                  }}
                />
              ),
            )}
          </div>
        ))}
        {items.length < max && (
          <Btn
            type="button"
            variant="ghost"
            onClick={() =>
              update({
                ...d,
                [key]: [
                  ...items,
                  Object.fromEntries(fields.map((f) => [f.name, ""])),
                ],
              })
            }
          >
            <Plus className="size-4" /> {addLabel}
          </Btn>
        )}
      </div>
    );
  };

  switch (block.type) {
    case "page-hero":
      return (
        <div className="space-y-3">
          <Input placeholder="Eyebrow (small text above the title)"
            value={str(d.eyebrow)}
            onChange={(e) => update({ ...d, eyebrow: e.target.value })} />
          <Input placeholder="Title" value={str(d.title)}
            onChange={(e) => update({ ...d, title: e.target.value })} />
          <Textarea placeholder="Intro line" rows={2} value={str(d.lead)}
            onChange={(e) => update({ ...d, lead: e.target.value })} />
        </div>
      );

    case "rich-text":
      return (
        <RichTextEditor
          value={(d.content as TiptapDoc) ?? { type: "doc", content: [] }}
          onChange={(doc) => update({ ...d, content: doc })}
        />
      );

    case "image":
      return (
        <div className="space-y-3">
          <MediaPicker
            label=""
            value={str(d.url) || null}
            alt={str(d.alt)}
            onChange={(url, alt) =>
              update({ ...d, url: url ?? "", alt: str(d.alt) || alt })
            }
          />
          <Input placeholder="Alt text (what the image shows)" value={str(d.alt)}
            onChange={(e) => update({ ...d, alt: e.target.value })} />
          <Input placeholder="Caption (optional)" value={str(d.caption)}
            onChange={(e) => update({ ...d, caption: e.target.value })} />
        </div>
      );

    case "icon-cards":
      return listEditor(
        "cards",
        [
          { name: "title", label: "Card title" },
          { name: "body", label: "Card text", textarea: true },
        ],
        "Add card",
        4,
      );

    case "accordion":
      return listEditor(
        "items",
        [
          { name: "title", label: "Question / heading" },
          { name: "body", label: "Answer", textarea: true },
        ],
        "Add item",
        12,
      );

    case "cta-band":
      return (
        <div className="space-y-3">
          <Input placeholder="Heading" value={str(d.title)}
            onChange={(e) => update({ ...d, title: e.target.value })} />
          <Input placeholder="Supporting line (optional)" value={str(d.lead)}
            onChange={(e) => update({ ...d, lead: e.target.value })} />
          {listEditor(
            "buttons",
            [
              { name: "label", label: "Button label" },
              { name: "href", label: "Link (/page or https://…)" },
            ],
            "Add button",
            2,
          )}
        </div>
      );

    case "stats":
      return listEditor(
        "items",
        [
          { name: "value", label: "Big value (e.g. 10:30)" },
          { name: "label", label: "Label underneath" },
        ],
        "Add stat",
        4,
      );

    case "event-list":
      return (
        <div className="max-w-40">
          <Label htmlFor={`limit-${block.id}`}>How many events</Label>
          <Input
            id={`limit-${block.id}`}
            type="number"
            min={1}
            max={6}
            value={Number(d.limit) || 3}
            onChange={(e) => update({ ...d, limit: Number(e.target.value) })}
          />
        </div>
      );

    case "youtube-latest":
      return (
        <p className="text-grey-500 text-sm">
          Shows the live stream when you&apos;re on air, otherwise the latest
          message. Nothing to configure.
        </p>
      );

    case "form":
      return (
        <select
          value={str(d.kind) || "contact"}
          onChange={(e) => update({ ...d, kind: e.target.value })}
          aria-label="Which form"
          className="border-grey-300 h-10 rounded-lg border bg-white px-3 text-sm"
        >
          <option value="contact">Contact form</option>
          <option value="prayer">Prayer request form</option>
          <option value="newsletter">Newsletter signup</option>
          <option value="giftaid">Gift Aid declaration</option>
        </select>
      );

    default:
      return null;
  }
}

/* ---------- the editor ---------- */

export function PageEditor({
  page,
  initialBlocks,
  revisions,
  canPublish,
  canDelete,
}: {
  page: PageInfo;
  initialBlocks: EditorBlock[];
  revisions: Revision[];
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [description, setDescription] = useState(page.description ?? "");
  const [slug, setSlug] = useState(page.slug);
  const [blocks, setBlocks] = useState<EditorBlock[]>(initialBlocks);
  const [baseUpdatedAt, setBaseUpdatedAt] = useState(page.updated_at);
  const [status, setStatus] = useState(page.status);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const publicUrl = `/${slug}`;

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
  };

  const addBlock = (type: BlockType) =>
    setBlocks((prev) => [
      ...prev,
      {
        id: `local-${prev.length}-${type}-${prev.map((b) => b.id).join("").length}`,
        type,
        data: structuredClone(BLOCK_META[type].defaults),
      },
    ]);

  async function save(): Promise<boolean> {
    setBusy("save");
    const result = await savePageDraft({
      pageId: page.id,
      title,
      description,
      slug,
      blocks,
      baseUpdatedAt,
    });
    setBusy(null);
    if (!result.ok) {
      toast.error(result.message, { duration: result.conflict ? 10000 : 5000 });
      return false;
    }
    if (result.updatedAt) setBaseUpdatedAt(result.updatedAt);
    if (result.slug) setSlug(result.slug);
    toast.success(result.message);
    return true;
  }

  async function publish() {
    if (!(await save())) return;
    setBusy("publish");
    const result = await publishPage(page.id);
    setBusy(null);
    if (result.ok) {
      setStatus("published");
      if (result.updatedAt) setBaseUpdatedAt(result.updatedAt);
      toast.success(result.message);
    } else toast.error(result.message);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        {/* Page settings */}
        <section className="border-grey-100 space-y-4 rounded-2xl border bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pg-title">Page title</Label>
              <Input id="pg-title" value={title}
                onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pg-slug">URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-grey-500 text-sm">/</span>
                <Input
                  id="pg-slug"
                  value={slug}
                  disabled={page.is_system}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                />
                <button
                  type="button"
                  aria-label="Copy public URL"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}${publicUrl}`,
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="text-grey-500 hover:text-ink p-1"
                >
                  {copied ? (
                    <Check className="text-green-600 size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
              {page.is_system && (
                <p className="text-grey-500 text-xs">
                  System page — its URL is fixed.
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pg-desc">Search description (SEO)</Label>
            <Textarea id="pg-desc" rows={2} value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </div>
        </section>

        {/* Blocks */}
        {blocks.map((block, i) => (
          <section
            key={block.id}
            className="border-grey-100 rounded-2xl border bg-white"
          >
            <header className="border-grey-100 flex items-center justify-between border-b px-5 py-3">
              <h3 className="font-heading text-ink text-sm font-bold">
                {BLOCK_META[block.type]?.label ?? block.type}
              </h3>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} aria-label="Move up"
                  className="text-grey-500 hover:text-ink p-1.5 disabled:opacity-30"
                  disabled={i === 0}>
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} aria-label="Move down"
                  className="text-grey-500 hover:text-ink p-1.5 disabled:opacity-30"
                  disabled={i === blocks.length - 1}>
                  <ArrowDown className="size-4" />
                </button>
                <button type="button" aria-label="Remove block"
                  onClick={() => {
                    if (confirm("Remove this block?"))
                      setBlocks(blocks.filter((_, j) => j !== i));
                  }}
                  className="text-grey-500 hover:text-destructive p-1.5">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </header>
            <div className="p-5">
              <BlockFields
                block={block}
                update={(data) => {
                  const next = [...blocks];
                  next[i] = { ...block, data };
                  setBlocks(next);
                }}
              />
            </div>
          </section>
        ))}

        {/* Add block */}
        <section className="border-grey-300 rounded-2xl border border-dashed bg-white p-5">
          <p className="font-heading text-ink mb-3 text-sm font-bold">
            Add a section
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(BLOCK_META) as BlockType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                title={BLOCK_META[type].description}
                className="border-grey-300 hover:border-green-600 hover:text-green-600 rounded-full border px-3.5 py-1.5 text-sm transition"
              >
                + {BLOCK_META[type].label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Side rail */}
      <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
        <div className="border-grey-100 space-y-3 rounded-2xl border bg-white p-5">
          <p className="text-grey-500 text-xs font-semibold tracking-wide uppercase">
            Status:{" "}
            <span className={cn("font-bold", status === "published" ? "text-green-600" : "text-gold")}>
              {status === "published" ? "Published" : "Draft"}
            </span>
          </p>
          <Btn variant="navy" block disabled={busy !== null} onClick={save}>
            {busy === "save" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save draft"
            )}
          </Btn>
          <Link
            href={`/admin/pages/${page.id}/preview`}
            target="_blank"
            className="border-grey-300 text-ink font-heading hover:border-ink flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] px-6 py-[13px] text-[15px] font-semibold transition"
          >
            <Eye className="size-4" /> Preview draft
          </Link>
          {canPublish && (
            <Btn variant="green" block disabled={busy !== null} onClick={publish}>
              {busy === "publish" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Globe className="size-4" /> Publish
                </>
              )}
            </Btn>
          )}
          {canPublish && status === "published" && !page.is_system && (
            <Btn variant="ghost" block disabled={busy !== null}
              onClick={async () => {
                const result = await unpublishPage(page.id);
                if (result.ok) {
                  setStatus("draft");
                  if (result.updatedAt) setBaseUpdatedAt(result.updatedAt);
                  toast.success(result.message);
                } else toast.error(result.message);
              }}>
              Unpublish
            </Btn>
          )}
          {status === "published" && (
            <Link href={publicUrl} target="_blank"
              className="text-green-600 block text-center text-sm font-semibold hover:underline">
              View live page →
            </Link>
          )}
        </div>

        {revisions.length > 0 && (
          <div className="border-grey-100 rounded-2xl border bg-white p-5">
            <p className="font-heading text-ink mb-3 flex items-center gap-2 text-sm font-bold">
              <History className="size-4" /> Revisions
            </p>
            <ul className="space-y-2">
              {revisions.slice(0, 8).map((rev) => (
                <li key={rev.id} className="flex items-center justify-between text-sm">
                  <span className="text-grey-500">
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric", month: "short",
                      hour: "2-digit", minute: "2-digit",
                      timeZone: "Europe/London",
                    }).format(new Date(rev.created_at))}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("Replace the current draft with this revision?")) return;
                      const result = await restoreRevision(page.id, rev.id);
                      if (result.ok) {
                        toast.success(result.message);
                        router.refresh();
                        window.location.reload();
                      } else toast.error(result.message);
                    }}
                    className="text-green-600 font-semibold hover:underline"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {canDelete && !page.is_system && (
          <Btn variant="ghost" block
            onClick={async () => {
              if (!confirm("Delete this page and its history? This can't be undone.")) return;
              const result = await deletePage(page.id);
              if (result.ok) {
                toast.success(result.message);
                router.push("/admin/pages");
                router.refresh();
              } else toast.error(result.message);
            }}>
            <Trash2 className="size-4" /> Delete page
          </Btn>
        )}
      </aside>
    </div>
  );
}
