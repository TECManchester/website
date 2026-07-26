import Image from "next/image";
import { brand, church } from "@/lib/church";
import { cn } from "@/lib/utils";

type Tone = "ink" | "white";

/**
 * The church logo.
 *
 * Renders the official artwork once it's in /public/brand and
 * `brand.hasLogoFiles` is true; falls back to a typographic lockup until then,
 * so the site never ships broken image icons.
 */
export function Logo({
  tone = "ink",
  className,
  priority = false,
}: {
  tone?: Tone;
  className?: string;
  /** Set on the header instance — it's the LCP element on most pages. */
  priority?: boolean;
}) {
  if (brand.hasLogoFiles) {
    return (
      <Image
        src={tone === "white" ? brand.logo.white : brand.logo.colour}
        alt={church.name}
        width={brand.logoAspect.width}
        height={brand.logoAspect.height}
        priority={priority}
        /*
         * The supplied lockup is stacked over three lines at ~3:1, so it needs
         * real height — below about 44px the "MANCHESTER" line stops being
         * legible. Sized up on desktop where there's room.
         */
        className={cn("h-11 w-auto sm:h-[52px]", className)}
      />
    );
  }

  return <LogoFallback tone={tone} className={className} />;
}

/**
 * Typographic stand-in. Mirrors the real lockup's structure — stacked "THE /
 * ELEVATION / CHURCH / MANCHESTER" in a letterspaced serif — so swapping in the
 * artwork doesn't change the header's proportions.
 */
function LogoFallback({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <span
      className={cn("flex items-center gap-[11px]", className)}
      aria-label={church.name}
      role="img"
    >
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
