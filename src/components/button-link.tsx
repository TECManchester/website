import Link from "next/link";
import { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * A Button that navigates.
 *
 * shadcn's Button is built on Base UI, which composes via `render` rather than
 * Radix's `asChild`. Wrapping that here keeps call sites readable and means the
 * pattern only has to be right in one place.
 */
export function ButtonLink({
  href,
  external = false,
  children,
  ...props
}: Omit<ButtonProps, "render"> & {
  href: string;
  /** Opens in a new tab with rel="noreferrer". */
  external?: boolean;
}) {
  return (
    <Button
      render={
        external ? (
          <a href={href} target="_blank" rel="noreferrer" />
        ) : (
          <Link href={href} />
        )
      }
      {...props}
    >
      {children}
    </Button>
  );
}
