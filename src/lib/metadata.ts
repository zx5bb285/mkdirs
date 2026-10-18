import { siteConfig } from "@/config/site";
import { type Locale, localePath, routing } from "@/i18n/routing";
import type { Metadata } from "next";

const OG_LOCALES: Record<string, string> = {
  "zh-CN": "zh_CN",
  en: "en_US",
};

const BASE_URL = siteConfig.url.replace(/\/$/, "");
const DEFAULT_LOCALE = routing.defaultLocale;

type MetadataType = "website" | "article" | "profile";

interface ConstructMetadataOptions {
  title?: string;
  description?: string;
  /**
   * Absolute URL or path (with or without a locale prefix). The helper strips
   * the origin and any leading locale, then emits the canonical URL for the
   * requested locale plus hreflang alternates for every supported locale.
   */
  canonicalUrl?: string;
  image?: string;
  noIndex?: boolean;
  locale?: Locale;
  type?: MetadataType;
  /** Article metadata (used when type === "article") */
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
  section?: string;
  keywords?: string[];
  /** Override the auto-generated hreflang map (e.g. translated slugs) */
  languages?: Record<string, string>;
}

/**
 * Build the metadata object for the current page.
 *
 * With `localePrefix: "never"` every page has exactly one locale-less URL,
 * so the canonical never points at a redirect or a duplicate language copy.
 */
export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  canonicalUrl,
  image = siteConfig.image,
  noIndex = false,
  locale = DEFAULT_LOCALE as Locale,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  tags,
  section,
  keywords = siteConfig.keywords,
  languages: languagesOverride,
}: ConstructMetadataOptions = {}): Metadata {
  const fullTitle =
    title && title !== siteConfig.name
      ? `${title} - ${siteConfig.name}`
      : siteConfig.name;

  // A canonical pointing at another origin (syndicated article) must be used
  // verbatim; locale-prefixing it would break the canonical relationship.
  const isExternalCanonical =
    !!canonicalUrl &&
    /^https?:\/\//.test(canonicalUrl) &&
    !canonicalUrl.startsWith(BASE_URL);

  const path =
    canonicalUrl && !isExternalCanonical
      ? normalizePath(canonicalUrl)
      : undefined;
  const canonical = isExternalCanonical
    ? canonicalUrl
    : path !== undefined
      ? `${BASE_URL}${localePath(locale, path)}`
      : undefined;

  // With `localePrefix: "never"` both languages share one URL, so there are
  // no distinct hreflang targets to advertise. Only explicit overrides (if a
  // caller ever has truly separate translated slugs) are emitted.
  const languages = languagesOverride;

  const otherLocale = locale === "en" ? "zh-CN" : "en";
  const twitterHandle = toTwitterHandle(siteConfig.links.twitter);

  return {
    title: fullTitle,
    description,
    keywords,
    creator: siteConfig.author,
    authors: authors?.length
      ? authors.map((name) => ({ name, url: siteConfig.url }))
      : [{ name: siteConfig.author, url: siteConfig.url }],
    applicationName: siteConfig.name,
    alternates: {
      ...(canonical ? { canonical } : {}),
      ...(languages ? { languages } : {}),
      types: {
        "application/rss+xml": `${BASE_URL}/feed.xml`,
      },
    },
    openGraph: {
      type,
      locale: OG_LOCALES[locale] ?? "zh_CN",
      alternateLocale: OG_LOCALES[otherLocale],
      // og:url must be the page itself, not the site root
      url: canonical ?? BASE_URL,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      images: image ? [{ url: image, alt: fullTitle }] : undefined,
      ...(type === "article" && {
        publishedTime,
        modifiedTime: modifiedTime ?? publishedTime,
        authors,
        tags,
        section,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: image ? [image] : undefined,
      ...(twitterHandle ? { site: twitterHandle, creator: twitterHandle } : {}),
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-32x32.png",
      apple: "/apple-touch-icon.png",
    },
    metadataBase: new URL(BASE_URL),
    manifest: "/site.webmanifest",
    robots: noIndex
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

/**
 * Normalize an absolute URL or path into a locale-less route path.
 * Returns "" for the home page.
 */
export function normalizePath(input: string): string {
  let path = input.trim();
  if (path.startsWith(BASE_URL)) {
    path = path.slice(BASE_URL.length);
  } else if (/^https?:\/\//.test(path)) {
    // absolute URL on another origin: keep only the pathname
    try {
      path = new URL(path).pathname;
    } catch {
      // ignore invalid URLs and treat them as paths
    }
  }
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  // strip an existing locale prefix so callers may pass either form
  const first = path.split("/")[1];
  if ((routing.locales as readonly string[]).includes(first)) {
    path = `/${path.split("/").slice(2).join("/")}`;
  }
  // keep query strings (pagination) but drop duplicate slashes/trailing slash
  const [pathname, query] = path.split("?");
  const normalized =
    pathname === "/"
      ? ""
      : pathname.replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  return query ? `${normalized}?${query}` : normalized;
}

function toTwitterHandle(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/(?:x|twitter)\.com\/@?([^/?#]+)/i);
  if (match) return `@${match[1]}`;
  if (url.startsWith("@")) return url;
  return undefined;
}
