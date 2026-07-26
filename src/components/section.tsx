import { cn } from "@/lib/utils";

/** Standard content band — 96px vertical rhythm, 64px on smaller screens. */
export function Section({
  children,
  className,
  id,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "grey" | "ink";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-28 py-16 sm:py-24",
        tone === "grey" && "bg-grey-50",
        tone === "ink" && "bg-ink overflow-hidden text-white",
        className,
      )}
    >
      {tone === "ink" && (
        <span className="brand-glow bottom-[-200px] left-[-120px] size-[500px] opacity-60" />
      )}
      <div className="wrap relative z-2">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "default",
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  tone?: "default" | "onInk";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-13 max-w-[620px]",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className={tone === "onInk" ? "eyebrow-on-ink" : "eyebrow"}>
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "mt-3.5 mb-3.5 text-[clamp(30px,4vw,46px)] font-bold text-balance",
          tone === "onInk" && "text-white",
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "text-lg text-pretty",
            tone === "onInk" ? "text-white/60" : "text-grey-500",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

/** Compact dark hero for interior pages. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-ink relative overflow-hidden pt-[70px] pb-15 text-white">
      <span className="brand-glow top-[-200px] right-[-100px] size-[500px]" />
      <div className="wrap relative">
        {eyebrow && <p className="eyebrow-on-ink">{eyebrow}</p>}
        <h1 className="mt-3 text-[clamp(34px,5vw,54px)] font-extrabold text-balance text-white">
          {title}
        </h1>
        {lead && (
          <p className="mt-3 max-w-[560px] text-lg text-pretty text-white/66">
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
