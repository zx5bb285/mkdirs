/**
 * Seed the DirHunt AI directory with a curated taxonomy and tool set.
 *
 * Usage:
 *   node scripts/seed/seed.mjs backup
 *   node scripts/seed/seed.mjs wipe
 *   node scripts/seed/seed.mjs taxonomy
 *   node scripts/seed/seed.mjs items
 *   node scripts/seed/seed.mjs all
 *   node scripts/seed/seed.mjs stats
 *
 * The demo content shipped with the template (boilerplate categories, tags and
 * three sample items) is exported to /tmp before `wipe` deletes anything.
 */
import "dotenv/config";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-08-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: "published",
});

const TYPES = ["item", "category", "tag", "group"];

const slug = (value) => ({ _type: "slug", current: value });
const ref = (id) => ({ _type: "reference", _ref: id });

async function backup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `/tmp/dirhuntai-content-backup-${stamp}.json`;
  const docs = await client.fetch(`*[_type in $types] | order(_type asc)`, {
    types: TYPES,
  });
  await writeFile(path, JSON.stringify(docs, null, 2));
  console.log(`backup: ${docs.length} docs -> ${path}`);
}

async function wipe() {
  const data = await client.delete({
    query: `*[_type in $types]`,
    params: { types: TYPES },
  });
  console.log("wipe:", JSON.stringify(data));
}

async function seedTaxonomy() {
  const taxonomy = JSON.parse(
    await readFile(join(__dirname, "taxonomy.json"), "utf8"),
  );

  for (const group of taxonomy.groups) {
    await client.createOrReplace({
      _id: `group-${group.slug}`,
      _type: "group",
      name: group.name,
      slug: slug(group.slug),
      description: group.description,
      priority: group.priority,
    });
  }

  for (const category of taxonomy.categories) {
    await client.createOrReplace({
      _id: `category-${category.slug}`,
      _type: "category",
      name: category.name,
      slug: slug(category.slug),
      description: category.description,
      priority: category.priority,
      group: ref(`group-${category.group}`),
    });
  }

  for (const tag of taxonomy.tags) {
    await client.createOrReplace({
      _id: `tag-${tag.slug}`,
      _type: "tag",
      name: tag.name,
      slug: slug(tag.slug),
      description: tag.description,
    });
  }

  console.log(
    `taxonomy: ${taxonomy.groups.length} groups, ${taxonomy.categories.length} categories, ${taxonomy.tags.length} tags`,
  );
}

const iconCache = new Map();

async function uploadIcon(domain) {
  if (!domain) return undefined;
  if (iconCache.has(domain)) return iconCache.get(domain);

  try {
    const response = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`unexpected content-type ${contentType}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    // Google returns a generic globe for unknown domains; keep it only if
    // the payload looks like a real favicon.
    if (buffer.byteLength < 200) throw new Error("favicon too small");

    const asset = await client.assets.upload("image", buffer, {
      filename: `${domain.replace(/[^a-z0-9.-]/gi, "_")}.png`,
      contentType,
    });
    const value = {
      _type: "image",
      asset: ref(asset._id),
    };
    iconCache.set(domain, value);
    return value;
  } catch (error) {
    console.warn(`icon skipped for ${domain}: ${error.message}`);
    iconCache.set(domain, undefined);
    return undefined;
  }
}

async function mapLimit(items, limit, worker) {
  const results = [];
  let index = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current);
    }
  });
  await Promise.all(runners);
  return results;
}

async function seedItems() {
  const toolsDir = join(__dirname, "tools");
  const files = (await readdir(toolsDir))
    .filter((file) => file.endsWith(".json"))
    .sort();

  const tools = [];
  for (const file of files) {
    const parsed = JSON.parse(await readFile(join(toolsDir, file), "utf8"));
    tools.push(...parsed);
  }

  const baseDate = Date.parse("2026-10-18T09:00:00Z");

  await mapLimit(tools, 4, async (tool, index) => {
    const icon = await uploadIcon(tool.domain);
    const publishDate = new Date(
      baseDate - index * 6 * 60 * 60 * 1000,
    ).toISOString();

    await client.createOrReplace({
      _id: `item-${tool.slug}`,
      _type: "item",
      name: tool.name,
      slug: slug(tool.slug),
      link: tool.link,
      description: tool.description,
      introduction: tool.introduction,
      categories: (tool.categories || []).map((id) => ref(`category-${id}`)),
      tags: (tool.tags || []).map((id) => ref(`tag-${id}`)),
      ...(icon ? { icon: { ...icon, alt: `${tool.name} logo` } } : {}),
      featured: Boolean(tool.featured),
      publishDate,
      pricePlan: "free",
      freePlanStatus: "approved",
      paid: false,
      forceHidden: false,
      sponsor: false,
    });
    console.log(`item: ${tool.slug}`);
  });

  console.log(`items: ${tools.length} imported`);
}

async function stats() {
  const result = await client.fetch(`{
    "groups": count(*[_type == "group"]),
    "categories": count(*[_type == "category"]),
    "tags": count(*[_type == "tag"]),
    "items": count(*[_type == "item"]),
    "publishedItems": count(*[_type == "item" && defined(publishDate)]),
    "featured": count(*[_type == "item" && featured == true]),
    "withIcon": count(*[_type == "item" && defined(icon.asset)]),
    "withCategory": count(*[_type == "item" && count(categories) > 0])
  }`);
  console.log(JSON.stringify(result, null, 2));
}

const commands = {
  backup,
  wipe,
  taxonomy: seedTaxonomy,
  items: seedItems,
  all: async () => {
    await backup();
    await wipe();
    await seedTaxonomy();
    await seedItems();
    await stats();
  },
  stats,
};

const command = process.argv[2] || "stats";
if (!commands[command]) {
  console.error(`Unknown command: ${command}`);
  console.error(`Available: ${Object.keys(commands).join(", ")}`);
  process.exit(1);
}

await commands[command]();
