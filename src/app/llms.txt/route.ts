import { siteConfig } from "@/config/site";
import { localePath } from "@/i18n/routing";
import { sanityFetch } from "@/sanity/lib/fetch";

// Keep the file fresh when tools and posts are published.
export const revalidate = 3600;

type LlmsItem = {
  name: string | null;
  slug: string | null;
  description: string | null;
};

type LlmsCategory = {
  name: string | null;
  slug: string | null;
  count: number;
};

type LlmsPost = {
  title: string | null;
  slug: string | null;
  excerpt: string | null;
};

const ITEM_QUERY = `*[
  _type == "item"
  && defined(slug.current)
  && defined(publishDate)
  && forceHidden != true
  && sponsor != true
] | order(coalesce(featured, false) desc, publishDate desc) [0...50] {
  "name": coalesce(nameZh, name),
  "slug": slug.current,
  "description": coalesce(descriptionZh, description)
}`;

const CATEGORY_QUERY = `*[_type == "category" && defined(slug.current)] | order(priority desc) {
  "name": coalesce(nameZh, name),
  "slug": slug.current,
  "count": count(*[_type == "item" && defined(publishDate) && forceHidden != true && sponsor != true && references(^._id)])
}`;

const POST_QUERY = `*[
  _type == "blogPost"
  && defined(slug.current)
  && defined(publishDate)
  && publishDate <= now()
  && noIndex != true
] | order(publishDate desc) [0...20] {
  title,
  "slug": slug.current,
  excerpt
}`;

const SITE_URL = siteConfig.url.replace(/\/$/, "");

function link(label: string, path: string, description?: string) {
  const suffix = description
    ? `: ${description.replace(/\s+/g, " ").trim()}`
    : "";
  return `- [${label}](${SITE_URL}${localePath("en", path)})${suffix}`;
}

export async function GET() {
  const [items, categories, posts] = await Promise.all([
    sanityFetch<LlmsItem[]>({ query: ITEM_QUERY }),
    sanityFetch<LlmsCategory[]>({ query: CATEGORY_QUERY }),
    sanityFetch<LlmsPost[]>({ query: POST_QUERY }),
  ]);

  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `${siteConfig.name} is a curated directory of AI tools. Every listing links to the product's official site, and review pages state what was verified and when.`,
    "",
    "## Core pages",
    "",
    link("Home", "/", "Browse featured and recently added AI tools."),
    link("All categories", "/category", "Browse tools by category."),
    link(
      "Collections",
      "/collection",
      "Curated groups of tools for a specific job.",
    ),
    link("Blog", "/blog", "Reviews, comparisons and practical guides."),
    link("Pricing", "/pricing", "Listing and sponsorship options."),
    link(
      "About",
      "/about",
      `About the site and contact details: ${siteConfig.mail}.`,
    ),
    link("Sitemap", "/sitemap.xml", "Full list of indexable URLs."),
    "",
    "## Categories",
    "",
    ...categories
      .filter((category) => category.slug && category.count > 0)
      .map((category) =>
        link(
          category.name || category.slug || "Category",
          `/category/${category.slug}`,
          `${category.count} ${category.count === 1 ? "tool" : "tools"}`,
        ),
      ),
    "",
    "## Tools",
    "",
    ...items
      .filter((item) => item.slug)
      .map((item) =>
        link(
          item.name || item.slug || "AI tool",
          `/item/${item.slug}`,
          item.description || undefined,
        ),
      ),
    "",
    "## Blog posts",
    "",
    ...posts
      .filter((post) => post.slug)
      .map((post) =>
        link(
          post.title || post.slug || "Post",
          `/blog/${post.slug}`,
          post.excerpt || undefined,
        ),
      ),
    "",
    "## Contact",
    "",
    `Editorial corrections and listing questions: ${siteConfig.mail}`,
    "",
  ];

  return new Response(`${lines.join("\n").trim()}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
