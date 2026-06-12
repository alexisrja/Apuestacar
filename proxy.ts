import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isInvalidRefreshTokenError } from "@/lib/supabase/client";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Without Supabase configured, let every request through untouched.
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  let user = null;

  try {
    // Refresh the session and read the user.
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    if (!isInvalidRefreshTokenError(error)) {
      throw error;
    }

    // A stale refresh token should behave like a signed-out session.
    const cleanupResponse = NextResponse.next({ request });
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith("sb-") || name.includes("auth-token")) {
        cleanupResponse.cookies.delete(name);
      }
    });
    return cleanupResponse;
  }

  const { pathname } = request.nextUrl;

  // Protect /perfil and /boletos/*/comprar — redirect to /login when not authenticated.
  if (
    !user &&
    (pathname.startsWith("/perfil") || pathname.match(/^\/boletos\/[^/]+\/comprar/))
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Protect /admin — require auth AND an allow-listed admin email. The page
  // layout and every Server Action re-check this; the middleware just avoids
  // rendering the admin shell for non-admins.
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!adminEmails.includes((user.email ?? "").toLowerCase())) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all paths except static assets and images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
