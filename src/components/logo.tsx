import { cn } from "@/lib/utils";

/**
 * Typographic stand-in for the TEC wordmark.
 *
 * TODO: replace with the real artwork once the files land in /public:
 *   logo-colour.svg (blue + green), logo-white.svg, logo-navy.svg
 * Then swap this for <Image src={...} alt="Elevation Church Manchester" /> and
 * keep the same `tone` prop so every call site keeps working.
 */
export function Logo({
  tone = "navy",
  className,
}: {
  tone?: "navy" | "white";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex flex-col items-start leading-none",
        tone === "white" ? "text-white" : "text-brand-navy",
        className,
      )}
    >
      <span className="wordmark text-[0.5rem] opacity-70 sm:text-[0.55rem]">
        The
      </span>
      <span className="wordmark text-base leading-tight font-semibold sm:text-lg">
        Elevation
      </span>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="bg-brand-green h-px w-3 shrink-0"
        />
        <span className="wordmark text-[0.6rem] sm:text-[0.65rem]">Church</span>
        <span
          aria-hidden
          className="bg-brand-green h-px w-3 shrink-0"
        />
      </span>
      <span className="wordmark text-brand-green mt-0.5 text-[0.55rem] font-semibold sm:text-[0.6rem]">
        Manchester
      </span>
    </span>
  );
}
