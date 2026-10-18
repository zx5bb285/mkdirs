/**
 * Create curated collections and link the seeded tools to them.
 *
 * Collections are derived from category membership so the links stay
 * consistent with the taxonomy in taxonomy.json. Items keep their existing
 * collections and gain the ones they belong to here, so the script is safe to
 * re-run.
 *
 * Usage:
 *   node scripts/seed/collections.mjs
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

const COLLECTIONS = [
  {
    slug: "ai-tools-for-writing",
    name: "AI Tools for Writing",
    description:
      "Writing assistants, SEO copy tools and translation services for people who publish every day.",
    priority: 50,
    categories: ["ai-writing-assistants", "ai-seo-tools", "ai-translation"],
  },
  {
    slug: "ai-tools-for-designers",
    name: "AI Tools for Designers",
    description:
      "Image generators, photo editors and design assistants for visual work.",
    priority: 40,
    categories: ["ai-image-generators", "ai-photo-editing", "ai-design-tools"],
  },
  {
    slug: "ai-tools-for-developers",
    name: "AI Tools for Developers",
    description:
      "Code assistants, app builders and developer utilities that fit into a real build workflow.",
    priority: 30,
    categories: ["ai-code-assistants", "ai-app-builders", "ai-developer-tools"],
  },
  {
    slug: "ai-tools-for-video-creators",
    name: "AI Tools for Video Creators",
    description:
      "Video generators, avatars, voice cloning and music tools for short-form and long-form production.",
    priority: 20,
    categories: ["ai-video-generators", "ai-avatars-voice", "ai-music"],
  },
  {
    slug: "ai-tools-for-productivity",
    name: "AI Tools for Productivity",
    description:
      "Meeting assistants, automation, presentations and research tools for everyday knowledge work.",
    priority: 10,
    categories: [
      "ai-meeting-assistants",
      "ai-automation",
      "ai-presentations",
      "ai-research-tools",
    ],
  },
];

async function seedCollections() {
  let linked = 0;

  for (const collection of COLLECTIONS) {
    const id = `collection-${collection.slug}`;
    await client.createOrReplace({
      _id: id,
      _type: "collection",
      name: collection.name,
      slug: { _type: "slug", current: collection.slug },
      description: collection.description,
      priority: collection.priority,
    });
    console.log(`collection: ${id}`);
  }

  const items = await client.fetch(
    `*[_type=="item" && defined(slug.current)]{
      _id,
      "categories": categories[]->slug.current,
      "collections": collections[]._ref
    }`,
  );

  for (const item of items) {
    const wanted = COLLECTIONS.filter((collection) =>
      collection.categories.some((category) =>
        item.categories?.includes(category),
      ),
    ).map((collection) => `collection-${collection.slug}`);

    const merged = [...new Set([...(item.collections || []), ...wanted])];
    if (merged.length === item.collections?.length) continue;

    await client
      .patch(item._id)
      .set({ collections: merged.map(ref) })
      .commit();
    linked++;
  }

  console.log(`collections: ${COLLECTIONS.length}, items linked: ${linked}`);
}

seedCollections().catch((error) => {
  console.error(error);
  process.exit(1);
});
