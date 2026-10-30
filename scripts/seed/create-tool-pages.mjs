/**
 * Create the third batch of tool pages and two collections.
 *
 * Usage:
 *   node scripts/seed/create-tool-pages.mjs                 # dry-run (default)
 *   node scripts/seed/create-tool-pages.mjs --apply         # backup + write
 *   node scripts/seed/create-tool-pages.mjs --apply --replace
 *
 * Collections are created as published documents because item drafts can only
 * reference a published collection. Items are written as `drafts.item-<slug>`
 * so an editor can review them before they go live. Published item documents
 * are never modified by this script.
 */
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const DATA_FILE = join(__dirname, "tool-pages-batch3.json");
const APPLY = process.argv.includes("--apply");
const REPLACE = process.argv.includes("--replace");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-08-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: "raw",
  proxy: process.env.HTTPS_PROXY || process.env.https_proxy,
});

const LIMITS = {
  seoTitle: 47,
  seoDescriptionMin: 140,
  seoDescriptionMax: 158,
  verdictWordsMin: 40,
  verdictWordsMax: 70,
  pros: 8,
  cons: 8,
  keyFeatures: 8,
  pricingRows: 6,
  faqs: 8,
  alternatives: 5,
  sources: 8,
};

const words = (value = "") => value.trim().split(/\s+/).filter(Boolean).length;
const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");
const isUrl = (value) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};
const key = (slug, name, index) => `${slug}-${name}-${index + 1}`;

function validateItem(slug, record, categorySlugs, collectionSlugs, tagSlugs) {
  const errors = [];
  const warnings = [];

  for (const field of ["name", "description", "introduction", "bestFor"]) {
    if (!record[field]) errors.push(`${field} is required`);
  }
  if (
    !Array.isArray(record.categorySlugs) ||
    record.categorySlugs.length === 0
  ) {
    errors.push("categorySlugs must contain at least one category");
  }
  for (const category of record.categorySlugs || []) {
    if (!categorySlugs.has(category)) {
      errors.push(`category not found: ${category}`);
    }
  }
  for (const collection of record.collectionSlugs || []) {
    if (!collectionSlugs.has(collection)) {
      errors.push(`collection not found: ${collection}`);
    }
  }
  for (const tag of record.tagSlugs || []) {
    if (!tagSlugs.has(tag)) errors.push(`tag not found: ${tag}`);
  }

  if (!isUrl(record.link)) errors.push("link is not a valid URL");

  if (!record.seoTitle) {
    errors.push("seoTitle is required");
  } else if (record.seoTitle.length > LIMITS.seoTitle) {
    warnings.push(
      `seoTitle is ${record.seoTitle.length} chars (max ${LIMITS.seoTitle})`,
    );
  }
  if (!record.seoDescription) {
    errors.push("seoDescription is required");
  } else {
    const length = record.seoDescription.length;
    if (
      length < LIMITS.seoDescriptionMin ||
      length > LIMITS.seoDescriptionMax
    ) {
      warnings.push(
        `seoDescription is ${length} chars (target ${LIMITS.seoDescriptionMin}-${LIMITS.seoDescriptionMax})`,
      );
    }
  }
  if (!record.introduction || record.introduction.length < 600) {
    warnings.push("introduction is shorter than 600 characters");
  }
  if (!record.verdict) {
    errors.push("verdict is required");
  } else {
    const count = words(record.verdict);
    if (count < LIMITS.verdictWordsMin || count > LIMITS.verdictWordsMax) {
      warnings.push(
        `verdict is ${count} words (target ${LIMITS.verdictWordsMin}-${LIMITS.verdictWordsMax})`,
      );
    }
  }

  if (!Array.isArray(record.pros) || record.pros.length === 0) {
    errors.push("pros must be a non-empty array");
  } else if (record.pros.length > LIMITS.pros) {
    errors.push(`pros has ${record.pros.length} entries (max ${LIMITS.pros})`);
  }
  if (!Array.isArray(record.cons) || record.cons.length === 0) {
    errors.push("cons must be a non-empty array");
  } else if (record.cons.length > LIMITS.cons) {
    errors.push(`cons has ${record.cons.length} entries (max ${LIMITS.cons})`);
  }

  if (!Array.isArray(record.keyFeatures) || record.keyFeatures.length === 0) {
    errors.push("keyFeatures must be a non-empty array");
  } else {
    if (record.keyFeatures.length > LIMITS.keyFeatures) {
      errors.push(
        `keyFeatures has ${record.keyFeatures.length} entries (max ${LIMITS.keyFeatures})`,
      );
    }
    for (const [index, feature] of record.keyFeatures.entries()) {
      if (!feature.title) errors.push(`keyFeatures[${index}].title is missing`);
    }
  }

  if (!Array.isArray(record.pricingRows) || record.pricingRows.length === 0) {
    errors.push("pricingRows must be a non-empty array");
  } else {
    if (record.pricingRows.length > LIMITS.pricingRows) {
      errors.push(
        `pricingRows has ${record.pricingRows.length} entries (max ${LIMITS.pricingRows})`,
      );
    }
    for (const [index, row] of record.pricingRows.entries()) {
      if (!row.plan || !row.price) {
        errors.push(`pricingRows[${index}] needs plan and price`);
      }
    }
  }
  if (!record.pricingSummary) errors.push("pricingSummary is required");
  if (!record.pricingUrl || !isUrl(record.pricingUrl)) {
    errors.push("pricingUrl is not a valid URL");
  }
  if (record.startingPrice === 0) {
    errors.push("startingPrice must not be 0; leave it empty for free plans");
  }
  if (record.startingPrice != null && Number(record.startingPrice) < 0) {
    errors.push("startingPrice must be zero or positive");
  }
  if (record.hasFreePlan === true) {
    const hasZeroRow = record.pricingRows.some((row) =>
      /^(free|\$0(\.00)?|€0(\.00)?|£0(\.00)?)(\s*\/.*)?$/i.test(
        (row.price || "").trim(),
      ),
    );
    if (!hasZeroRow)
      warnings.push("hasFreePlan is true but no zero-price row exists");
  }

  if (!Array.isArray(record.faqs) || record.faqs.length === 0) {
    errors.push("faqs must be a non-empty array");
  } else {
    if (record.faqs.length > LIMITS.faqs) {
      errors.push(
        `faqs has ${record.faqs.length} entries (max ${LIMITS.faqs})`,
      );
    }
    for (const [index, faq] of record.faqs.entries()) {
      if (!faq.question || !faq.answer) {
        errors.push(`faqs[${index}] needs question and answer`);
      }
    }
  }

  if (!Array.isArray(record.alternatives) || record.alternatives.length === 0) {
    errors.push("alternatives must be a non-empty array");
  } else {
    if (record.alternatives.length > LIMITS.alternatives) {
      errors.push(
        `alternatives has ${record.alternatives.length} entries (max ${LIMITS.alternatives})`,
      );
    }
    for (const [index, alternative] of record.alternatives.entries()) {
      if (!alternative.itemRef && !alternative.name) {
        errors.push(`alternatives[${index}] needs itemRef or name`);
      }
      if (!alternative.itemRef && !isUrl(alternative.url)) {
        errors.push(`alternatives[${index}] external URL is invalid`);
      }
      if (!alternative.note)
        warnings.push(`alternatives[${index}] has no note`);
    }
  }

  if (!Array.isArray(record.sources) || record.sources.length === 0) {
    errors.push("sources must be a non-empty array");
  } else {
    if (record.sources.length > LIMITS.sources) {
      errors.push(
        `sources has ${record.sources.length} entries (max ${LIMITS.sources})`,
      );
    }
    if (record.sources.length < 3) {
      warnings.push(`sources has only ${record.sources.length} entries`);
    }
    for (const [index, source] of record.sources.entries()) {
      if (!source.title || !isUrl(source.url)) {
        errors.push(`sources[${index}] needs a title and a valid URL`);
      }
    }
  }

  if (!isDate(record.lastVerified)) {
    errors.push("lastVerified must use YYYY-MM-DD");
  }
  if (!record.reviewerRef) errors.push("reviewerRef is required");

  return { slug, errors, warnings };
}

function buildCollection(collection) {
  return {
    _id: collection.id,
    _type: "collection",
    name: collection.name,
    slug: { _type: "slug", current: collection.slug },
    description: collection.description,
    priority: collection.priority,
  };
}

function buildItemDraft(
  record,
  slug,
  publishDate,
  collectionIds,
  categoryIds,
  tagIds,
  existingIcon,
) {
  return {
    _id: `drafts.item-${slug}`,
    _type: "item",
    name: record.name,
    // Icons are attached by attach-tool-icons.mjs; keep them when this script
    // is re-run so a content refresh does not silently drop the logo.
    ...(existingIcon && { icon: existingIcon }),
    slug: { _type: "slug", current: slug },
    featured: false,
    link: record.link,
    description: record.description,
    introduction: record.introduction,
    collections: record.collectionSlugs.map((collection, index) => ({
      _key: key(slug, "collection", index),
      _type: "reference",
      _ref: collectionIds.get(collection),
    })),
    categories: record.categorySlugs.map((category, index) => ({
      _key: key(slug, "category", index),
      _type: "reference",
      _ref: categoryIds.get(category),
    })),
    ...(record.tagSlugs?.length
      ? {
          tags: record.tagSlugs.map((tag, index) => ({
            _key: key(slug, "tag", index),
            _type: "reference",
            _ref: tagIds.get(tag),
          })),
        }
      : {}),
    verdict: record.verdict,
    bestFor: record.bestFor,
    pros: record.pros,
    cons: record.cons,
    keyFeatures: record.keyFeatures.map((feature, index) => ({
      _key: key(slug, "feature", index),
      _type: "keyFeature",
      ...feature,
    })),
    pricingSummary: record.pricingSummary,
    pricingRows: record.pricingRows.map((row, index) => ({
      _key: key(slug, "price", index),
      _type: "pricingRow",
      ...row,
    })),
    hasFreePlan: record.hasFreePlan,
    ...(record.startingPrice != null && {
      startingPrice: record.startingPrice,
    }),
    priceCurrency: record.priceCurrency || "USD",
    pricingUrl: record.pricingUrl,
    faqs: record.faqs.map((faq, index) => ({
      _key: key(slug, "faq", index),
      _type: "faq",
      ...faq,
    })),
    alternatives: record.alternatives.map((alternative, index) => ({
      _key: key(slug, "alt", index),
      _type: "alternative",
      ...(alternative.itemRef && {
        // New items in this batch are only drafts, so the reference has to be
        // weak; Sanity otherwise rejects a reference to an unpublished target.
        item: { _type: "reference", _ref: alternative.itemRef, _weak: true },
      }),
      ...(alternative.name && { name: alternative.name }),
      ...(alternative.url && { url: alternative.url }),
      ...(alternative.note && { note: alternative.note }),
    })),
    sources: record.sources.map((source, index) => ({
      _key: key(slug, "source", index),
      _type: "source",
      ...source,
    })),
    lastVerified: record.lastVerified,
    reviewer: { _type: "reference", _ref: record.reviewerRef },
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    publishDate,
    pricePlan: "free",
    freePlanStatus: "approved",
    paid: false,
    forceHidden: false,
    sponsor: false,
    note: `Editorial entry created ${record.lastVerified}; verify prices before publishing.`,
  };
}

async function main() {
  if (!process.env.SANITY_API_TOKEN)
    throw new Error("SANITY_API_TOKEN is not set");

  const data = JSON.parse(await readFile(DATA_FILE, "utf8"));
  const newCollections = data.collections || [];
  const records = data.items || {};
  const slugs = Object.keys(records);
  if (!slugs.length) throw new Error("No items found in the data file");

  const itemIds = slugs.map((slug) => `item-${slug}`);
  const draftIds = slugs.map((slug) => `drafts.item-${slug}`);
  const collectionIds = newCollections.map((collection) => collection.id);

  const [categories, tags, existingCollections, existingItems, existingDrafts] =
    await Promise.all([
      client.fetch(`*[_type == "category"]{_id, "slug": slug.current}`),
      client.fetch(`*[_type == "tag"]{_id, "slug": slug.current}`),
      client.fetch("*[_id in $ids]", { ids: collectionIds }),
      client.fetch("*[_id in $ids]", { ids: itemIds }),
      client.fetch("*[_id in $ids]", { ids: draftIds }),
    ]);

  const categoryIds = new Map(categories.map((doc) => [doc.slug, doc._id]));
  const tagIds = new Map(tags.map((doc) => [doc.slug, doc._id]));
  const existingCollectionIds = new Set(
    existingCollections.map((doc) => doc._id),
  );
  const existingItemIds = new Set(existingItems.map((doc) => doc._id));
  const existingDraftIds = new Set(existingDrafts.map((doc) => doc._id));
  const existingDraftById = new Map(
    existingDrafts.map((doc) => [doc._id, doc]),
  );

  // Fetch every collection with its slug so a typo in collectionSlugs cannot
  // silently drop a reference. The id-only lookup above is for existence.
  const publishedCollections = await client.fetch(
    `*[_type == "collection"]{_id, "slug": slug.current}`,
  );
  const allCollectionSlugs = new Set([
    ...publishedCollections.map((doc) => doc.slug),
    ...newCollections.map((collection) => collection.slug),
  ]);
  const collectionIdBySlug = new Map(
    publishedCollections.map((doc) => [doc.slug, doc._id]),
  );
  for (const collection of newCollections) {
    collectionIdBySlug.set(collection.slug, collection.id);
  }

  const reviews = slugs.map((slug) =>
    validateItem(
      slug,
      records[slug],
      new Set(categoryIds.keys()),
      allCollectionSlugs,
      new Set(tagIds.keys()),
    ),
  );

  const reviewerIds = new Set(
    Object.values(records)
      .map((record) => record.reviewerRef)
      .filter(Boolean),
  );
  const reviewerDocs = reviewerIds.size
    ? await client.fetch("*[_id in $ids]{_id}", { ids: [...reviewerIds] })
    : [];
  const foundReviewers = new Set(reviewerDocs.map((doc) => doc._id));

  const alternativeIds = new Set(
    Object.values(records)
      .flatMap((record) => record.alternatives || [])
      .map((alternative) => alternative.itemRef)
      .filter(Boolean),
  );
  const alternativeDocs = alternativeIds.size
    ? await client.fetch("*[_id in $ids]{_id}", { ids: [...alternativeIds] })
    : [];
  const foundAlternatives = new Set([
    ...alternativeDocs.map((doc) => doc._id),
    ...itemIds,
  ]);

  let errorCount = 0;
  let warningCount = 0;

  for (const review of reviews) {
    const record = records[review.slug];
    if (!foundReviewers.has(record.reviewerRef)) {
      review.errors.push(`reviewer not found: ${record.reviewerRef}`);
    }
    for (const alternative of record.alternatives || []) {
      if (alternative.itemRef && !foundAlternatives.has(alternative.itemRef)) {
        review.errors.push(
          `alternative item not found: ${alternative.itemRef}`,
        );
      }
    }
    if (existingItemIds.has(`item-${review.slug}`)) {
      review.errors.push(
        `published item item-${review.slug} already exists; this script only creates new pages`,
      );
    }
    if (existingDraftIds.has(`drafts.item-${review.slug}`) && !REPLACE) {
      review.errors.push(
        `draft drafts.item-${review.slug} already exists; pass --replace to overwrite`,
      );
    }

    errorCount += review.errors.length;
    warningCount += review.warnings.length;
    console.log(
      `\n${review.slug} -> drafts.item-${review.slug} (${record.name})`,
    );
    console.log(
      `  title ${record.seoTitle.length}/47 · description ${record.seoDescription.length} chars · verdict ${words(record.verdict)} words · intro ${record.introduction.length} chars`,
    );
    console.log(
      `  ${record.keyFeatures.length} features · ${record.pros.length} pros · ${record.cons.length} cons · ${record.pricingRows.length} pricing rows · ${record.faqs.length} FAQs · ${record.alternatives.length} alternatives · ${record.sources.length} sources`,
    );
    for (const warning of review.warnings) console.log(`  WARN ${warning}`);
    for (const error of review.errors) console.log(`  ERROR ${error}`);
  }

  for (const collection of newCollections) {
    if (existingCollectionIds.has(collection.id) && !REPLACE) {
      console.log(
        `\n${collection.id}\n  ERROR collection already exists; pass --replace to overwrite`,
      );
      errorCount += 1;
    } else {
      console.log(
        `\n${collection.id} -> published collection ${collection.slug}`,
      );
    }
  }

  if (errorCount) {
    throw new Error(`${errorCount} validation error(s); nothing was written`);
  }

  console.log(
    `\n${APPLY ? "Applying" : "Dry run:"} ${slugs.length} item draft(s) and ${newCollections.length} collection(s), ${warningCount} warning(s).`,
  );

  if (!APPLY) {
    console.log(
      "No data written. Re-run with --apply to back up and create the documents.",
    );
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = join(ROOT, "backups");
  const backupPath = join(backupDir, `tool-pages-batch3-${stamp}.json`);
  await mkdir(backupDir, { recursive: true });

  const publishDate = new Date().toISOString();
  const collectionDocs = newCollections.map(buildCollection);
  const itemDocs = slugs.map((slug) =>
    buildItemDraft(
      records[slug],
      slug,
      publishDate,
      collectionIdBySlug,
      categoryIds,
      tagIds,
      existingDraftById.get(`drafts.item-${slug}`)?.icon,
    ),
  );

  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        existingCollections,
        existingItems,
        existingDrafts,
        writtenCollections: collectionDocs,
        writtenDrafts: itemDocs,
      },
      null,
      2,
    ),
  );
  console.log(`Backup: ${backupPath}`);

  for (const doc of collectionDocs) {
    await client.createOrReplace(doc);
    console.log(`Wrote published ${doc._id}`);
  }
  for (const doc of itemDocs) {
    await client.createOrReplace(doc);
    console.log(`Wrote draft ${doc._id}`);
  }

  console.log(
    "\nDone. Collections are published; item pages are drafts. Review them in Studio, then publish the batch.",
  );
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
