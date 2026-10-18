import { SectionHeader } from "@/components/home/featured-tools-row";
import { scenarioList } from "@/config/scenario";
import { Link } from "@/i18n/navigation";
import { urlForIcon } from "@/lib/image";
import { sanityFetch } from "@/sanity/lib/fetch";
import { itemTopOfCategoryQuery } from "@/sanity/lib/queries";
import type { ItemInfo } from "@/types";
import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

/**
 * "Find tools by scenario": ranked top-N lists per category
 */
export async function ScenarioLists() {
  // async server components must use getTranslations (not useTranslations)
  const t = await getTranslations();

  const lists = await Promise.all(
    scenarioList.map(async (scenario) => {
      const items = await sanityFetch<ItemInfo[]>({
        query: itemTopOfCategoryQuery,
        params: {
          categorySlug: scenario.categorySlug,
          count: scenario.count ?? 6,
        },
      });
      return { scenario, items: items || [] };
    }),
  );

  // hide scenarios whose category has no published items
  const visibleLists = lists.filter(({ items }) => items.length > 0);
  if (visibleLists.length === 0) return null;

  return (
    <section className="w-full flex flex-col gap-6">
      <SectionHeader
        title={t("Home.browseByScenario")}
        description={t("Home.featuredToolsDesc")}
      />

      <div className="grid gap-8 md:grid-cols-2">
        {visibleLists.map(({ scenario, items }) => (
          <div key={scenario.key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                <Link
                  href={`/category/${scenario.categorySlug}`}
                  className="hover:text-primary"
                >
                  {t(scenario.titleKey)}
                </Link>
              </h3>
              <Link
                href={`/category/${scenario.categorySlug}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                {t("Common.viewAll")}
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>

            <ol className="flex flex-col">
              {items.map((item, index) => {
                const iconProps = item?.icon ? urlForIcon(item.icon) : null;
                return (
                  <li
                    key={item._id}
                    className="flex items-center gap-3 py-2.5 border-b last:border-b-0"
                  >
                    <span className="w-6 text-center text-lg font-bold text-muted-foreground/70 tabular-nums shrink-0">
                      {index + 1}
                    </span>
                    {iconProps ? (
                      <Image
                        src={iconProps.src}
                        alt={item.icon.alt || `icon of ${item.name}`}
                        width={28}
                        height={28}
                        className="object-cover rounded-md shrink-0"
                      />
                    ) : (
                      <span className="size-7 rounded-md bg-muted shrink-0" />
                    )}
                    <Link
                      href={`/item/${item.slug.current}`}
                      className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[240px]">
                      {item.description}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
