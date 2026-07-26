import { cn } from "@/lib/utils";

/**
 * Wordmark with the gradient mark from the design mockup.
 *
 * TODO: swap the mark for the real TEC swirl emblem once the artwork lands in
 * /public (logo-colour.svg, logo-white.svg, logo-navy.svg). The layout and the
 * `tone` prop stay the same, so no call site has to change.
 */
export function Logo({
  tone = "ink",
  className,
}: {
  tone?: "ink" | "white";
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-[11px]", className)}>
      <span className="from-green to-green-600 grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-linear-135 shadow-[0_6px_16px_rgb(132_194_36_/_0.4)]">
        <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden>
          <path d="M12 2L4 8v13h5v-7h6v7h5V8z" fill="#0E0E2C" />
        </svg>
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "font-heading block text-lg font-extrabold tracking-[-0.02em]",
            tone === "white" ? "text-white" : "text-ink",
          )}
        >
          Elevation
        </span>
        <span
          className={cn(
            "mt-px block text-[10px] font-semibold tracking-[0.18em] uppercase",
            tone === "white" ? "text-white/60" : "text-grey-500",
          )}
        >
          Manchester
        </span>
      </span>
    </span>
  );
}
