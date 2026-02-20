import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { readAdminSession } from "./lib/server/admin-session";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  const maybeAdminSegment = segments[1];
  const maybeAdminChild = segments[2];

  const isLocaleRoute = routing.locales.includes(maybeLocale as (typeof routing.locales)[number]);
  const isAdminRoute = isLocaleRoute && maybeAdminSegment === "admin";
  const isAdminLoginRoute = isAdminRoute && maybeAdminChild === "login";

  if (isAdminRoute && !isAdminLoginRoute) {
    const session = await readAdminSession(request);

    if (!session) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = `/${maybeLocale}/admin/login`;
      redirectUrl.searchParams.set(
        "next",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
