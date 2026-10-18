import { siteConfig } from "@/config/site";
import type { MetadataRoute } from "next";

const BASE_URL = siteConfig.url.replace(/\/$/, "");

/**
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 *
 * Keep crawlers out of the CMS, API and authenticated areas. Everything
 * public is discoverable from /sitemap.xml.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/studio",
          "/api/",
          "/dashboard",
          "/settings",
          "/submit",
          "/edit/",
          "/payment/",
          "/publish/",
          "/auth/",
          "/search",
          "/unsubscribe",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
