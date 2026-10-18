import { PricePlanBadge } from "@/components/item/price-plan-badge";
import { Link } from "@/i18n/navigation";
import { urlForIcon } from "@/lib/image";
import type { ItemInfo } from "@/types";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

/**
 * Horizontal row of featured tool cards (huntifyai-style "featured tools")
 */
export function FeaturedToolsRow({ items }: { items: ItemInfo[] }) {
  const t = useTranslations();
  if (!items || items.length === 0) return null;

  return (
    <section className="w-full flex flex-col gap-6">
      <SectionHeader
        title={t("Home.featuredTools")}
        description={t("Home.featuredToolsDesc")}
        moreHref="/search?f=featured==true"
        moreLabel={t("Common.viewMore")}
      />

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {items.map((item) => {
          const iconProps = item?.icon ? urlForIcon(item.icon) : null;
          return (
            <div
              key={item._id}
              className="border rounded-lg p-5 flex flex-col gap-3 min-w-[260px] sm:min-w-[300px] max-w-[300px] snap-start shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                {iconProps && (
                  <Image
                    src={iconProps.src}
                    alt={item.icon.alt || `icon of ${item.name}`}
                    title={item.icon.alt || `icon of ${item.name}`}
                    width={40}
                    height={40}
                    className="object-cover rounded-md shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <Link
                    href={`/item/${item.slug.current}`}
                    className="truncate text-lg font-medium hover:text-primary"
                  >
                    {item.name}
                  </Link>
                  <PricePlanBadge pricePlan={item.pricePlan} />
                </div>
              </div>

              <Link href={`/item/${item.slug.current}`}>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {item.description}
                </p>
              </Link>

              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline self-start"
                >
                  {t("Common.tryIt")}
                  <ArrowRightIcon className="size-3.5" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SectionHeader({
  title,
  description,
  moreHref,
  moreLabel,
}: {
  title: string;
  description?: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  const t = useTranslations();
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {moreHref && (
        <Link
          href={moreHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary shrink-0"
        >
          {moreLabel || t("Common.viewMore")}
          <ArrowRightIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}
