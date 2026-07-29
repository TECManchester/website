import { ShieldAlert, type LucideIcon } from "lucide-react";
import { getAdminContext } from "@/lib/admin/auth";

/**
 * Stand-in for sections arriving in later phases. Checks the capability
 * server-side so even placeholder pages respect the role model.
 */
export async function PhasePlaceholder({
  title,
  phase,
  description,
  capability,
  icon: Icon,
}: {
  title: string;
  phase: number;
  description: string;
  capability: string | string[];
  icon: LucideIcon;
}) {
  const ctx = (await getAdminContext())!;
  const wanted = Array.isArray(capability) ? capability : [capability];
  const allowed =
    ctx.capabilities.includes("all") ||
    wanted.some((c) => ctx.capabilities.includes(c));

  if (!allowed) {
    return (
      <div className="border-grey-100 rounded-2xl border bg-white p-10 text-center">
        <ShieldAlert className="text-grey-500 mx-auto size-8" />
        <h1 className="text-ink mt-4 text-lg font-bold">No access</h1>
        <p className="text-grey-500 mt-1 text-sm">
          Your role doesn&apos;t include this section.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">{title}</p>
      <h1 className="mt-2 text-3xl font-bold">{title}</h1>
      <div className="border-grey-100 mt-8 rounded-2xl border border-dashed bg-white p-12 text-center">
        <span className="bg-green-100 mx-auto grid size-14 place-items-center rounded-2xl">
          <Icon className="text-green-600 size-7" />
        </span>
        <h2 className="text-ink mt-5 text-lg font-bold">
          Coming in phase {phase}
        </h2>
        <p className="text-grey-500 mx-auto mt-2 max-w-md text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </>
  );
}
