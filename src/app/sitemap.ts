import { localePath } from "@/i18n/routing";
import { COLLECTIONS_PER_PAGE, ITEMS_PER_PAGE } from "@/lib/constants";
import type {
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
  ]);

  for (const item of itemListQueryResult) {
    if (item.slug) {
      pushLocalized(`/item/${item.slug}`, new Date(item._updatedAt), {
        priority: 0.6,
        changeFrequency: "weekly",
      });
    }
  }

  const pageCount = Math.ceil(itemListQueryResult.length / ITEMS_PER_PAGE);
  for (let i = 2; i <= pageCount; i++) {
    pushLocalized(`/?page=${i}`, new Date(), {
      priority: 0.5,
      changeFrequency: "daily",
    });
  }

  for (const category of categoryListQueryResult) {
    if (!category.slug) continue;
    pushLocalized(`/category/${category.slug}`, new Date(category._updatedAt), {
      priority: 0.7,
      changeFrequency: "weekly",
    });

    const pages = Math.ceil(category.count / ITEMS_PER_PAGE);
    for (let i = 2; i <= pages; i++) {
      pushLocalized(
        `/category/${category.slug}?page=${i}`,
        new Date(category._updatedAt),
        {
          priority: 0.5,
          changeFrequency: "weekly",
        },
      );
    }
  }

  for (const tag of tagListQueryResult) {
    if (!tag.slug) continue;
    pushLocalized(`/tag/${tag.slug}`, new Date(tag._updatedAt), {
      priority: 0.6,
      changeFrequency: "weekly",
    });

    const pages = Math.ceil(tag.count / ITEMS_PER_PAGE);
    for (let i = 2; i <= pages; i++) {
      pushLocalized(`/tag/${tag.slug}?page=${i}`, new Date(tag._updatedAt), {
        priority: 0.4,
        changeFrequency: "weekly",
      });
    }
  }

  for (const collection of collectionListQueryResult) {
    if (!collection.slug) continue;
    pushLocalized(
      `/collection/${collection.slug}`,
      new Date(collection._updatedAt),
      {
        priority: 0.7,
        changeFrequency: "weekly",
      },
    );

    const pages = Math.ceil(collection.count / COLLECTIONS_PER_PAGE);
    for (let i = 2; i <= pages; i++) {
      pushLocalized(
        `/collection/${collection.slug}?page=${i}`,
        new Date(collection._updatedAt),
        { priority: 0.5, changeFrequency: "weekly" },
      );
    }
  }

  for (const blog of blogListQueryResult) {
    if (!blog.slug) continue;
    pushLocalized(`/blog/${blog.slug}`, new Date(blog._updatedAt), {
      priority: 0.8,
      changeFrequency: "monthly",
    });
  }

  for (const blogCategory of blogCategoryListQueryResult) {
    if (!blogCategory.slug) continue;
    pushLocalized(
      `/blog/category/${blogCategory.slug}`,
      new Date(blogCategory._updatedAt),
      { priority: 0.6, changeFrequency: "weekly" },
    );

    const pages = Math.ceil(blogCategory.count / ITEMS_PER_PAGE);
    for (let i = 2; i <= pages; i++) {
      pushLocalized(
        `/blog/category/${blogCategory.slug}?page=${i}`,
        new Date(blogCategory._updatedAt),
        { priority: 0.4, changeFrequency: "weekly" },
      );
    }
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
