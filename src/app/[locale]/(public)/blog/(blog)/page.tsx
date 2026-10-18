import BlogGrid from "@/components/blog/blog-grid";
import { JsonLd } from "@/components/seo/json-ld";
import EmptyGrid from "@/components/shared/empty-grid";
import { HeaderSection } from "@/components/shared/header-section";
import CustomPagination from "@/components/shared/pagination";
import { siteConfig } from "@/config/site";
import { getBlogs } from "@/data/blog";
import { type Locale, localePath } from "@/i18n/routing";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { constructMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams?: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const { locale } = params;
  const page = Number(
    (searchParams as { page?: string } | undefined)?.page ?? "1",
  );
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
  const isZh = locale === "zh-CN";

  return constructMetadata({
    title: isZh ? "博客" : "Blog",
    description: isZh
      ? `阅读 ${siteConfig.name} 的最新评测、工具推荐与实用指南`
      : `Read the latest reviews, tool roundups and practical guides from ${siteConfig.name}`,
    canonicalUrl:
      currentPage > 1
        ? `${siteConfig.url}/blog?page=${currentPage}`
        : `${siteConfig.url}/blog`,
    locale,
  });
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { locale } = params;
  const { page } = searchParams as { [key: string]: string };
  const currentPage = page ? Number(page) : 1;
  const { posts, totalCount } = await getBlogs({ currentPage, locale });
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
  const t = await getTranslations();

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteConfig.name} Blog`,
    url: `${siteConfig.url}${localePath(locale, "/blog")}`,
    inLanguage: locale,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteConfig.url}${localePath(locale, `/blog/${post.slug.current}`)}`,
      datePublished: post.publishDate,
    })),
  };

  return (
    <div>
      <div className="mb-8 w-full flex flex-col items-center justify-center gap-4">
        <HeaderSection
          labelAs="h1"
          label={t("Nav.blog")}
          titleAs="h2"
          title={
            locale === "zh-CN"
              ? "最新评测、工具推荐与实用指南"
              : "Reviews, tool roundups and practical guides"
          }
        />
      </div>

      <JsonLd data={listJsonLd} />

      {posts?.length === 0 && <EmptyGrid />}

      {posts && posts.length > 0 && (
        <div>
          <BlogGrid posts={posts} />

          <div className="mt-8 flex items-center justify-center">
            <CustomPagination routePrefix="/blog" totalPages={totalPages} />
          </div>
        </div>
      )}
    </div>
  );
}
