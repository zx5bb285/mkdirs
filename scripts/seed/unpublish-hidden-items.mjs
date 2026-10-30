/**
 * Move published-but-hidden items to draft-only state.
 *
 * Why: `forceHidden` keeps an item out of the public site, but the document is
 * still published. In Studio that looks identical to a live item, which makes
 * the All Items list ambiguous. Unpublishing keeps the exact same content and
 * visibility (hidden items were already invisible) while making the state
 * honest: draft-only items show as drafts until an editor publishes them.
 *
 * Usage:
 *   node scripts/seed/unpublish-hidden-items.mjs            # dry-run
 *   node scripts/seed/unpublish-hidden-items.mjs --apply --yes
 *
 * Safety:
 *   - refuses to run if any item already has a draft (would overwrite edits);
 *   - writes a full backup to backups/ before the first mutation;
 *   - `--apply` without `--yes` only prints the plan.
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const APPLY = process.argv.includes("--apply");
const CONFIRMED = process.argv.includes("--yes");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-08-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: "raw",
});

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error("SANITY_API_TOKEN is not set");
  }

  const [items, drafts] = await Promise.all([
    client.fetch(
      `*[_type == "item" && !(_id in path("drafts.**")) && forceHidden == true] | order(name asc)`,
    ),
    client.fetch(`*[_type == "item" && _id in path("drafts.**")]{_id, name}`),
  ]);

  // Resumable: a previous run may have moved some items before hitting a
  // referential-integrity error. Skip those rather than overwriting a draft.
  const draftIds = new Set(drafts.map((doc) => doc._id));
  const alreadyDrafted = items.filter((item) =>
    draftIds.has(`drafts.${item._id}`),
  );
  const targets = items.filter((item) => !draftIds.has(`drafts.${item._id}`));

  if (!items.length) {
    console.log("No published hidden items found. Nothing to do.");
    return;
  }

  console.log(
    `${APPLY ? "Applying" : "Dry run:"} ${targets.length} published hidden item(s) -> draft-only.`,
  );
  for (const item of targets) {
    console.log(`  ${item._id}\t${item.name || "(no name)"}`);
  }
  if (alreadyDrafted.length) {
    console.log(
      `\nSkipping ${alreadyDrafted.length} item(s) that already have a draft.`,
    );
  }
  if (!targets.length) {
    console.log("\nNothing left to unpublish.");
    return;
  }

  if (!APPLY) {
    console.log(
      "\nNo data written. Re-run with --apply --yes to back up and unpublish.",
    );
    return;
  }
  if (!CONFIRMED) {
    console.log("\n--apply requires --yes. No data written.");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = join(ROOT, "backups");
  const backupPath = join(backupDir, `unpublish-hidden-items-${stamp}.json`);
  await mkdir(backupDir, { recursive: true });
  await writeFile(
    backupPath,
    JSON.stringify(
      { createdAt: new Date().toISOString(), items, drafts },
      null,
      2,
    ),
  );
  console.log(`\nBackup: ${backupPath}`);

  let moved = 0;
  const failed = [];
  for (const item of targets) {
    const draftId = `drafts.${item._id}`;
    const { _updatedAt, ...published } = item;
    try {
      await client
        .transaction()
        .createIfNotExists({ ...published, _id: draftId, _type: "item" })
        .delete(item._id)
        .commit({ tag: "hidden.unpublish" });
      moved += 1;
      console.log(`Unpublished ${item._id} -> ${draftId}`);
    } catch (error) {
      failed.push({ id: item._id, message: error.message });
      console.error(`Failed ${item._id}: ${error.message}`);
    }
  }

  const [publishedLeft, draftsNow] = await Promise.all([
    client.fetch(
      `count(*[_type == "item" && !(_id in path("drafts.**")) && forceHidden == true])`,
    ),
    client.fetch(
      `count(*[_type == "item" && _id in path("drafts.**") && forceHidden == true])`,
    ),
  ]);
  console.log(
    `\nDone: ${moved} moved, ${failed.length} failed. Hidden published left: ${publishedLeft}; hidden drafts: ${draftsNow}.`,
  );
  if (failed.length) {
    console.log("Failed items:");
    for (const failure of failed) {
      console.log(`  ${failure.id}: ${failure.message.split("\n")[0]}`);
    }
    process.exitCode = 1;
  }
  console.log(
    "Rollback: use the backup JSON or publish the drafts individually in Studio.",
  );
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
