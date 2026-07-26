import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Site buttons, per the design mockup: pill shaped, Sora, lift on hover.
 *
 * Separate from `components/ui/button` (the shadcn/Base UI primitive), which
 * stays available for form controls and anything shadcn composes internally.
 */
export const btn = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-heading font-semibold whitespace-nowrap transition-[transform,box-shadow,background,border-color] duration-200 motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        green: "bg-green text-ink hover:bg-green-600",
        navy: "bg-ink text-white hover:bg-[#20204a]",
        ghost:
          "border-[1.5px] border-grey-300 bg-transparent text-ink hover:border-ink",
        ghostOnDark:
          "border-[1.5px] border-white/35 bg-transparent text-white hover:border-white focus-visible:outline-green",
      },
      size: {
        default: "px-6 py-[13px] text-[15px]",
        lg: "px-[30px] py-4 text-base",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "green", size: "default", block: false },
  },
);

type BtnVariants = VariantProps<typeof btn>;

export function Btn({
  className,
  variant,
  size,
  block,
  ...props
}: React.ComponentProps<"button"> & BtnVariants) {
  return (
    <button
      className={cn(btn({ variant, size, block }), className)}
      {...props}
    />
  );
}

export function BtnLink({
  href,
  external = false,
  className,
  variant,
  size,
  block,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> &
  BtnVariants & { href: string; external?: boolean }) {
  const classes = cn(btn({ variant, size, block }), className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
