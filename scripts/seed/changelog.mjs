/**
 * Create the /changelog page in Sanity.
 *
 * The page is listed in the sitemap but has no CMS document out of the box,
 * so the route rendered an empty shell. This keeps the public changelog
 * honest: only entries that actually shipped are listed.
 *
 * Usage:
 *   node scripts/seed/changelog.mjs
 */
import "dotenv/config";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-08-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: "published",
});

const key = (prefix, n) => `${prefix}-${n}`;

const block = (text, style = "normal") => ({
  _type: "block",
  _key: key("b", Math.random().toString(36).slice(2, 9)),
  style,
  markDefs: [],
  children: [
    {
      _type: "span",
      _key: key("s", Math.random().toString(36).slice(2, 9)),
      text,
      marks: [],
    },
  ],
});

const bullet = (text) => ({
  ...block(text),
  listItem: "bullet",
  level: 1,
});

const body = [
  block(
    "DirHunt AI changes often while the directory is young. This page records visible product and content changes, newest first.",
  ),
  block("October 2026 — Phase 1 launch", "h2"),
  block(
    "The public directory opened with 81 hand-reviewed AI tools across 17 categories and 5 groups, plus a review blog with four launch articles.",
  ),
  bullet(
    "Every listing has a description, an introduction, categories and tags.",
  ),
  bullet("Search, category, tag and collection pages work without an account."),
  bullet(
    "Pricing and paid plans are not part of the launch scope; all listings are free to browse.",
  ),
  block("Editorial standards", "h2"),
  block(
    "Our review method is published at /blog/how-we-review-ai-tools. In short: we test the workflow each tool claims to do, record what the free tier actually allows, and update a listing when the product changes in a way that affects the decision.",
  ),
  block("What is next", "h2"),
  block(
    "More tools in the writing, coding and video categories; Chinese translations for listings; and a public submission flow for tool makers. Dates will be added here when each ships.",
  ),
];

await client.createOrReplace({
  _id: "page-changelog",
  _type: "page",
  title: "Changelog",
  slug: { _type: "slug", current: "changelog" },
  excerpt: "Product and content updates for DirHunt AI.",
  body,
  publishDate: "2026-10-18T09:00:00Z",
});

console.log("changelog page created");
