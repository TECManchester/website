import { getAdminContext } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Gift Aid declarations as CSV, for HMRC claims.
 *
 * Route handlers bypass layouts, so this re-checks auth and capability itself
 * — a URL is not a permission.
 */
export async function GET() {
  const ctx = await getAdminContext();
  if (
    !ctx ||
    ctx.profile.status !== "approved" ||
    !ctx.can("submissions.giftaid.view")
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data } = await createAdminClient()
    .from("gift_aid_declarations")
    .select("*")
    .order("declared_at", { ascending: true });

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = [
    "title", "first_name", "last_name", "address_line1", "address_line2",
    "city", "postcode", "email", "phone", "declared_at", "cancelled_at",
    "covers_past_four_years", "covers_future_donations", "declaration_version",
  ];
  const lines = [
    header.join(","),
    ...(data ?? []).map((d) =>
      header.map((k) => esc((d as Record<string, unknown>)[k])).join(","),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gift-aid-declarations.csv"',
    },
  });
}
