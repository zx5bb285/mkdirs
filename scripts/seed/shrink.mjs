/**
 * Shrink the directory to a small, reviewable first batch.
 *
 * The initial seed published 81 tools, 17 categories, 46 tags and six posts at
 * once. That is more than anyone has reviewed, and it reads as bulk-generated
 * content to search engines. This script:
 *
 *   - keeps 12 tools visible and hides the rest (`forceHidden`)
 *   - keeps 5 categories and 10 tags; deletes the unused ones
 *   - rebuilds collection membership around the kept tools
 *   - marks four posts `noIndex` so only the methodology page and one review
 *     stay in the index
 *
 * Run `node scripts/seed/seed.mjs backup` first. The pre-shrink state is also
 * in /tmp from the launch run.
 *
 * Usage:
 *   node scripts/seed/shrink.mjs
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

const ref = (id) => ({ _type: "reference", _ref: id });

const KEEP_TOOLS = new Set([
  "chatgpt",
  "claude",
  "perplexity",
  "grammarly",
  "jasper",
  "copy-ai",
  "midjourney",
  "canva",
  "runway",
  "elevenlabs",
  "cursor",
  "github-copilot",
]);

// Merged categories: Canva moves to image/design, ElevenLabs to video/audio.
const CATEGORY_OVERRIDES = {
  canva: "ai-image-generators",
  elevenlabs: "ai-video-generators",
};

const KEEP_CATEGORIES = new Set([
  "ai-chatbots",
  "ai-writing-assistants",
  "ai-image-generators",
  "ai-video-generators",
  "ai-code-assistants",
]);

const CATEGORY_NAMES = {
  "ai-image-generators": "AI Image & Design",
  "ai-video-generators": "AI Video & Audio",
};

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

const COLLECTIONS = {
  "ai-tools-for-writing": [
    "chatgpt",
    "claude",
    "perplexity",
    "grammarly",
    "jasper",
    "copy-ai",
  ],
  "ai-tools-for-designers": ["midjourney", "canva", "runway", "elevenlabs"],
  "ai-tools-for-developers": ["cursor", "github-copilot", "chatgpt", "claude"],
  "ai-tools-for-video-creators": [
    "runway",
    "elevenlabs",
    "midjourney",
    "canva",
  ],
  "ai-tools-for-productivity": ["chatgpt", "claude", "perplexity", "grammarly"],
};

const NOINDEX_POSTS = new Set([
  "best-ai-coding-assistants",
  "best-ai-video-generators",
  "best-audiobook-apps-2026",
  "best-free-video-editing-software-2026",
]);

const KEEP_BLOG_CATEGORIES = new Set(["comparisons", "guides"]);

async function main() {
  const [categories, tags, items, posts, blogCategories, groups] =
    await Promise.all([
      client.fetch(`*[_type=="category"]{_id,"slug":slug.current}`),
      client.fetch(`*[_type=="tag"]{_id,"slug":slug.current}`),
      client.fetch(
        `*[_type=="item"]{_id,"slug":slug.current,"categories":categories[]._ref,"tags":tags[]._ref}`,
      ),
      client.fetch(
        `*[_type=="blogPost"]{_id,"slug":slug.current,"categories":categories[]._ref}`,
      ),
      client.fetch(`*[_type=="blogCategory"]{_id,"slug":slug.current}`),
      client.fetch(`*[_type=="group"]{_id,"slug":slug.current}`),
    ]);

  const categoryId = new Map(
    categories.map((category) => [category.slug, category._id]),
  );
  const tagId = new Map(tags.map((tag) => [tag.slug, tag._id]));
  const collectionId = (slug) => `collection-${slug}`;

  const keptCategoryIds = new Set(
    [...KEEP_CATEGORIES].map((slug) => categoryId.get(slug)).filter(Boolean),
  );
  const keptTagIds = new Set(
    [...KEEP_TAGS].map((slug) => tagId.get(slug)).filter(Boolean),
  );

  // Rename the two categories that now absorb a neighbour.
  for (const [slug, name] of Object.entries(CATEGORY_NAMES)) {
    const id = categoryId.get(slug);
    if (id) {
      await client.patch(id).set({ name }).commit();
      console.log(`category renamed: ${slug} -> ${name}`);
    }
  }

  let visible = 0;
  for (const item of items) {
    const keep = KEEP_TOOLS.has(item.slug);
    const override = CATEGORY_OVERRIDES[item.slug];

    // When there is no override, keep the item's existing kept categories.
    const categoriesToSet = override
      ? [categoryId.get(override)].filter(Boolean)
      : (item.categories || []).filter((id) => keptCategoryIds.has(id));

    const collectionsToSet = keep
      ? Object.entries(COLLECTIONS)
          .filter(([, slugs]) => slugs.includes(item.slug))
          .map(([slug]) => collectionId(slug))
      : [];

    await client
      .patch(item._id)
      .set({
        forceHidden: !keep,
        categories: categoriesToSet.map(ref),
        tags: (item.tags || []).filter((id) => keptTagIds.has(id)).map(ref),
        ...(keep ? { collections: collectionsToSet.map(ref) } : {}),
      })
      .commit();
    if (keep) visible++;
  }

  for (const post of posts) {
    const hide = NOINDEX_POSTS.has(post.slug);
    await client
      .patch(post._id)
      .set({
        noIndex: hide,
        categories: (post.categories || [])
          .filter((id) =>
            blogCategories.some(
              (category) =>
                category._id === id && KEEP_BLOG_CATEGORIES.has(category.slug),
            ),
          )
          .map(ref),
      })
      .commit();
  }

  for (const category of categories) {
    if (!KEEP_CATEGORIES.has(category.slug)) {
      await client.delete(category._id);
    }
  }
  for (const tag of tags) {
    if (!KEEP_TAGS.has(tag.slug)) {
      await client.delete(tag._id);
    }
  }
  for (const category of blogCategories) {
    if (!KEEP_BLOG_CATEGORIES.has(category.slug)) {
      await client.delete(category._id);
    }
  }
  for (const group of groups) {
    if (group.slug === "ai-productivity") {
      await client.delete(group._id);
    }
  }

  console.log(
    `visible tools: ${visible}/${items.length}; categories: ${KEEP_CATEGORIES.size}; tags: ${KEEP_TAGS.size}; posts noindexed: ${NOINDEX_POSTS.size}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
