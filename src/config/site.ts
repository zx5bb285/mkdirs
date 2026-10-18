import type { SiteConfig } from "@/types";

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
).replace(/\/$/, "");
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "DirHunt AI";

// human copy lives in src/messages/{locale}.json and is resolved with
// next-intl: tagline/description are message keys ("Site.tagline" etc.)
export const siteConfig: SiteConfig = {
  name: SITE_NAME,
  tagline: "Site.tagline",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Discover and compare the best AI tools, software and resources. Curated reviews, free alternatives and practical guides, updated every week.",
  keywords: (
    process.env.NEXT_PUBLIC_SITE_KEYWORDS ||
    "AI tools,software directory,AI tools directory,tool reviews,free alternatives,best software,productivity tools"
  )
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean),
  author: process.env.NEXT_PUBLIC_SITE_AUTHOR || SITE_NAME,
  url: SITE_URL,
  logo: "/logo.png",
  // dark-mode variant (inverse mark) so the logo stays legible on dark headers
  logoDark: "/logo-dark.png",
  // please increase the version number when you update the image
  image: `${SITE_URL}/og.png?v=2`,
  mail: process.env.NEXT_PUBLIC_SITE_MAIL || "hello@dirhuntai.com",
  utm: {
    source: new URL(SITE_URL).hostname,
    medium: "referral",
    campaign: "navigation",
  },
  links: {
    // leave it blank if you don't want to show the link (don't delete)
    twitter: process.env.NEXT_PUBLIC_SITE_TWITTER || "",
    github: process.env.NEXT_PUBLIC_SITE_GITHUB || "",
    youtube: process.env.NEXT_PUBLIC_SITE_YOUTUBE || "",
  },
};
