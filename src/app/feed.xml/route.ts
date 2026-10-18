import { siteConfig } from "@/config/site";
import { type Locale, localePath, routing } from "@/i18n/routing";
import type { BlogPostListOfLatestQueryResult } from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import { blogPostListOfLatestQuery } from "@/sanity/lib/queries";

const BASE_URL = siteConfig.url.replace(/\/$/, "");
const FEED_SIZE = 50;

/**
 * RSS 2.0 feed: /feed.xml (optionally /feed.xml?locale=en)
 *
 * Referenced from every page via <link rel="alternate"> in
 * src/lib/metadata.ts.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("locale");
  const locale = (
    requested && (routing.locales as readonly string[]).includes(requested)
      ? requested
      : routing.defaultLocale
  ) as Locale;

  const posts =
    (await sanityFetch<BlogPostListOfLatestQueryResult>({
      query: blogPostListOfLatestQuery,
      params: { count: FEED_SIZE, locale },
      disableCache: true,
    })) ?? [];

  const isZh = locale === "zh-CN";
  const title = `${siteConfig.name} Blog`;
  const description = isZh
    ? `${siteConfig.name} 的最新评测、工具推荐与实用指南`
    : `Reviews, tool roundups and practical guides from ${siteConfig.name}`;
  const lastBuildDate = posts[0]?.publishDate
    ? new Date(posts[0].publishDate)
    : new Date();

  const items = posts
    .map((post) => {
      const link = `${BASE_URL}${localePath(locale, `/blog/${post.slug?.current}`)}`;
      const pubDate = new Date(post.publishDate || post._createdAt);
      return [
        "    <item>",
        `      <title>${escapeXml(post.title || "")}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${pubDate.toUTCString()}</pubDate>`,
        post.author?.name
          ? `      <author>${escapeXml(post.author.name)}</author>`
          : "",
        post.excerpt
          ? `      <description>${escapeXml(post.excerpt)}</description>`
          : "",
        ...(post.categories?.length
          ? post.categories
              .filter((category) => category.name)
              .map(
                (category) =>
                  `      <category>${escapeXml(category.name || "")}</category>`,
              )
          : []),
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${BASE_URL}${localePath(locale, "/blog")}</link>
    <atom:link href="${BASE_URL}/feed.xml?locale=${locale}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(description)}</description>
    <language>${locale}</language>
    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
    <generator>Next.js</generator>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
