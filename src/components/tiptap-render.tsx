import type { ReactNode } from "react";
import Link from "next/link";
import type { TiptapDoc, TiptapNode } from "@/lib/blocks";

/**
 * Renders Tiptap JSON straight to React — no HTML string, no
 * dangerouslySetInnerHTML, so stored content can't inject markup. Unknown
 * node and mark types are simply skipped.
 */

function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  return /^(https?:\/\/|\/|mailto:|tel:)/.test(href) ? href : null;
}

function renderText(node: TiptapNode, key: number): ReactNode {
  let out: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") out = <strong key={key}>{out}</strong>;
    else if (mark.type === "italic") out = <em key={key}>{out}</em>;
    else if (mark.type === "link") {
      const href = safeHref(mark.attrs?.href);
      if (href) {
        const external = href.startsWith("http");
        out = external ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-green-600 underline underline-offset-4"
          >
            {out}
          </a>
        ) : (
          <Link
            key={key}
            href={href}
            className="text-green-600 underline underline-offset-4"
          >
            {out}
          </Link>
        );
      }
    }
  }
  return out;
}

function renderNode(node: TiptapNode, key: number): ReactNode {
  const children = (node.content ?? []).map((child, i) =>
    child.type === "text" ? renderText(child, i) : renderNode(child, i),
  );

  switch (node.type) {
    case "paragraph":
      return (
        <p key={key} className="leading-relaxed text-pretty">
          {children.length > 0 ? children : " "}
        </p>
      );
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      if (level <= 2)
        return (
          <h2 key={key} className="mt-8 text-2xl font-bold first:mt-0">
            {children}
          </h2>
        );
      return (
        <h3 key={key} className="mt-6 text-xl font-bold first:mt-0">
          {children}
        </h3>
      );
    }
    case "bulletList":
      return (
        <ul key={key} className="list-disc space-y-1.5 pl-6">
          {children}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="list-decimal space-y-1.5 pl-6">
          {children}
        </ol>
      );
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-green border-l-4 pl-5 italic"
        >
          {children}
        </blockquote>
      );
    case "hardBreak":
      return <br key={key} />;
    default:
      return children.length > 0 ? (
        <div key={key}>{children}</div>
      ) : null;
  }
}

export function TiptapRender({ doc }: { doc: TiptapDoc | null | undefined }) {
  if (!doc || doc.type !== "doc") return null;
  return (
    <div className="text-grey-700 space-y-4">
      {(doc.content ?? []).map((node, i) => renderNode(node, i))}
    </div>
  );
}
