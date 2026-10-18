import { routing } from "@/i18n/routing";

/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/studio(/.*)?",

  "/search(/.*)?",
  "/collection(/.*)?",
  "/category(/.*)?",
  "/tag(/.*)?",
  "/item(/.*)?",
  "/blog(/.*)?",
  "/pricing(/.*)?",

  "/about(/.*)?",
  "/terms(/.*)?",
  "/privacy(/.*)?",
  "/changelog(/.*)?",

  // user clicks verification link from email
  "/auth/new-verification",

  // unsubscribe
  "/unsubscribe(/.*)?",

  // stripe webhook must be public, otherwise can not receive stripe events
  "/api/webhook",

  // send emails, like submission approval or rejection emails
  "/api/send-email",

  // og images
  "/api/og",

  // draft mode
  "/api/draft",

  // machine-to-machine blog publisher, secured by BLOG_BOT_SECRET
  "/api/blog/generate",

  // test pages
  "/shadcn(/.*)?",
  "/loading(/.*)?",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /dashboard
 * @type {string[]}
 */
export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password",
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in (locale-independent)
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

/**
 * Extract the locale prefix from a pathname, e.g. "/zh-CN/search" -> "zh-CN".
 * Returns null when the pathname has no locale prefix.
 */
export function getLocaleFromPathname(pathname: string): string | null {
  const first = pathname.split("/")[1];
  return (routing.locales as readonly string[]).includes(first) ? first : null;
}

/**
 * Remove the locale prefix from a pathname, e.g. "/zh-CN/search" -> "/search".
 * Pathnames without a locale prefix are returned unchanged.
 */
export function stripLocale(pathname: string): string {
  if (!getLocaleFromPathname(pathname)) {
    return pathname;
  }
  return `/${pathname.split("/").slice(2).join("/")}`;
}

/**
 * The default redirect path after logging in. URLs are locale-less
 * (localePrefix: "never"), so no prefix is applied; the argument is kept for
 * call-site compatibility.
 */
export function defaultLoginRedirect(_locale?: string | null): string {
  return DEFAULT_LOGIN_REDIRECT;
}
