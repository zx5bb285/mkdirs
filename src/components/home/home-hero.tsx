import { Icons } from "@/components/icons/icons";
import { CommandKbd } from "@/components/shared/command-palette";
import { buttonVariants } from "@/components/ui/button";
import { heroConfig } from "@/config/hero";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import HomeSearchBox from "./home-search-box";

interface HomeHeroProps {
  stats?: {
    toolCount?: number;
    categoryCount?: number;
  };
}

export default function HomeHero({ stats }: HomeHeroProps) {
  const t = useTranslations();
  const LabelIcon = Icons[heroConfig.label.icon];
  const toolCount = stats?.toolCount ?? 0;
  const categoryCount = stats?.categoryCount ?? 0;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="max-w-5xl flex flex-col items-center text-center gap-8">
        {heroConfig.label.href && (
          <Link
            href={heroConfig.label.href}
            target="_blank"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "px-4 rounded-full",
            )}
          >
            <span className="mr-2">🎉</span>
            <span>{t(heroConfig.label.text)}</span>
            <LabelIcon className="size-4" />
          </Link>
        )}

        {/* maybe font-sourceSans is better */}
        <h1 className="max-w-5xl font-bold text-balance text-3xl sm:text-4xl md:text-5xl">
          {t(heroConfig.title.first)}{" "}
          <span className="text-gradient_indigo-purple font-bold">
            {t(heroConfig.title.second)}
          </span>
        </h1>

        <p className="max-w-4xl text-balance text-muted-foreground sm:text-xl">
          {t(heroConfig.subtitle)}
        </p>

        <div className="w-full flex items-center gap-2">
          <HomeSearchBox urlPrefix="/" />
          <CommandKbd className="h-12 px-3" />
        </div>

        {/* stats badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="inline-flex items-center rounded-full border px-3 py-1 font-medium text-muted-foreground">
            {t("Hero.statsTools", { count: toolCount })}
          </span>
          <span className="inline-flex items-center rounded-full border px-3 py-1 font-medium text-muted-foreground">
            {t("Hero.statsCategories", { count: categoryCount })}
          </span>
          <span className="inline-flex items-center rounded-full border px-3 py-1 font-medium text-muted-foreground">
            {t("Hero.statsDailyUpdates")}
          </span>
        </div>
      </div>
    </div>
  );
}
