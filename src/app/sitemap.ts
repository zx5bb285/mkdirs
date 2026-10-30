import { localePath } from "@/i18n/routing";
import type {
  AuthorListQueryForSitemapResult,
  BlogCategoryListQueryForSitemapResult,
  BlogListQueryForSitemapResult,
  CategoryListQueryForSitemapResult,
  CollectionListQueryForSitemapResult,
  ItemListQueryForSitemapResult,
  PageListQueryForSitemapResult,
  TagListQueryForSitemapResult,
} from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  authorListQueryForSitemap,
  blogCategoryListQueryForSitemap,
  blogListQueryForSitemap,
  categoryListQueryForSitemap,
  collectionListQueryForSitemap,
  itemListQueryForSitemap,
  pageListQueryForSitemap,
  tagListQueryForSitemap,
} from "@/sanity/lib/queries";
import type { MetadataRoute } from "next";

// The sitemap is generated from live CMS data. Regenerate it hourly so newly
// published items and posts are discoverable without a redeploy.
export const revalidate = 3600;

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
).replace(/\/$/, "");

/**
 * Google's limit is 50,000 URLs per sitemap
 *
 * https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapList: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  // Both languages share one unprefixed URL (localePrefix: "never"), so each
  // route is listed exactly once and no hreflang alternates are emitted.
  const pushLocalized = (
    routeUrl: string,
    lastModified: string | Date,
    options: {
      changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
      priority?: number;
    } = {},
  ) => {
    const url = `${SITE_URL}${localePath("", routeUrl)}`;
    if (seen.has(url)) return;
    seen.add(url);
    sitemapList.push({ url, lastModified, ...options });
  };

  // Only indexable public pages. Auth, search and dashboard routes are
  // intentionally excluded (they are noindex / auth-gated).
  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/category", priority: 0.8, changeFrequency: "weekly" },
    { path: "/tag", priority: 0.7, changeFrequency: "weekly" },
    { path: "/collection", priority: 0.8, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.9, changeFrequency: "daily" },
    { path: "/pricing", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.4, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/changelog", priority: 0.3, changeFrequency: "monthly" },
  ];

  for (const route of staticRoutes) {
    pushLocalized(route.path, new Date(), {
      priority: route.priority,
      changeFrequency: route.changeFrequency,
    });
  }

  const [
    itemListQueryResult,
    categoryListQueryResult,
    tagListQueryResult,
    collectionListQueryResult,
    blogListQueryResult,
    blogCategoryListQueryResult,
    pageListQueryResult,
    authorListQueryResult,
  ] = await Promise.all([
    sanityFetch<ItemListQueryForSitemapResult>({
      query: itemListQueryForSitemap,
    }),
    sanityFetch<CategoryListQueryForSitemapResult>({
      query: categoryListQueryForSitemap,
    }),
    sanityFetch<TagListQueryForSitemapResult>({
      query: tagListQueryForSitemap,
    }),
    sanityFetch<CollectionListQueryForSitemapResult>({
      query: collectionListQueryForSitemap,
    }),
    sanityFetch<BlogListQueryForSitemapResult>({
      query: blogListQueryForSitemap,
    }),
    sanityFetch<BlogCategoryListQueryForSitemapResult>({
      query: blogCategoryListQueryForSitemap,
    }),
    sanityFetch<PageListQueryForSitemapResult>({
      query: pageListQueryForSitemap,
    }),
    sanityFetch<AuthorListQueryForSitemapResult>({
      query: authorListQueryForSitemap,
    }),
  ]);

  for (const item of itemListQueryResult) {
    if (item.slug) {
      pushLocalized(`/item/${item.slug}`, new Date(item._updatedAt), {
        priority: 0.6,
        changeFrequency: "weekly",
      });
    }
  }

  // Paginated listing URLs are excluded: they duplicate the first page and
  // add no new indexable content. Their canonical points at themselves.

  for (const category of categoryListQueryResult) {
    if (!category.slug || category.count === 0) continue;
    pushLocalized(`/category/${category.slug}`, new Date(category._updatedAt), {
      priority: 0.7,
      changeFrequency: "weekly",
    });
  }

  for (const tag of tagListQueryResult) {
    if (!tag.slug || tag.count === 0) continue;
    pushLocalized(`/tag/${tag.slug}`, new Date(tag._updatedAt), {
      priority: 0.6,
      changeFrequency: "weekly",
    });
  }

  for (const collection of collectionListQueryResult) {
    if (!collection.slug || collection.count === 0) continue;
    pushLocalized(
      `/collection/${collection.slug}`,
      new Date(collection._updatedAt),
      {
        priority: 0.7,
        changeFrequency: "weekly",
      },
    );
  }

  for (const blog of blogListQueryResult) {
    if (!blog.slug) continue;
    pushLocalized(`/blog/${blog.slug}`, new Date(blog._updatedAt), {
      priority: 0.8,
      changeFrequency: "monthly",
    });
  }

  for (const blogCategory of blogCategoryListQueryResult) {
    if (!blogCategory.slug || blogCategory.count === 0) continue;
    pushLocalized(
      `/blog/category/${blogCategory.slug}`,
      new Date(blogCategory._updatedAt),
      { priority: 0.6, changeFrequency: "weekly" },
    );
  }

  for (const author of authorListQueryResult) {
    if (!author.slug) continue;
    pushLocalized(`/blog/author/${author.slug}`, new Date(author._updatedAt), {
      priority: 0.5,
      changeFrequency: "monthly",
    });
  }

  // Custom pages live at /[locale]/[slug] — not /page/[slug].
  for (const page of pageListQueryResult) {
    if (!page.slug) continue;
    pushLocalized(`/${page.slug}`, new Date(page._updatedAt), {
      priority: 0.4,
      changeFrequency: "yearly",
    });
  }

  return sitemapList;
}
