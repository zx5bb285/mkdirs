import ItemGrid from "@/components/item/item-grid";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import EmptyGrid from "@/components/shared/empty-grid";
import { HeaderSection } from "@/components/shared/header-section";
import CustomPagination from "@/components/shared/pagination";
import { siteConfig } from "@/config/site";
import { getItems } from "@/data/item";
import type { Locale } from "@/i18n/routing";
import {
  DEFAULT_SORT,
  ITEMS_PER_PAGE,
  SORT_FILTER_LIST,
} from "@/lib/constants";
import { constructMetadata } from "@/lib/metadata";
import type {
  SponsorItemListQueryResult,
  TagQueryResult,
} from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import { sponsorItemListQuery, tagQuery } from "@/sanity/lib/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: Locale; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}): Promise<Metadata | undefined> {
  const tag = await sanityFetch<TagQueryResult>({
    query: tagQuery,
    params: { slug: params.slug },
  });
  if (!tag) {
    console.warn(`generateMetadata, tag not found for slug: ${params.slug}`);
    return;
  }

  const page = Number(
    (searchParams as { page?: string } | undefined)?.page ?? "1",
  );
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
  const base = `/tag/${params.slug}`;

  return constructMetadata({
    title: `${tag.name}`,
    description: tag.description || `AI tools tagged ${tag.name}.`,
    canonicalUrl:
      currentPage > 1
        ? `${siteConfig.url}${base}?page=${currentPage}`
        : `${siteConfig.url}${base}`,
    locale: params.locale,
    // Empty taxonomy pages stay reachable but out of the index.
    noIndex: tag.count === 0,
  });
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [tag, sponsorItemsResult] = await Promise.all([
    sanityFetch<TagQueryResult>({
      query: tagQuery,
      params: { slug: params.slug },
    }),
    sanityFetch<SponsorItemListQueryResult>({
      query: sponsorItemListQuery,
    }),
  ]);
  if (!tag) {
    return notFound();
  }
  const sponsorItems = sponsorItemsResult || [];
  // console.log("TagPage, sponsorItems", sponsorItems);
  const showSponsor = true;
  const hasSponsorItem = showSponsor && sponsorItems.length > 0;

  const { sort, page } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    SORT_FILTER_LIST.find((item) => item.slug === sort) || DEFAULT_SORT;
  const currentPage = page ? Number(page) : 1;
  const { items, totalCount } = await getItems({
    tag: params.slug,
    sortKey,
    reverse,
    currentPage,
  });
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  console.log("TagPage, totalCount", totalCount, ", totalPages", totalPages);

  const tagUrl = `${siteConfig.url}/tag/${params.slug}`;
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: siteConfig.url },
    { name: "Tags", url: `${siteConfig.url}/tag` },
    { name: tag.name, url: tagUrl },
  ]);
  const itemList =
    items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${tag.name} tools`,
          numberOfItems: totalCount,
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${siteConfig.url}/item/${item.slug.current}`,
            name: item.name,
          })),
        }
      : null;

  return (
    <div>
      <JsonLd data={itemList ? [breadcrumb, itemList] : breadcrumb} />
      <HeaderSection
        label="Tag"
        titleAs="h1"
        title={tag.name}
        subtitle={tag.description || undefined}
        className="mb-8"
      />

      {/* when no items are found */}
      {items?.length === 0 && <EmptyGrid />}

      {/* when items are found */}
      {items && items.length > 0 && (
        <section className="">
          <ItemGrid
            items={items}
            sponsorItems={sponsorItems}
            showSponsor={showSponsor}
          />

          <div className="mt-8 flex items-center justify-center">
            <CustomPagination
              routePrefix={`/tag/${params.slug}`}
              totalPages={totalPages}
            />
          </div>
        </section>
      )}
    </div>
  );
}
