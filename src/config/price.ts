import { PricePlans } from "@/lib/submission";
import type { PriceConfig } from "@/types";

// description/benefits/limitations/priceSuffix are message keys
// ("Price.free.description" etc.), resolved with next-intl
export const priceConfig: PriceConfig = {
  plans: [
    {
      title: PricePlans.FREE,
      description: "Price.free.description",
      benefits: [
        "Price.free.benefit1",
        "Price.free.benefit2",
        "Price.free.benefit3",
        "Price.free.benefit4",
      ],
      limitations: ["Price.free.limitation1", "Price.free.limitation2"],
      price: 0,
      priceSuffix: "",
      stripePriceId: null,
    },
    {
      title: PricePlans.PRO,
      description: "Price.pro.description",
      benefits: [
        "Price.pro.benefit1",
        "Price.pro.benefit2",
        "Price.pro.benefit3",
        "Price.pro.benefit4",
        "Price.pro.benefit5",
        "Price.pro.benefit6",
      ],
      limitations: [],
      price: 9.9,
      priceSuffix: "",
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    },
    {
      title: PricePlans.SPONSOR,
      description: "Price.sponsor.description",
      benefits: [
        "Price.sponsor.benefit1",
        "Price.sponsor.benefit2",
        "Price.sponsor.benefit3",
        "Price.sponsor.benefit4",
        "Price.sponsor.benefit5",
        "Price.sponsor.benefit6",
      ],
      limitations: [],
      price: 19.9,
      priceSuffix: "Price.sponsor.priceSuffix",
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SPONSOR_PRICE_ID,
    },
  ],
};

// Phase 1 ships without Stripe. A paid plan is only rendered when its price
// id is configured, so the UI never links to a checkout that would fail.
export const isProPlanEnabled = Boolean(
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
);

export const isSponsorPlanEnabled = Boolean(
  process.env.NEXT_PUBLIC_STRIPE_SPONSOR_PRICE_ID,
);

export const visiblePricePlans = priceConfig.plans.filter((plan) => {
  const title = plan.title.toLowerCase();
  if (title === PricePlans.PRO.toLowerCase()) return isProPlanEnabled;
  if (title === PricePlans.SPONSOR.toLowerCase()) return isSponsorPlanEnabled;
  return true;
});
