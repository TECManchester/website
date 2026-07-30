"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import {
  Bold,
  CalendarDays,
  CalendarRange,
  Check,
  Clock,
  Copy,
  Eye,
  GripVertical,
  Hash,
  Heading2,
  History,
  Image as ImageIcon,
  Inbox,
  Italic,
  Link as LinkIcon,
  List,
  ListCollapse,
  Loader2,
  MapPin,
  Monitor,
  MonitorPlay,
  MousePointerClick,
  PanelTop,
  Plus,
  Settings2,
  Smartphone,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { Btn, btn } from "@/components/btn";
import { MediaPicker } from "@/components/admin/media-picker";
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

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const str = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown) =>
  Array.isArray(v) ? (v as Record<string, unknown>[]) : [];

/**
 * Click-and-type text. contentEditable seeded via effect and never re-rendered
 * with children, so the caret never jumps; placeholder shows through CSS when
 * empty.
 *
 * Renders a <span>, not a <div>: some callers place this inside a <p> (the
 * event-date block does), and a div there is invalid HTML. The browser's parser
 * hoists it out of the paragraph, so the parsed DOM stops matching the server
 * string and React throws the whole subtree away and re-renders it. `block` in
 * the base classes keeps the old layout; callers passing `inline-block` win
 * through tailwind-merge.
 */
function InlineText({
  value,
  onChange,
  className,
  placeholder,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== value && document.activeElement !== el) {
      el.textContent = value;
    }
  }, [value]);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={placeholder}
      data-placeholder={placeholder}
      onInput={(e) => onChange(e.currentTarget.textContent ?? "")}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") e.preventDefault();
      }}
      onPaste={(e) => {
        // Paste as plain text so Word formatting can't leak in.
        e.preventDefault();
        document.execCommand(
          "insertText",
          false,
          e.clipboardData.getData("text/plain"),
        );
      }}
      className={cn(
        "block cursor-text rounded-sm outline-none",
        "empty:before:pointer-events-none empty:before:opacity-40 empty:before:content-[attr(data-placeholder)]",
        "focus:ring-green/60 focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Inline rich text (Tiptap) with a floating toolbar                   */
/* ------------------------------------------------------------------ */

function ToolbarItem({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-8 place-items-center rounded-md transition",
        active ? "bg-green text-ink" : "text-white/70 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function RichToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="bg-ink absolute -top-11 left-1/2 z-20 flex -translate-x-1/2 gap-0.5 rounded-xl p-1 shadow-lg">
      <ToolbarItem label="Bold" active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="size-4" />
      </ToolbarItem>
      <ToolbarItem label="Italic" active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="size-4" />
      </ToolbarItem>
      <ToolbarItem label="Heading" active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-4" />
      </ToolbarItem>
      <ToolbarItem label="List" active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="size-4" />
      </ToolbarItem>
      <ToolbarItem label="Link" active={editor.isActive("link")}
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Link to (https://… or /page):", prev ?? "");
          if (url === null) return;
          if (url === "") editor.chain().focus().unsetLink().run();
          else if (/^(https?:\/\/|\/|mailto:|tel:)/.test(url))
            editor.chain().focus().setLink({ href: url }).run();
        }}>
        <LinkIcon className="size-4" />
      </ToolbarItem>
    </div>
  );
}

function InlineRich({
  value,
  onChange,
}: {
  value: TiptapDoc;
  onChange: (doc: TiptapDoc) => void;
}) {
  const [focused, setFocused] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // Mirrors the public TiptapRender typography, so editing IS previewing.
        class:
          "outline-none min-h-[1.6em] text-grey-700 leading-relaxed [&>*+*]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:font-heading [&_h2]:text-ink [&_h2]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:font-heading [&_h3]:text-ink [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li+li]:mt-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-green [&_blockquote]:pl-5 [&_blockquote]:italic [&_a]:text-green-600 [&_a]:underline [&_a]:underline-offset-4 [&_p.is-editor-empty:first-child]:before:content-['Click_here_and_start_writing…'] [&_p.is-editor-empty:first-child]:before:text-grey-300 [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as TiptapDoc),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  });

  if (!editor) return <div className="bg-grey-100 h-16 animate-pulse rounded-lg" />;

  return (
    <div className="relative">
      {focused && <RichToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The friendly section picker                                          */
/* ------------------------------------------------------------------ */

const PICKER_ICONS: Partial<Record<BlockType, React.ComponentType<{ className?: string }>>> = {
  "page-hero": PanelTop,
  "rich-text": Type,
  image: ImageIcon,
  "date-card": CalendarDays,
  "cta-band": MousePointerClick,
  "event-list": CalendarRange,
  "youtube-latest": MonitorPlay,
  form: Inbox,
  accordion: ListCollapse,
  stats: Hash,
};

function BlockPicker({
  onPick,
  onClose,
}: {
  onPick: (type: BlockType) => void;
  onClose: () => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const types = Object.entries(BLOCK_META) as [
    BlockType,
    (typeof BLOCK_META)[BlockType],
  ][];
  const simple = types.filter(([, m]) => m.simple);
  const advanced = types.filter(([, m]) => !m.simple);

  return (
    <div
      role="dialog"
      aria-label="Add a section"
      className="border-grey-100 max-h-[min(70vh,32rem)] w-[min(480px,92vw)] overflow-y-auto rounded-2xl border bg-white p-4 shadow-2xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading text-ink text-sm font-bold">Add a section</p>
        <button type="button" onClick={onClose} aria-label="Close"
          className="text-grey-500 hover:text-ink p-1">
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {simple.map(([type, meta]) => {
          const Icon = PICKER_ICONS[type] ?? Plus;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onPick(type)}
              className="border-grey-100 hover:border-green-600 group rounded-xl border p-3 text-left transition"
            >
              <span className="bg-green-100 group-hover:bg-green grid size-9 place-items-center rounded-lg transition-colors">
                <Icon className="text-green-600 group-hover:text-ink size-4.5" />
              </span>
              <span className="text-ink mt-2 block text-sm font-semibold">
                {meta.label}
              </span>
              <span className="text-grey-500 mt-0.5 block text-[11px] leading-snug">
                {meta.description}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="text-grey-500 hover:text-ink mt-3 text-xs font-semibold"
      >
        {showMore ? "Hide extra sections" : "More sections…"}
      </button>
      {showMore && (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {advanced.map(([type, meta]) => {
            const Icon = PICKER_ICONS[type] ?? Plus;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onPick(type)}
                className="border-grey-100 hover:border-green-600 flex items-center gap-2 rounded-xl border p-2.5 text-left transition"
              >
                <Icon className="text-grey-500 size-4 shrink-0" />
                <span className="text-ink text-xs font-semibold">{meta.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * The "Add a section" control.
 *
 * The picker is portalled to <body> and positioned with fixed coordinates
 * rather than rendered in place. That is deliberate: the canvas card clips its
 * contents (`overflow-hidden`, to keep full-bleed sections inside the rounded
 * corners), so an in-flow dropdown gets sliced off — and the one on the last
 * divider was cut away entirely, which read as "the button does nothing".
 * A portal escapes both the clip and every ancestor stacking context.
 */
function AddDivider({
  onPick,
  prominent = false,
}: {
  onPick: (type: BlockType) => void;
  prominent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  /**
   * Prefer below the button, flip above when there isn't room, and clamp into
   * the viewport either way — a picker that opens half off-screen is the same
   * bug as one that's clipped.
   */
  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const GAP = 8;
    // Estimates on the first pass (the portal hasn't painted yet); the rAF
    // pass below re-runs this with the real measurements.
    const h = popRef.current?.offsetHeight ?? 340;
    const w = popRef.current?.offsetWidth ?? 480;
    const maxTop = window.innerHeight - h - GAP;

    let top = r.bottom + GAP;
    if (top > maxTop) {
      const above = r.top - GAP - h;
      top = above >= GAP ? above : Math.max(GAP, maxTop);
    }
    // `left` is the centre point — translateX(-50%) does the centring.
    const half = w / 2;
    const left = Math.min(
      Math.max(r.left + r.width / 2, half + GAP),
      window.innerWidth - half - GAP,
    );

    setPos((prev) =>
      prev && prev.top === top && prev.left === left ? prev : { top, left },
    );
  }, []);

  // Keep it pinned to the button while the page moves, and close on Escape or
  // a click anywhere outside.
  useEffect(() => {
    if (!open) return;
    place();
    // Second pass after paint: the first ran on estimates because the portal
    // hadn't mounted yet.
    const raf = requestAnimationFrame(place);
    const onScroll = () => place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !btnRef.current?.contains(t))
        setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, place]);

  return (
    <div className="relative flex justify-center py-3">
      <div className="bg-grey-100 absolute top-1/2 right-6 left-6 h-px" />
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "font-heading relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition",
          prominent
            ? "bg-green text-ink shadow-md hover:brightness-105"
            : "border-grey-300 text-grey-500 hover:border-green-600 hover:text-green-600 border bg-white",
        )}
      >
        <Plus className={cn("size-3.5 transition", open && "rotate-45")} />
        Add a section
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            style={{
              position: "fixed",
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              visibility: pos ? "visible" : "hidden",
              transform: "translateX(-50%)",
              zIndex: 100,
            }}
          >
            <BlockPicker
              onPick={(type) => {
                setOpen(false);
                onPick(type);
              }}
              onClose={() => setOpen(false)}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Per-block canvas editors — visually identical to the public render  */
/* ------------------------------------------------------------------ */

function BannerEdit({ d, set }: { d: BlockData; set: (d: BlockData) => void }) {
  return (
    <section className="bg-ink relative overflow-hidden pt-[70px] pb-15 text-white">
      <span className="brand-glow top-[-200px] right-[-100px] size-[500px]" />
      <div className="wrap relative">
        <InlineText
          value={str(d.eyebrow)}
          onChange={(v) => set({ ...d, eyebrow: v })}
          placeholder="Small label (optional)"
          className="eyebrow-on-ink inline-block min-w-40"
        />
        <InlineText
          value={str(d.title)}
          onChange={(v) => set({ ...d, title: v })}
          placeholder="Page title"
          className="mt-3 block text-[clamp(34px,5vw,54px)] font-extrabold text-balance text-white"
        />
        <InlineText
          value={str(d.lead)}
          onChange={(v) => set({ ...d, lead: v })}
          placeholder="A short intro line (optional)"
          multiline
          className="mt-3 block max-w-[560px] text-lg text-pretty text-white/66"
        />
      </div>
    </section>
  );
}

function TextEdit({ d, set }: { d: BlockData; set: (d: BlockData) => void }) {
  return (
    <section className="py-10 sm:py-14">
      <div className="wrap">
        <div className="mx-auto max-w-3xl">
          <InlineRich
            value={(d.content as TiptapDoc) ?? { type: "doc", content: [] }}
            onChange={(doc) => set({ ...d, content: doc })}
          />
        </div>
      </div>
    </section>
  );
}

function PictureEdit({ d, set }: { d: BlockData; set: (d: BlockData) => void }) {
  const [changing, setChanging] = useState(false);
  const url = str(d.url);
  return (
    <section className="py-8 sm:py-12">
      <div className="wrap">
        <figure className="mx-auto max-w-4xl">
          {url ? (
            <>
              <div className="bg-grey-100 group/img relative aspect-video overflow-hidden rounded-2xl">
                <Image src={url} alt={str(d.alt)} fill sizes="896px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setChanging((v) => !v)}
                  className="bg-ink/80 absolute right-3 bottom-3 rounded-full px-3.5 py-1.5 text-xs font-bold text-white opacity-0 backdrop-blur transition group-hover/img:opacity-100 focus-visible:opacity-100"
                >
                  Change picture
                </button>
              </div>
              <figcaption className="mt-3 text-center">
                <InlineText
                  value={str(d.caption)}
                  onChange={(v) => set({ ...d, caption: v })}
                  placeholder="Add a caption (optional)"
                  className="text-grey-500 inline-block min-w-48 text-sm"
                />
              </figcaption>
            </>
          ) : (
            <div className="border-grey-300 bg-grey-50 grid aspect-video place-items-center rounded-2xl border-2 border-dashed">
              <div className="w-full max-w-sm p-6 text-center">
                <MediaPicker
                  label=""
                  value={null}
                  onChange={(u, alt) => set({ ...d, url: u ?? "", alt })}
                />
              </div>
            </div>
          )}
          {changing && url && (
            <div className="mt-3">
              <MediaPicker
                label=""
                value={url}
                alt={str(d.alt)}
                onChange={(u, alt) => {
                  set({ ...d, url: u ?? "", alt: u ? alt || str(d.alt) : "" });
                  setChanging(false);
                }}
              />
            </div>
          )}
        </figure>
      </div>
    </section>
  );
}

function DateCardEdit({ d, set }: { d: BlockData; set: (d: BlockData) => void }) {
  const dateIso = str(d.date);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(dateIso)
    ? new Date(`${dateIso}T12:00:00Z`)
    : null;
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    parsed
      ? new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "Europe/London" }).format(parsed)
      : null;

  return (
    <section className="py-10 sm:py-14">
      <div className="wrap">
        <div className="border-grey-100 shadow-card mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-3xl border bg-white p-8 sm:flex-row sm:gap-8 sm:p-10">
          <div className="shrink-0 text-center">
            <div className="bg-ink relative overflow-hidden rounded-2xl px-7 py-5">
              <span className="brand-glow top-[-40px] right-[-40px] size-[140px]" />
              <span className="font-heading text-green relative block text-5xl font-extrabold">
                {fmt({ day: "numeric" }) ?? "12"}
              </span>
              <span className="relative mt-1 block text-sm font-bold tracking-[0.14em] text-white uppercase">
                {fmt({ month: "short" }) ?? "Aug"}
              </span>
            </div>
            <input
              type="date"
              value={dateIso}
              onChange={(e) => set({ ...d, date: e.target.value })}
              aria-label="Event date"
              className="border-grey-300 mt-2 w-full rounded-lg border px-2 py-1 text-xs"
            />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <InlineText
              value={str(d.title)}
              onChange={(v) => set({ ...d, title: v })}
              placeholder="What's happening?"
              className="block text-2xl font-bold text-balance"
            />
            <div className="text-grey-500 mt-3 space-y-1.5 text-[15px]">
              {parsed && (
                <p className="flex items-center justify-center gap-2 sm:justify-start">
                  <CalendarDays className="text-green-600 size-4 shrink-0" />
                  {fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
              <p className="flex items-center justify-center gap-2 sm:justify-start">
                <Clock className="text-green-600 size-4 shrink-0" />
                <InlineText
                  value={str(d.time)}
                  onChange={(v) => set({ ...d, time: v })}
                  placeholder="Time — e.g. 7:00 pm"
                  className="inline-block min-w-32"
                />
              </p>
              <p className="flex items-center justify-center gap-2 sm:justify-start">
                <MapPin className="text-green-600 size-4 shrink-0" />
                <InlineText
                  value={str(d.place)}
                  onChange={(v) => set({ ...d, place: v })}
                  placeholder="Where — e.g. Mary Seacole Building"
                  className="inline-block min-w-40"
                />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const LINK_PRESETS = [
  ["Plan a visit", "/im-new"],
  ["Contact form", "/contact"],
  ["Prayer form", "/prayer"],
  ["Give", "/give"],
  ["Events", "/events"],
] as const;

function ButtonEdit({ d, set }: { d: BlockData; set: (d: BlockData) => void }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const buttons = arr(d.buttons);
  const button = buttons[0] ?? { label: "Find out more", href: "/im-new", style: "green" };
  const setButton = (b: Record<string, unknown>) =>
    set({ ...d, buttons: [b, ...buttons.slice(1)] });

  return (
    <section className="bg-ink relative overflow-hidden py-16 text-white sm:py-20">
      <span className="brand-glow bottom-[-200px] left-[-120px] size-[500px] opacity-60" />
      <div className="wrap relative flex flex-col items-center gap-6 text-center">
        <InlineText
          value={str(d.title)}
          onChange={(v) => set({ ...d, title: v })}
          placeholder="Heading (optional)"
          className="max-w-[620px] text-[clamp(26px,4vw,40px)] font-bold text-balance text-white"
        />
        <div className="relative">
          <span className={cn(btn({ variant: "green", size: "lg" }), "cursor-text")}>
            <InlineText
              value={str(button.label)}
              onChange={(v) => setButton({ ...button, label: v })}
              placeholder="Button label"
              className="min-w-24 focus:ring-0"
            />
          </span>
          <button
            type="button"
            onClick={() => setLinkOpen((v) => !v)}
            className="text-green absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap underline underline-offset-4"
          >
            {str(button.href) || "Set link"}
          </button>
          {linkOpen && (
            <div className="border-grey-100 absolute top-full left-1/2 z-30 mt-10 w-64 -translate-x-1/2 rounded-xl border bg-white p-3 text-left shadow-2xl">
              <p className="text-ink mb-2 text-xs font-bold">Button links to</p>
              <div className="space-y-1">
                {LINK_PRESETS.map(([label, href]) => (
                  <button
                    key={href}
                    type="button"
                    onClick={() => {
                      setButton({ ...button, href });
                      setLinkOpen(false);
                    }}
                    className={cn(
                      "block w-full rounded-lg px-2.5 py-1.5 text-left text-sm",
                      str(button.href) === href
                        ? "bg-green-100 text-ink font-semibold"
                        : "text-grey-500 hover:bg-grey-50",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Input
                value={str(button.href)}
                onChange={(e) => setButton({ ...button, href: e.target.value })}
                placeholder="Or type a link…"
                className="mt-2 h-8 text-xs"
              />
              <div className="mt-2 text-right">
                <Btn type="button" variant="navy" onClick={() => setLinkOpen(false)}
                  className="h-8 px-3 py-0 text-xs">
                  Done
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Advanced blocks aren't edited inline — show a labelled stand-in. */
function AdvancedStandIn({ type }: { type: BlockType }) {
  const meta = BLOCK_META[type];
  const Icon = PICKER_ICONS[type] ?? Plus;
  return (
    <section className="py-10">
      <div className="wrap">
        <div className="border-grey-300 bg-grey-50 mx-auto flex max-w-2xl items-center gap-4 rounded-2xl border border-dashed p-6">
          <span className="bg-green-100 grid size-11 shrink-0 place-items-center rounded-xl">
            <Icon className="text-green-600 size-5" />
          </span>
          <div>
            <p className="text-ink font-semibold">{meta.label}</p>
            <p className="text-grey-500 text-sm">
              {meta.description} Shows automatically on the live page.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The canvas                                                          */
/* ------------------------------------------------------------------ */

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

export function CanvasEditor({
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
  const [status, setStatus] = useState(page.status);
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved" | "conflict"
  >("idle");

  const baseUpdatedAt = useRef(page.updated_at);

  const markDirty = () =>
    setSaveState((s) => (s === "conflict" ? s : "dirty"));

  type SaveInput = {
    title: string;
    description: string;
    slug: string;
    blocks: EditorBlock[];
  };

  async function doSave(input: SaveInput): Promise<boolean> {
    setSaveState("saving");
    const result = await savePageDraft({
      pageId: page.id,
      title: input.title,
      description: input.description,
      slug: input.slug,
      blocks: input.blocks,
      baseUpdatedAt: baseUpdatedAt.current,
    });
    if (!result.ok) {
      if (result.conflict) {
        setSaveState("conflict");
        toast.error(result.message, { duration: 10000 });
      } else {
        setSaveState("dirty");
        toast.error(result.message);
      }
      return false;
    }
    if (result.updatedAt) baseUpdatedAt.current = result.updatedAt;
    if (result.slug) setSlug(result.slug);
    setSaveState("saved");
    return true;
  }

  // Autosave: 2s after the last change. The effect closure carries the values
  // it saves, so nothing is read through refs during render.
  useEffect(() => {
    if (saveState !== "dirty") return;
    const t = setTimeout(
      () => void doSave({ title, description, slug, blocks }),
      2000,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState, blocks, title, description, slug]);

  const updateBlock = (i: number, data: BlockData) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], data };
      return next;
    });
    markDirty();
  };

  const insertBlock = (i: number, type: BlockType) => {
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(i, 0, {
        id: `local-${type}-${prev.length}-${i}`,
        type,
        data: structuredClone(BLOCK_META[type].defaults),
      });
      return next;
    });
    markDirty();
  };

  const removeBlock = (i: number) => {
    setBlocks((prev) => prev.filter((_, j) => j !== i));
    markDirty();
  };

  const dragTo = (from: number, to: number) => {
    if (from === to) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragIdx(to);
    markDirty();
  };

  async function publish() {
    setPublishing(true);
    const saved = await doSave({ title, description, slug, blocks });
    if (saved) {
      const result = await publishPage(page.id);
      if (result.ok) {
        setStatus("published");
        if (result.updatedAt) baseUpdatedAt.current = result.updatedAt;
        toast.success(result.message);
      } else toast.error(result.message);
    }
    setPublishing(false);
  }

  const renderEdit = (block: EditorBlock, i: number) => {
    const set = (data: BlockData) => updateBlock(i, data);
    switch (block.type) {
      case "page-hero":
        return <BannerEdit d={block.data} set={set} />;
      case "rich-text":
        return <TextEdit d={block.data} set={set} />;
      case "image":
        return <PictureEdit d={block.data} set={set} />;
      case "date-card":
        return <DateCardEdit d={block.data} set={set} />;
      case "cta-band":
        return <ButtonEdit d={block.data} set={set} />;
      default:
        return <AdvancedStandIn type={block.type} />;
    }
  };

  return (
    <div className="-mt-2">
      {/* Top bar */}
      <div className="bg-grey-50/95 sticky top-0 z-40 -mx-6 mb-4 border-b px-6 py-3 backdrop-blur lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-ink truncate font-bold">{title || "Untitled"}</p>
            <p className="text-grey-500 flex items-center gap-1.5 text-xs">
              /{slug}
              <button
                type="button"
                aria-label="Copy link"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/${slug}`,
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="hover:text-ink"
              >
                {copied ? (
                  <Check className="text-green-600 size-3" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
              <span className="mx-1">·</span>
              <span
                className={
                  status === "published" ? "text-green-600 font-bold" : "text-gold font-bold"
                }
              >
                {status === "published" ? "Live" : "Draft"}
              </span>
              <span className="mx-1">·</span>
              <span aria-live="polite">
                {saveState === "saving" && "Saving…"}
                {saveState === "saved" && "All changes saved"}
                {saveState === "dirty" && "Unsaved changes"}
                {saveState === "conflict" && "⚠ Reload needed"}
                {saveState === "idle" && "No changes yet"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="border-grey-300 mr-1 flex rounded-full border p-0.5" role="group" aria-label="Preview width">
              {(
                [
                  ["desktop", Monitor],
                  ["mobile", Smartphone],
                ] as const
              ).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  aria-label={key}
                  aria-pressed={mode === key}
                  className={cn(
                    "grid size-8 place-items-center rounded-full transition",
                    mode === key ? "bg-ink text-white" : "text-grey-500 hover:text-ink",
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>

            {revisions.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setHistoryOpen((v) => !v)}
                  aria-label="Undo history"
                  className="text-grey-500 hover:text-ink grid size-9 place-items-center rounded-full transition"
                >
                  <History className="size-4.5" />
                </button>
                {historyOpen && (
                  <div className="border-grey-100 absolute right-0 z-50 mt-1 w-60 rounded-xl border bg-white p-2 shadow-2xl">
                    <p className="text-grey-500 px-2 py-1 text-[11px] font-bold uppercase">
                      Restore an earlier version
                    </p>
                    {revisions.slice(0, 6).map((rev) => (
                      <button
                        key={rev.id}
                        type="button"
                        onClick={async () => {
                          if (!confirm("Replace what's on screen with this version?")) return;
                          const r = await restoreRevision(page.id, rev.id);
                          if (r.ok) window.location.reload();
                          else toast.error(r.message);
                        }}
                        className="hover:bg-grey-50 block w-full rounded-lg px-2 py-1.5 text-left text-sm"
                      >
                        {new Intl.DateTimeFormat("en-GB", {
                          day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit",
                          timeZone: "Europe/London",
                        }).format(new Date(rev.created_at))}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                aria-label="Page settings"
                className="text-grey-500 hover:text-ink grid size-9 place-items-center rounded-full transition"
              >
                <Settings2 className="size-4.5" />
              </button>
              {settingsOpen && (
                <div className="border-grey-100 absolute right-0 z-50 mt-1 w-72 space-y-3 rounded-xl border bg-white p-4 shadow-2xl">
                  <div className="space-y-1">
                    <Label htmlFor="cv-title">Page name</Label>
                    <Input id="cv-title" value={title}
                      onChange={(e) => { setTitle(e.target.value); markDirty(); }} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cv-slug">Web address</Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-grey-500 text-xs">/</span>
                      <Input id="cv-slug" value={slug} disabled={page.is_system}
                        onChange={(e) => { setSlug(slugify(e.target.value)); markDirty(); }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cv-desc">Search description</Label>
                    <Textarea id="cv-desc" rows={2} value={description}
                      onChange={(e) => { setDescription(e.target.value); markDirty(); }} />
                  </div>
                  {canPublish && status === "published" && !page.is_system && (
                    <Btn variant="ghost" block onClick={async () => {
                      const r = await unpublishPage(page.id);
                      if (r.ok) {
                        setStatus("draft");
                        if (r.updatedAt) baseUpdatedAt.current = r.updatedAt;
                        toast.success(r.message);
                      } else toast.error(r.message);
                    }}>
                      Take off the site
                    </Btn>
                  )}
                  {canDelete && !page.is_system && (
                    <Btn variant="ghost" block onClick={async () => {
                      if (!confirm("Delete this page completely? This can't be undone.")) return;
                      const r = await deletePage(page.id);
                      if (r.ok) {
                        toast.success(r.message);
                        router.push("/admin/pages");
                        router.refresh();
                      } else toast.error(r.message);
                    }}>
                      <Trash2 className="size-4" /> Delete page
                    </Btn>
                  )}
                </div>
              )}
            </div>

            <Link
              href={`/admin/preview/${page.id}`}
              target="_blank"
              aria-label="Open full preview"
              className="text-grey-500 hover:text-ink grid size-9 place-items-center rounded-full transition"
            >
              <Eye className="size-4.5" />
            </Link>

            {canPublish && (
              <Btn variant="green" onClick={publish}
                disabled={publishing || saveState === "conflict"}>
                {publishing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : status === "published" ? (
                  "Update the site"
                ) : (
                  "Put it live"
                )}
              </Btn>
            )}
          </div>
        </div>
        {saveState === "conflict" && (
          <div className="bg-destructive/10 text-ink mt-2 rounded-lg px-3 py-2 text-sm">
            Someone else saved this page while you were editing.{" "}
            <button type="button" onClick={() => window.location.reload()}
              className="font-bold underline">
              Reload to get their changes
            </button>{" "}
            — copy anything you don&apos;t want to lose first.
          </div>
        )}
      </div>

      {/* The canvas */}
      <div className="bg-grey-100 rounded-3xl p-3 sm:p-6">
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-2xl bg-white shadow-xl transition-[max-width] duration-300",
            mode === "mobile" ? "max-w-[390px]" : "max-w-full",
          )}
        >
          {blocks.length === 0 && (
            <div className="px-6 py-16 text-center">
              <span className="bg-green-100 mx-auto grid size-14 place-items-center rounded-2xl">
                <PanelTop className="text-green-600 size-6" />
              </span>
              <h2 className="text-ink mt-5 text-xl font-bold">
                Let&apos;s build your page
              </h2>
              <p className="text-grey-500 mx-auto mt-2 max-w-sm text-sm leading-relaxed">
                Start with a banner for the title, then add text, a picture, an
                event date, or a button. You can move sections around at any
                time.
              </p>
              <div className="mx-auto mt-6 max-w-md">
                <AddDivider
                  prominent
                  onPick={(type) => insertBlock(0, type)}
                />
              </div>
            </div>
          )}
          {blocks.length > 0 && (
            <AddDivider onPick={(type) => insertBlock(0, type)} />
          )}
          {blocks.map((block, i) => {
            const meta = BLOCK_META[block.type];
            const Icon = PICKER_ICONS[block.type] ?? Plus;
            return (
              <div key={block.id}>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragIdx !== null && dragIdx !== i) dragTo(dragIdx, i);
                  }}
                  className={cn(
                    // No overflow clipping here — the rich-text floating
                    // toolbar sits above the block and must not be cut off.
                    "group/block relative rounded-xl outline-2 outline-transparent transition",
                    "hover:outline-green/40 focus-within:outline-green/60",
                    dragIdx === i && "opacity-40",
                  )}
                >
                  {/*
                    A permanent header rather than a hover-only chip: it names
                    every section at a glance and keeps the controls off the
                    content they'd otherwise sit on top of.
                  */}
                  <div className="border-grey-100 bg-grey-50 flex items-center justify-between border-b px-3 py-1.5">
                    <span className="font-heading text-grey-500 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase">
                      <Icon className="size-3.5" />
                      {meta.label}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-grey-500 mr-1 text-[11px] opacity-0 transition group-hover/block:opacity-100">
                        Section {i + 1} of {blocks.length}
                      </span>
                      <span
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          setDragIdx(i);
                        }}
                        onDragEnd={() => setDragIdx(null)}
                        title="Drag to move this section"
                        className="text-grey-500 hover:text-ink grid size-6 cursor-grab place-items-center rounded-md transition active:cursor-grabbing"
                      >
                        <GripVertical className="size-3.5" />
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove the ${meta.label} section?`))
                            removeBlock(i);
                        }}
                        aria-label={`Remove ${meta.label} section`}
                        title="Remove this section"
                        className="text-grey-500 hover:text-destructive grid size-6 place-items-center rounded-md transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </div>

                  {renderEdit(block, i)}
                </div>
                <AddDivider onPick={(type) => insertBlock(i + 1, type)} />
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-grey-500 mt-3 text-center text-xs">
        Click any text to edit it · hover a section to move or remove it ·
        changes save by themselves
      </p>
    </div>
  );
}
