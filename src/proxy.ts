import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection for /admin (Next 16: proxy.ts, the middleware successor).
 *
 * Two jobs:
 *  1. Refresh the Supabase session cookie on every admin request — without
 *     this, server components see stale sessions after the access token
 *     expires.
 *  2. Bounce unauthenticated visitors to the login page.
 *
 * Approval status is NOT checked here — the protected layout does that with a
 * single DB read, keeping the proxy fast and DB-free on the happy path.
 */
export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() validates against the auth server — never trust getSession()
  // alone in server code.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/admin/login";
  // Accepting an invitation happens while signed out by definition — bouncing
  // it to the login page would make every invite link dead on arrival.
  const isInvitePage = path.startsWith("/admin/invite/");
  // Password recovery also happens signed out, by definition.
  const isRecoveryPage =
    path === "/admin/forgot-password" || path === "/admin/reset-password";

  const redirectTo = (target: string) => {
    const redirect = NextResponse.redirect(new URL(target, request.url));
    // Carry any refreshed session cookies onto the redirect.
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  if (!user && !isLoginPage && !isInvitePage && !isRecoveryPage)
    return redirectTo("/admin/login");
  if (user && isLoginPage) return redirectTo("/admin");
  // Someone mid-reset holds a session but still needs the reset form.

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
