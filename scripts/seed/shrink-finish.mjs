/**
 * Finish the shrink pass after a dropped connection.
 *
 * `shrink.mjs` already hid the 69 extra tools, marked four posts noIndex and
 * removed the unused categories. This only removes the remaining tags, blog
 * categories and the now-empty productivity group, with retries on the
 * connection errors Sanity's API occasionally returns.
 *
 * Usage:
 *   node scripts/seed/shrink-finish.mjs
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

const KEEP_TAGS = new Set([
  "writing",
  "chatbot",
  "research",
  "art",
  "assistant",
  "coding",
  "design",
  "developer-tools",
  "free",
  "copywriting",
]);

const KEEP_BLOG_CATEGORIES = new Set(["comparisons", "guides"]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function remove(id, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await client.delete(id);
      return true;
    } catch (error) {
      if (attempt === attempts) {
        console.error(`failed after ${attempts} tries: ${id}`, error.message);
        return false;
      }
      console.warn(`retry ${attempt} for ${id}: ${error.message}`);
      await sleep(500 * attempt);
    }
  }
  return false;
}

async function main() {
  const [tags, blogCategories, groups] = await Promise.all([
    client.fetch(`*[_type=="tag"]{_id,"slug":slug.current}`),
    client.fetch(`*[_type=="blogCategory"]{_id,"slug":slug.current}`),
    client.fetch(`*[_type=="group"]{_id,"slug":slug.current}`),
  ]);

  let deleted = 0;
  for (const tag of tags) {
    if (KEEP_TAGS.has(tag.slug)) continue;
    if (await remove(tag._id)) deleted++;
    await sleep(150);
  }

  for (const category of blogCategories) {
    if (KEEP_BLOG_CATEGORIES.has(category.slug)) continue;
    if (await remove(category._id)) deleted++;
    await sleep(150);
  }

  for (const group of groups) {
    if (group.slug !== "ai-productivity") continue;
    if (await remove(group._id)) deleted++;
  }

  console.log(`deleted ${deleted} documents`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
