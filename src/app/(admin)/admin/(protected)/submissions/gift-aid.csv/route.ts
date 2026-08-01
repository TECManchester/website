import { getAdminContext } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
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

  /**
   * Escape for CSV *and* for spreadsheets.
   *
   * Names and addresses here come straight from a public form. A value starting
   * with = + - @ (or a control character Excel treats as a formula lead-in) is
   * executed as a formula when the file is opened — so a submitted surname
   * could run a command on the treasurer's machine. Prefixing with a single
   * quote neutralises it; Excel shows the text and drops the quote.
   */
  const esc = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
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

  // Downloading every donor's name and home address is a significant act —
  // record who did it and how much they took.
  await recordAudit(ctx, "submissions.giftaid.exported", {
    entity: "gift_aid_declarations",
    detail: { count: (data ?? []).length },
  });

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gift-aid-declarations.csv"',
    },
  });
}
