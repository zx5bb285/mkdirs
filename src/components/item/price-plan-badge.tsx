"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const BADGE_STYLES: Record<string, string> = {
  free: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  pro: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
  sponsor:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
};

export function PricePlanBadge({
  pricePlan,
  className,
}: {
  pricePlan?: string | null;
  className?: string;
}) {
  const t = useTranslations("Item");
  if (!pricePlan) return null;

  const plan = pricePlan.toLowerCase();
  const style = BADGE_STYLES[plan];
  if (!style) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0",
        style,
        className,
      )}
    >
      {t(plan)}
    </span>
  );
}
