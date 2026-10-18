import { SectionHeader } from "@/components/home/featured-tools-row";
import { Link } from "@/i18n/navigation";
import { sanityFetch } from "@/sanity/lib/fetch";
import { groupListWithCountQuery } from "@/sanity/lib/queries";
import { getTranslations } from "next-intl/server";

type CategoryWithCount = {
  _id: string;
  name: string;
  slug: { current: string };
  count: number;
};

type GroupWithCategories = {
  _id: string;
  name: string;
  slug: { current: string };
  categories: CategoryWithCount[];
};

/**
 * Browse-by-category grid: groups with category chips and public item counts
 */
export async function CategoryGroupsGrid() {
  // async server components must use getTranslations (not useTranslations)
  const t = await getTranslations();

  const groups =
    (await sanityFetch<GroupWithCategories[]>({
      query: groupListWithCountQuery,
    })) || [];

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      categories: (group.categories || []).filter((c) => c.count > 0),
    }))
    .filter((group) => group.categories.length > 0);

  if (visibleGroups.length === 0) return null;

  return (
    <section className="w-full flex flex-col gap-6">
      <SectionHeader
        title={t("Home.categoriesTitle")}
        moreHref="/category"
        moreLabel={t("Common.viewAll")}
      />

      <div className="grid gap-8 md:grid-cols-2">
        {visibleGroups.map((group) => (
          <div key={group._id} className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">{group.name}</h3>
            <div className="flex flex-wrap gap-2">
              {group.categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/category/${category.slug.current}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  {category.name}
                  <span className="text-xs bg-muted rounded-full px-1.5 py-0.5 tabular-nums">
                    {category.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
