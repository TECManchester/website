/**
 * Block model shared by the editor and the renderer.
 *
 * A page is an ordered list of these. `data` shapes are validated loosely at
 * render (missing fields degrade, never throw) — content must not be able to
 * crash the site.
 */

export type TiptapDoc = { type: "doc"; content?: TiptapNode[] };
export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

export type BlockType =
  | "page-hero"
  | "rich-text"
  | "image"
  | "date-card"
  | "icon-cards"
  | "accordion"
  | "cta-band"
  | "stats"
  | "event-list"
  | "youtube-latest"
  | "form";

export type BlockData = Record<string, unknown>;

export type EditorBlock = {
  /** DB id when persisted; local key otherwise. */
  id: string;
  type: BlockType;
  data: BlockData;
};

export const BLOCK_META: Record<
  BlockType,
  { label: string; description: string; defaults: BlockData; simple?: boolean }
> = {
  "page-hero": {
    label: "Banner",
    description: "The big heading at the top of the page.",
    defaults: { eyebrow: "", title: "New page", lead: "" },
    simple: true,
  },
  "rich-text": {
    label: "Text",
    description: "Write anything — headings, lists and links.",
    defaults: {
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [] }],
      },
    },
    simple: true,
  },
  image: {
    label: "Picture",
    description: "A photo from the media library, with an optional caption.",
    defaults: { url: "", alt: "", caption: "" },
    simple: true,
  },
  "date-card": {
    label: "Event date",
    description: "A date, time and place — perfect for announcing something.",
    defaults: { title: "Our next gathering", date: "", time: "", place: "" },
    simple: true,
  },
  "icon-cards": {
    label: "Card row",
    description: "Up to four simple cards with a title and short text.",
    defaults: {
      cards: [
        { title: "First card", body: "" },
        { title: "Second card", body: "" },
        { title: "Third card", body: "" },
      ],
    },
  },
  accordion: {
    label: "Accordion",
    description: "Expandable questions and answers.",
    defaults: { items: [{ title: "Question", body: "Answer." }] },
  },
  "cta-band": {
    label: "Button",
    description: "A big call-to-action button, with an optional heading.",
    defaults: {
      title: "Ready to take the next step?",
      lead: "",
      buttons: [{ label: "Plan a visit", href: "/im-new", style: "green" }],
    },
    simple: true,
  },
  stats: {
    label: "Stats",
    description: "A row of big numbers with labels.",
    defaults: { items: [{ value: "10:30", label: "Every Sunday" }] },
  },
  "event-list": {
    label: "Upcoming events",
    description: "Automatically shows the next published events.",
    defaults: { limit: 3 },
  },
  "youtube-latest": {
    label: "Latest message",
    description: "The live stream or most recent message from YouTube.",
    defaults: {},
  },
  form: {
    label: "Form",
    description: "One of the site forms.",
    defaults: { kind: "contact" },
  },
};

export const RESERVED_SLUGS = new Set([
  "admin", "api", "about", "contact", "events", "get-involved", "give",
  "im-new", "prayer", "watch", "brand", "hero", "leadership", "im-new",
  "privacy", "cookies",
  "sitemap.xml", "robots.txt", "icon.png", "apple-icon.png",
  "opengraph-image.png", "twitter-image.png", "_next", "login",
]);

export const SYSTEM_ROUTES = [
  { slug: "", title: "Home" },
  { slug: "im-new", title: "I'm New" },
  { slug: "about", title: "About" },
  { slug: "about/what-we-believe", title: "What We Believe" },
  { slug: "watch", title: "Watch" },
  { slug: "events", title: "Events" },
  { slug: "get-involved", title: "Get Involved" },
  { slug: "give", title: "Give" },
  { slug: "prayer", title: "Prayer" },
  { slug: "contact", title: "Contact" },
] as const;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
