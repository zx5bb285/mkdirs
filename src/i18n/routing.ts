import { defineRouting } from "next-intl/routing";

// https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing
export const routing = defineRouting({
  locales: ["zh-CN", "en"],
  // English is the primary SEO locale. Both languages share the same URL
  // structure (/blog/...); the active locale is stored in the NEXT_LOCALE
  // cookie and resolved by the middleware, so URLs never contain /en or
  // /zh-CN. Crawlers without the cookie see English (the default).
  defaultLocale: "en",
  localePrefix: "never",
});

export type Locale = (typeof routing.locales)[number];

/**
 * Build a path for the current `localePrefix` strategy. With
 * `localePrefix: "never"` every locale shares the same unprefixed URL.
 *
 * `localePath("en", "/blog")` -> "/blog"
 * `localePath("zh-CN", "/blog")` -> "/blog"
 */
export function localePath(_locale: string, path = "/"): string {
  if (path === "/" || path === "") return "";
  return path.startsWith("/") ? path : `/${path}`;
}
