import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "muted" | "navy" | "green";
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 py-16 sm:py-24",
        tone === "muted" && "bg-secondary",
        tone === "navy" && "bg-brand-navy text-white",
        tone === "green" && "bg-brand-green-soft",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  tone?: "default" | "onNavy";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p
          className={cn(
            "mb-3",
            tone === "onNavy" ? "eyebrow-on-navy" : "eyebrow",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-semibold text-balance sm:text-4xl">
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed text-pretty",
            tone === "onNavy" ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

/** Standard hero strip for interior pages. */
export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        {eyebrow && <p className="eyebrow-on-navy mb-3">{eyebrow}</p>}
        <h1 className="text-4xl font-semibold text-balance sm:text-5xl">
          {title}
        </h1>
        {lead && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80 text-pretty">
            {lead}
          </p>
        )}
      </div>
    </div>
  );
}
