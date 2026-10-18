import { siteConfig } from "@/config/site";
import type { HeroConfig } from "@/types";

// human copy is stored in src/messages/{locale}.json and resolved with
// next-intl: these values are message keys ("Hero.titleFirst" etc.)
export const heroConfig: HeroConfig = {
  title: {
    first: "Hero.titleFirst",
    second: "Hero.titleSecond",
  },
  subtitle: "Hero.subtitle",
  label: {
    text: "Hero.labelText",
    // Hidden on the homepage when no X/Twitter account is configured.
    href: siteConfig.links.twitter,
    icon: "twitter",
  },
};
