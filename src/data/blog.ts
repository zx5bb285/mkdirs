import type { Locale } from "@/i18n/routing";
import { POSTS_PER_PAGE } from "@/lib/constants";
import type { BlogPostListQueryResult } from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import { blogPostSimpleFields } from "@/sanity/lib/queries";

/**
 * get blogs from sanity
 */
export async function getBlogs({
  category,
  currentPage,
  locale,
}: {
  category?: string;
  currentPage: number;
  locale?: Locale;
}) {
  const { countQuery, dataQuery } = buildQuery(category, currentPage);
  const [totalCount, posts] = await Promise.all([
    sanityFetch<number>({ query: countQuery }),
    sanityFetch<BlogPostListQueryResult>({
      query: dataQuery,
      params: { locale: locale ?? "en" },
    }),
  ]);
  return { posts, totalCount };
}

/**
 * build count and data query for get blogs from sanity
 */
const buildQuery = (category?: string, currentPage = 1) => {
  const categoryCondition = category
    ? `&& "${category.replace(/"/g, '\\"')}" in categories[]->slug.current`
    : "";
  const offsetStart = (currentPage - 1) * POSTS_PER_PAGE;
  const offsetEnd = offsetStart + POSTS_PER_PAGE;

  // @sanity-typegen-ignore
  const countQuery = `count(*[_type == "blogPost" && defined(slug.current) && defined(publishDate)
       && publishDate <= now() && noIndex != true
       ${categoryCondition} ])`;
  // @sanity-typegen-ignore
  const dataQuery = `*[_type == "blogPost" && defined(slug.current) && defined(publishDate)
       && publishDate <= now() && noIndex != true
       ${categoryCondition} ] | order(publishDate desc) [${offsetStart}...${offsetEnd}] {
        ${blogPostSimpleFields}
    }`;
  return { countQuery, dataQuery };
};
