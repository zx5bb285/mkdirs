/**
 * Publish the batch-3 tool drafts: drafts.item-<slug> -> item-<slug>.
 *
 * Usage:
 *   node scripts/seed/publish-tool-pages.mjs            # dry-run
 *   node scripts/seed/publish-tool-pages.mjs --apply
 *
 * Every draft is backed up before anything is written. All documents are
 * written in a single transaction, so a failure leaves the dataset unchanged.
 * Existing published documents are never overwritten unless --replace is
 * passed.
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const APPLY = process.argv.includes("--apply");
const REPLACE = process.argv.includes("--replace");

const SLUGS = [
  "vidwud",
  "cliptrend",
  "musicful",
  "otter-ai",
  "descript",
  "openai-whisper",
  "rev",
  "happy-scribe",
  "mew-design",
  "pixel-gpt",
  "spaleforce",
];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-08-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: "raw",
  proxy: process.env.HTTPS_PROXY || process.env.https_proxy,
});

function refIds(doc) {
  const ids = new Set();
  for (const field of ["categories", "collections", "tags"]) {
    for (const ref of doc[field] || []) {
      if (ref?._ref) ids.add(ref._ref);
    }
  }
  if (doc.reviewer?._ref) ids.add(doc.reviewer._ref);
  for (const alternative of doc.alternatives || []) {
    if (alternative.item?._ref) ids.add(alternative.item._ref);
  }
  return [...ids];
}

function publishedDoc(draft) {
  const doc = { ...draft, _id: draft._id.replace(/^drafts\./, "") };
  doc._rev = undefined;
  doc._createdAt = undefined;
  doc._updatedAt = undefined;
  return doc;
}

async function main() {
  if (!process.env.SANITY_API_TOKEN)
    throw new Error("SANITY_API_TOKEN is not set");

  const ids = SLUGS.map((slug) => `drafts.item-${slug}`);
  const drafts = await client.fetch("*[_id in $ids]", { ids });
  const byId = new Map(drafts.map((doc) => [doc._id, doc]));

  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length)
    throw new Error(`Draft items not found: ${missing.join(", ")}`);

  const existingPublished = await client.fetch("*[_id in $ids]{_id}", {
    ids: SLUGS.map((slug) => `item-${slug}`),
  });
  const existingPublishedIds = new Set(existingPublished.map((doc) => doc._id));

  const allRefs = [...new Set(drafts.flatMap(refIds))];
  const refDocs = await client.fetch("*[_id in $ids]{_id}", {
    ids: allRefs,
  });
  const foundRefs = new Set(refDocs.map((doc) => doc._id));
  const publishTargets = new Set(ids.map((id) => id.replace(/^drafts\./, "")));
  const danglingRefs = allRefs.filter(
    (id) => !foundRefs.has(id) && !publishTargets.has(id),
  );

  let blocked = false;
  for (const draft of drafts) {
    const slug = draft._id.replace(/^drafts\.item-/, "");
    const publishedId = `item-${slug}`;
    const problems = [];
    if (!draft.verdict) problems.push("missing verdict");
    if (!draft.introduction) problems.push("missing introduction");
    if (!draft.pricingRows?.length) problems.push("missing pricingRows");
    if (existingPublishedIds.has(publishedId) && !REPLACE)
      problems.push("already published (use --replace to overwrite)");
    const dangling = refIds(draft).filter(
      (id) => !foundRefs.has(id) && !publishTargets.has(id),
    );
    if (dangling.length) problems.push(`dangling refs: ${dangling.join(", ")}`);

    const status = problems.length ? `BLOCKED (${problems.join("; ")})` : "ok";
    console.log(`${draft._id} -> ${publishedId}  [${status}]`);
    if (problems.length) blocked = true;
  }
  if (danglingRefs.length)
    console.log(`\nDangling references: ${danglingRefs.join(", ")}`);
  if (blocked) throw new Error("Validation failed; nothing was written");

  if (!APPLY) {
    console.log(
      `\nDry run: ${drafts.length} draft(s) ready, 0 blocked. Re-run with --apply to publish.`,
    );
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = join(ROOT, "backups");
  await mkdir(backupDir, { recursive: true });
  const backupPath = join(backupDir, `publish-tool-pages-${stamp}.json`);
  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        drafts,
        overwrittenPublished: await client.fetch("*[_id in $ids]", {
          ids: SLUGS.map((slug) => `item-${slug}`),
        }),
      },
      null,
      2,
    ),
  );
  console.log(`Backup: ${backupPath}`);

  const transaction = client.transaction();
  for (const draft of drafts) {
    transaction.createOrReplace(publishedDoc(draft));
    transaction.delete(draft._id);
  }
  await transaction.commit();

  console.log(`\nPublished ${drafts.length} item(s) and removed their drafts.`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
