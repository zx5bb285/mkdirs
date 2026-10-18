import { getTranslations } from "next-intl/server";

export default async function EmptyGrid() {
  const t = await getTranslations();
  return (
    <div>
      <div className="my-8 h-32 w-full flex items-center justify-center">
        <p className="font-medium text-muted-foreground">
          {t("Search.noResults")}
        </p>
      </div>
    </div>
  );
}
