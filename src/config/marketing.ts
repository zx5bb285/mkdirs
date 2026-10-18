import type { MarketingConfig } from "@/types";

// title values are message keys ("Nav.search" etc.), resolved with next-intl
export const marketingConfig: MarketingConfig = {
  menus: [
    {
      title: "Nav.search",
      href: "/search",
      icon: "search",
    },
    {
      title: "Nav.category",
      href: "/category",
      icon: "category",
    },
    {
      title: "Nav.collection",
      href: "/collection",
      icon: "collection",
    },
    {
      title: "Nav.blog",
      href: "/blog",
      icon: "blog",
    },
    {
      title: "Nav.pricing",
      href: "/pricing",
      icon: "pricing",
    },
    {
      title: "Nav.submit",
      href: "/submit",
      icon: "submit",
    },
  ],
};
