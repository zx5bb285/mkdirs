import type { FooterConfig } from "@/types";

// title values are message keys ("Footer.product" etc.), resolved with next-intl
export const footerConfig: FooterConfig = {
  links: [
    {
      title: "Footer.product",
      items: [
        { title: "Footer.search", href: "/search" },
        { title: "Footer.collection", href: "/collection" },
        { title: "Footer.category", href: "/category" },
        { title: "Footer.tag", href: "/tag" },
      ],
    },
    {
      title: "Footer.resources",
      items: [
        { title: "Footer.blog", href: "/blog" },
        { title: "Footer.pricing", href: "/pricing" },
        { title: "Footer.submit", href: "/submit" },
        { title: "Footer.studio", href: "/studio", external: true },
      ],
    },
    {
      title: "Footer.pages",
      items: [
        { title: "Footer.collection", href: "/collection" },
        { title: "Footer.category", href: "/category" },
        { title: "Footer.tag", href: "/tag" },
        { title: "Footer.blog", href: "/blog" },
      ],
    },
    {
      title: "Footer.company",
      items: [
        { title: "Footer.about", href: "/about" },
        { title: "Footer.privacy", href: "/privacy" },
        { title: "Footer.terms", href: "/terms" },
        { title: "Footer.sitemap", href: "/sitemap.xml" },
      ],
    },
  ],
};
