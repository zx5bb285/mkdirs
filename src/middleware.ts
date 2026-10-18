import authConfig from "@/auth.config";
import { routing } from "@/i18n/routing";
import {
  apiAuthPrefix,
  authRoutes,
  defaultLoginRedirect,
  getLocaleFromPathname,
  publicRoutes,
  stripLocale,
} from "@/routes";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

/**
 * https://www.youtube.com/watch?v=1MTyCvS05V4
 * Next Auth V5 - Advanced Guide (2024)
 */
const { auth } = NextAuth(authConfig);

// next-intl middleware for locale routing & negotiation
// https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing
const handleI18n = createMiddleware(routing);

const matchPublicRoute = (pathname: string) =>
  publicRoutes.some((route) => new RegExp(`^${route}$`).test(pathname));

// URLs are locale-less (localePrefix: "never"), so the login path never
// carries a locale prefix.
const redirectToLogin = (callbackUrl: string, base: URL) =>
  Response.redirect(
    new URL(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, base),
  );

// since we have put role in user session, so we can know the role of the user
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const { pathname } = nextUrl;

  // do nothing if on api auth routes
  if (pathname.startsWith(apiAuthPrefix)) {
    return null;
  }

  // Legacy prefixed URLs (/en/..., /zh-CN/...) now share one unprefixed
  // structure. Permanently redirect and keep the visitor's language by
  // storing it in the same cookie next-intl reads.
  const legacyLocale = getLocaleFromPathname(pathname);
  if (legacyLocale) {
    const redirectUrl = new URL(
      stripLocale(pathname) + nextUrl.search,
      nextUrl,
    );
    const response = NextResponse.redirect(redirectUrl, 308);
    response.cookies.set("NEXT_LOCALE", legacyLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  // API and /studio routes are outside of [locale] routing:
  // keep the legacy auth-only behavior, never let next-intl touch them
  // (a locale prefix on /studio would break the Sanity Studio basePath)
  if (pathname.startsWith("/api") || pathname.startsWith("/studio")) {
    if (!isLoggedIn && !matchPublicRoute(pathname)) {
      return redirectToLogin(pathname + nextUrl.search, nextUrl);
    }
    return null;
  }

  // Paths never carry a locale prefix (localePrefix: "never"), so run the
  // auth checks directly and let next-intl resolve the locale from the
  // NEXT_LOCALE cookie (falling back to the default) at the end.
  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicRoute = matchPublicRoute(pathname);

  // redirect to dashboard if logged in and on auth routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(defaultLoginRedirect(), nextUrl));
    }
    return handleI18n(req);
  }

  // redirect to login if not logged in and not on public routes
  if (!isLoggedIn && !isPublicRoute) {
    return redirectToLogin(pathname + nextUrl.search, nextUrl);
  }

  return handleI18n(req);
});

// https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
// https://clerk.com/docs/references/nextjs/auth-middleware#usage
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
