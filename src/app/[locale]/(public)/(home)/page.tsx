import BlogGrid from "@/components/blog/blog-grid";
import { CategoryGroupsGrid } from "@/components/home/category-groups-grid";
import { FeaturedToolsRow } from "@/components/home/featured-tools-row";
import { HomeSearchFilter } from "@/components/home/home-search-filter";
import { ScenarioLists } from "@/components/home/scenario-lists";
import ItemGrid from "@/components/item/item-grid";
import EmptyGrid from "@/components/shared/empty-grid";
import CustomPagination from "@/components/shared/pagination";
import { siteConfig } from "@/config/site";
import { getItems } from "@/data/item";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  DEFAULT_SORT,
  ITEMS_PER_PAGE,
  SORT_FILTER_LIST,
} from "@/lib/constants";
import { constructMetadata } from "@/lib/metadata";
import type {
  BlogPostListOfLatestQueryResult,
  ItemListOfFeaturedQueryResult,
  ItemListOfLatestQueryResult,
  SponsorItemListQueryResult,
} from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blogPostListOfLatestQuery,
  itemListOfFeaturedQuery,
  itemListOfLatestQuery,
  sponsorItemListQuery,
} from "@/sanity/lib/queries";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "zh-CN" | "en";
  return constructMetadata({
    canonicalUrl: `${siteConfig.url}/`,
    locale,
  });
}

const FEATURED_COUNT = 6;
const LATEST_COUNT = 8;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  console.log("HomePage, searchParams", searchParams);

  const sponsorItems =
    (await sanityFetch<SponsorItemListQueryResult>({
      query: sponsorItemListQuery,
    })) || [];
  // console.log("HomePage, sponsorItems", sponsorItems);
  const showSponsor = true;
  const hasSponsorItem = showSponsor && sponsorItems.length > 0;

  const {
    category,
    tag,
    sort,
    page,
    q: query,
    f: filter,
  } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    SORT_FILTER_LIST.find((item) => item.slug === sort) || DEFAULT_SORT;
  const currentPage = page ? Number(page) : 1;
  const { items, totalCount } = await getItems({
    category,
    tag,
    sortKey,
    reverse,
    query,
    filter,
    currentPage,
    hasSponsorItem,
  });
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  console.log("HomePage, totalCount", totalCount, ", totalPages", totalPages);

  const locale = (await getLocale()) as Locale;

  // huntifyai-style sections; all degrade gracefully on an empty site
  const [featuredItems, latestItems, latestPosts] = await Promise.all([
    sanityFetch<ItemListOfFeaturedQueryResult>({
      query: itemListOfFeaturedQuery,
      params: { count: FEATURED_COUNT },
    }),
    sanityFetch<ItemListOfLatestQueryResult>({
      query: itemListOfLatestQuery,
      params: { count: LATEST_COUNT },
    }),
    sanityFetch<BlogPostListOfLatestQueryResult>({
      query: blogPostListOfLatestQuery,
      params: { count: 3, locale },
    }),
  ]);

  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-16">
      {featuredItems && featuredItems.length > 0 && (
        <FeaturedToolsRow items={featuredItems} />
      )}

      <ScenarioLists />

      {latestItems && latestItems.length > 0 && (
        <section className="w-full flex flex-col gap-6">
          <h2 className="text-2xl font-bold">{t("Home.newTools")}</h2>
          <ItemGrid items={latestItems} sponsorItems={[]} />
        </section>
      )}

      {latestPosts && latestPosts.length > 0 && (
        <section className="w-full flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">
              {locale === "zh-CN" ? "最新文章" : "Latest Articles"}
            </h2>
            <Link href="/blog" className="text-sm link-underline">
              {t("Common.viewAll")}
            </Link>
          </div>
          <BlogGrid posts={latestPosts} />
        </section>
      )}

      <CategoryGroupsGrid />

      {/* all tools: query-driven grid with search & filters */}
      <section className="w-full flex flex-col gap-6">
        <h2 className="text-2xl font-bold">{t("Home.allTools")}</h2>
        <HomeSearchFilter urlPrefix="/" />
        {items?.length === 0 && <EmptyGrid />}
        {items && items.length > 0 && (
          <>
            <ItemGrid
              items={items}
              sponsorItems={sponsorItems}
              showSponsor={showSponsor}
            />
            <div className="mt-8 flex items-center justify-center">
              <CustomPagination routePrefix="/" totalPages={totalPages} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
