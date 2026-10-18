import BlogGrid from "@/components/blog/blog-grid";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import EmptyGrid from "@/components/shared/empty-grid";
import { HeaderSection } from "@/components/shared/header-section";
import CustomPagination from "@/components/shared/pagination";
import { siteConfig } from "@/config/site";
import { getBlogs } from "@/data/blog";
import { type Locale, localePath } from "@/i18n/routing";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { constructMetadata } from "@/lib/metadata";
import type { BlogCategoryMetadateQueryResult } from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import { blogCategoryMetadateQuery } from "@/sanity/lib/queries";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: Locale; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}): Promise<Metadata | undefined> {
  const category = await sanityFetch<BlogCategoryMetadateQueryResult>({
    query: blogCategoryMetadateQuery,
    params: { slug: params.slug, locale: params.locale },
  });
  if (!category) {
    console.warn(
      `generateMetadata, category not found for slug: ${params.slug}`,
    );
    return;
  }

  const page = Number(
    (searchParams as { page?: string } | undefined)?.page ?? "1",
  );
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
  const base = `/blog/category/${params.slug}`;

  return constructMetadata({
    title: category.name,
    description: category.description || category.name,
    canonicalUrl:
      currentPage > 1
        ? `${siteConfig.url}${base}?page=${currentPage}`
        : `${siteConfig.url}${base}`,
    locale: params.locale,
  });
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: { locale: Locale; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const category = await sanityFetch<BlogCategoryMetadateQueryResult>({
    query: blogCategoryMetadateQuery,
    params: { slug: params.slug, locale: params.locale },
  });

  const { page } = searchParams as { [key: string]: string };
  const currentPage = page ? Number(page) : 1;
  const { posts, totalCount } = await getBlogs({
    category: params.slug,
    currentPage,
    locale: params.locale,
  });
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const breadcrumb = breadcrumbJsonLd([
    {
      name: "Home",
      url: `${siteConfig.url}${localePath(params.locale, "/")}`,
    },
    {
      name: "Blog",
      url: `${siteConfig.url}${localePath(params.locale, "/blog")}`,
    },
    {
      name: category?.name || params.slug,
      url: `${siteConfig.url}${localePath(params.locale, `/blog/category/${params.slug}`)}`,
    },
  ]);

  return (
    <div>
      <div className="mb-8 w-full flex flex-col items-center justify-center gap-4">
        <HeaderSection
          labelAs="h1"
          label={category?.name || params.slug}
          titleAs="h2"
          title={category?.description || ""}
        />
      </div>

      <JsonLd data={breadcrumb} />

      {posts?.length === 0 && <EmptyGrid />}

      {posts && posts.length > 0 && (
        <div>
          <BlogGrid posts={posts} />

          <div className="mt-8 flex items-center justify-center">
            <CustomPagination
              routePrefix={`/blog/category/${params.slug}`}
              totalPages={totalPages}
            />
          </div>
        </div>
      )}
    </div>
  );
}
