import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Fixed-window rate limiting for public form submissions.
 *
 * Backed by Postgres rather than memory: the app runs on serverless functions
 * with no shared process, so an in-memory counter would reset on every cold
 * start and be per-instance besides. One upsert per submission is cheap and
 * it's the only shared store we have — adding Redis for a church contact form
 * would be infrastructure nobody wants to maintain.
 *
 * Fails OPEN. If the limiter itself errors, a real person's prayer request
 * still goes through; losing that matters more than letting a bot past.
 */
export async function checkRateLimit(
  bucket: string,
  { max, windowSeconds }: { max: number; windowSeconds: number },
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  try {
    const ip = await clientIp();
    const { data, error } = await createAdminClient().rpc("check_rate_limit", {
      p_key: `${bucket}:${ip}`,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("rate limit check failed", error);
      return { allowed: true, retryAfterSeconds: 0 };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      allowed: row?.allowed ?? true,
      retryAfterSeconds: row?.retry_after_seconds ?? 0,
    };
  } catch (error) {
    console.error("rate limit check threw", error);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/**
 * The caller's IP.
 *
 * x-forwarded-for is a client-supplied header everywhere except behind a proxy
 * that overwrites it — which Vercel does. We take the FIRST entry because
 * Vercel appends the real client IP at the left; trusting the last would let a
 * caller pin their own value and sidestep the limit.
 */
async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
