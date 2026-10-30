/**
 * Write the first batch of tool-page review content as drafts.
 *
 * Usage:
 *   node scripts/seed/upgrade-tool-pages.mjs             # dry-run (default)
 *   node scripts/seed/upgrade-tool-pages.mjs --apply     # backup + write drafts
 *   node scripts/seed/upgrade-tool-pages.mjs --apply --replace-drafts
 *
 * The script never modifies a published document. It copies the published item
 * into `drafts.item-<slug>` and adds the review fields from
 * `tool-page-upgrades.json`, leaving the published version untouched until an
 * editor publishes the draft in Studio.
 */
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const DATA_PATH = join(__dirname, "tool-page-upgrades.json");
const APPLY = process.argv.includes("--apply");
const REPLACE_DRAFTS = process.argv.includes("--replace-drafts");

// Optional: --data <file> and --only slug-a,slug-b let a later batch live in
// its own JSON file without touching the first batch's drafts.
const dataArgIndex = process.argv.indexOf("--data");
const DATA_FILE =
  dataArgIndex > -1
    ? resolve(process.cwd(), process.argv[dataArgIndex + 1])
    : DATA_PATH;
const onlyArgIndex = process.argv.indexOf("--only");
const ONLY =
  onlyArgIndex > -1
    ? new Set(
        process.argv[onlyArgIndex + 1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      )
    : null;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-08-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: "raw",
  // Optional: honour a local HTTPS proxy when the shell sets one. Without
  // this, @sanity/client connects directly and hangs behind proxy-only
  // networks such as Clash/Surge.
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

function validateRecord(slug, record) {
  const errors = [];
  const warnings = [];

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

  if (!record.bestFor) errors.push("bestFor is required");
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
  if (record.pricingUrl && !isUrl(record.pricingUrl)) {
    errors.push("pricingUrl is not a valid URL");
  }
  if (!record.pricingUrl) warnings.push("pricingUrl is missing");
  if (record.startingPrice === 0) {
    errors.push("startingPrice must not be 0; leave it empty for free plans");
  }
  if (record.startingPrice != null && Number(record.startingPrice) < 0) {
    errors.push("startingPrice must be zero or positive");
  }
  if (record.hasFreePlan === true) {
    const hasZeroRow = record.pricingRows.some((row) =>
      /^(\$|€|£)?0(\.00)?(\s*\/\s*mo)?$/i.test((row.price || "").trim()),
    );
    if (!hasZeroRow) warnings.push("hasFreePlan is true but no $0 row exists");
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
      if (!alternative.note) {
        warnings.push(`alternatives[${index}] has no note`);
      }
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
    for (const [index, source] of record.sources.entries()) {
      if (!source.title || !isUrl(source.url)) {
        errors.push(`sources[${index}] needs a title and a valid URL`);
      }
    }
  }

  if (!isDate(record.lastVerified)) {
    errors.push("lastVerified must use YYYY-MM-DD");
  }
  if (!record.reviewerRef) warnings.push("reviewerRef is missing");

  return { slug, errors, warnings };
}

function buildDraft(published, slug, record) {
  const { _rev, _createdAt, _updatedAt, _id, ...base } = published;
  const key = (name, index) => `${slug}-${name}-${index + 1}`;

  return {
    ...base,
    _id: `drafts.${_id}`,
    _type: "item",
    introduction: record.introduction,
    verdict: record.verdict,
    bestFor: record.bestFor,
    pros: record.pros,
    cons: record.cons,
    keyFeatures: record.keyFeatures.map((feature, index) => ({
      _key: key("feature", index),
      _type: "keyFeature",
      ...feature,
    })),
    pricingSummary: record.pricingSummary,
    pricingRows: record.pricingRows.map((row, index) => ({
      _key: key("price", index),
      _type: "pricingRow",
      ...row,
    })),
    hasFreePlan: record.hasFreePlan,
    ...(record.startingPrice != null && {
      startingPrice: record.startingPrice,
    }),
    priceCurrency: record.priceCurrency || "USD",
    ...(record.pricingUrl && { pricingUrl: record.pricingUrl }),
    faqs: record.faqs.map((faq, index) => ({
      _key: key("faq", index),
      _type: "faq",
      ...faq,
    })),
    alternatives: record.alternatives.map((alternative, index) => ({
      _key: key("alt", index),
      _type: "alternative",
      ...(alternative.itemRef && {
        item: { _type: "reference", _ref: alternative.itemRef },
      }),
      ...(alternative.name && { name: alternative.name }),
      ...(alternative.url && { url: alternative.url }),
      ...(alternative.note && { note: alternative.note }),
    })),
    sources: record.sources.map((source, index) => ({
      _key: key("source", index),
      _type: "source",
      ...source,
    })),
    lastVerified: record.lastVerified,
    ...(record.reviewerRef && {
      reviewer: { _type: "reference", _ref: record.reviewerRef },
    }),
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
  };
}

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error("SANITY_API_TOKEN is not set");
  }

  const allRecords = JSON.parse(await readFile(DATA_FILE, "utf8"));
  const records = ONLY
    ? Object.fromEntries(
        Object.entries(allRecords).filter(([slug]) => ONLY.has(slug)),
      )
    : allRecords;
  const slugs = Object.keys(records);
  if (ONLY) {
    const unknown = [...ONLY].filter((slug) => !allRecords[slug]);
    if (unknown.length) {
      throw new Error(
        `--only slugs not found in ${DATA_FILE}: ${unknown.join(", ")}`,
      );
    }
  }
  const publishedIds = slugs.map((slug) => `item-${slug}`);
  const draftIds = slugs.map((slug) => `drafts.item-${slug}`);

  const [publishedDocs, existingDrafts] = await Promise.all([
    client.fetch("*[_id in $ids]", { ids: publishedIds }),
    client.fetch("*[_id in $ids]", { ids: draftIds }),
  ]);

  const publishedById = new Map(publishedDocs.map((doc) => [doc._id, doc]));
  const draftById = new Map(existingDrafts.map((doc) => [doc._id, doc]));

  const missing = publishedIds.filter((id) => !publishedById.has(id));
  if (missing.length) {
    throw new Error(`Published items not found: ${missing.join(", ")}`);
  }

  if (existingDrafts.length && !REPLACE_DRAFTS && APPLY) {
    throw new Error(
      `Drafts already exist: ${existingDrafts
        .map((doc) => doc._id)
        .join(", ")}. Re-run with --replace-drafts to overwrite them.`,
    );
  }

  const reviews = slugs.map((slug) => validateRecord(slug, records[slug]));
  const referencedItemIds = new Set(
    Object.values(records).flatMap((record) =>
      record.alternatives
        .map((alternative) => alternative.itemRef)
        .filter(Boolean),
    ),
  );
  const reviewerIds = new Set(
    Object.values(records)
      .map((record) => record.reviewerRef)
      .filter(Boolean),
  );

  const [refDocs, reviewerDocs] = await Promise.all([
    referencedItemIds.size
      ? client.fetch("*[_id in $ids]{_id}", {
          ids: [...referencedItemIds],
        })
      : [],
    reviewerIds.size
      ? client.fetch("*[_id in $ids]{_id}", { ids: [...reviewerIds] })
      : [],
  ]);
  const foundRefs = new Set(refDocs.map((doc) => doc._id));
  const foundReviewers = new Set(reviewerDocs.map((doc) => doc._id));

  let errorCount = 0;
  let warningCount = 0;

  for (const review of reviews) {
    const record = records[review.slug];
    const missingRefs = (record.alternatives || [])
      .map((alternative) => alternative.itemRef)
      .filter((id) => id && !foundRefs.has(id));
    const missingReviewer =
      record.reviewerRef && !foundReviewers.has(record.reviewerRef);

    review.errors.push(
      ...missingRefs.map((id) => `alternative reference not found: ${id}`),
      ...(missingReviewer
        ? [`reviewer reference not found: ${record.reviewerRef}`]
        : []),
    );

    errorCount += review.errors.length;
    warningCount += review.warnings.length;

    const draftId = `drafts.item-${review.slug}`;
    const draftStatus = draftById.has(draftId)
      ? REPLACE_DRAFTS
        ? " (replace)"
        : " (exists; --replace-drafts required to apply)"
      : "";
    console.log(`\n${review.slug} -> ${draftId}${draftStatus}`);
    console.log(
      `  title ${record.seoTitle.length}/47 · description ${record.seoDescription.length} chars · verdict ${words(record.verdict)} words`,
    );
    console.log(
      `  ${record.keyFeatures.length} features · ${record.pros.length} pros · ${record.cons.length} cons · ${record.pricingRows.length} pricing rows · ${record.faqs.length} FAQs · ${record.alternatives.length} alternatives · ${record.sources.length} sources`,
    );
    for (const warning of review.warnings) console.log(`  WARN ${warning}`);
    for (const error of review.errors) console.log(`  ERROR ${error}`);
  }

  if (errorCount) {
    throw new Error(`${errorCount} validation error(s); nothing was written`);
  }

  console.log(
    `\n${APPLY ? "Applying" : "Dry run:"} ${slugs.length} draft(s), ${warningCount} warning(s).`,
  );

  if (!APPLY) {
    console.log(
      existingDrafts.length && !REPLACE_DRAFTS
        ? "No data written. Drafts already exist; pass --replace-drafts with --apply to overwrite them."
        : "No data written. Re-run with --apply to back up and create drafts.",
    );
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = join(ROOT, "backups");
  const backupPath = join(backupDir, `tool-page-upgrades-${stamp}.json`);
  await mkdir(backupDir, { recursive: true });
  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        published: publishedDocs,
        drafts: existingDrafts,
      },
      null,
      2,
    ),
  );
  console.log(`Backup: ${backupPath}`);

  for (const slug of slugs) {
    const published = publishedById.get(`item-${slug}`);
    const draft = buildDraft(published, slug, records[slug]);
    await client.createOrReplace(draft);
    console.log(`Wrote ${draft._id}`);
  }

  console.log(
    "\nDone. Published documents were not modified. Review and publish each draft in Studio.",
  );
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
