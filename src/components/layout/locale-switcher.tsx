"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const LOCALE_LABELS: Record<string, string> = {
  "zh-CN": "简体中文",
  en: "English",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LocaleSwitcher");
  const pathname = usePathname();
  const router = useRouter();

  const onSelectLocale = (nextLocale: string) => {
    // keep the current query string when switching locale
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(search ? `${pathname}${search}` : pathname, {
      locale: nextLocale,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("label")}>
          <LanguagesIcon className="size-5" />
          <span className="sr-only">{t("label")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((item) => (
          <DropdownMenuItem
            key={item}
            onClick={() => onSelectLocale(item)}
            className={locale === item ? "font-semibold text-primary" : ""}
          >
            {LOCALE_LABELS[item] || item}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
