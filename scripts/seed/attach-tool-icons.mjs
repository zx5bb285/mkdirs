/**
 * Attach local, official-site icons to the batch-3 item drafts.
 *
 * Usage:
 *   node scripts/seed/attach-tool-icons.mjs             # dry-run
 *   node scripts/seed/attach-tool-icons.mjs --apply
 *   node scripts/seed/attach-tool-icons.mjs --apply --replace
 *
 * Icons are kept in scripts/seed/icons/ as PNG files so the batch is
 * reproducible. Existing icons are left alone unless --replace is passed.
 */
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const ICON_DIR = join(__dirname, "icons");
const APPLY = process.argv.includes("--apply");
const REPLACE = process.argv.includes("--replace");

const ICONS = {
  vidwud: "Vidwud icon",
  cliptrend: "ClipTrend icon",
  musicful: "Musicful icon",
  "otter-ai": "Otter.ai icon",
  descript: "Descript icon",
  "openai-whisper": "OpenAI icon",
  rev: "Rev icon",
  "happy-scribe": "Happy Scribe icon",
  "mew-design": "Mew Design icon",
  "pixel-gpt": "Pixel GPT icon",
  spaleforce: "Spaleforce icon",
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-08-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: "raw",
  proxy: process.env.HTTPS_PROXY || process.env.https_proxy,
});

async function main() {
  if (!process.env.SANITY_API_TOKEN)
    throw new Error("SANITY_API_TOKEN is not set");

  const slugs = Object.keys(ICONS);
  const ids = slugs.map((slug) => `drafts.item-${slug}`);
  const docs = await client.fetch("*[_id in $ids]{_id, name, icon}", { ids });
  const byId = new Map(docs.map((doc) => [doc._id, doc]));

  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length)
    throw new Error(`Draft items not found: ${missing.join(", ")}`);

  if (APPLY) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = join(ROOT, "backups");
    await mkdir(backupDir, { recursive: true });
    const backupPath = join(backupDir, `tool-icons-batch3-${stamp}.json`);
    await writeFile(
      backupPath,
      JSON.stringify(
        { createdAt: new Date().toISOString(), before: docs },
        null,
        2,
      ),
    );
    console.log(`Backup of previous icon state: ${backupPath}\n`);
  }

  for (const [slug, alt] of Object.entries(ICONS)) {
    const id = `drafts.item-${slug}`;
    const doc = byId.get(id);
    const status = doc.icon ? (REPLACE ? "replace" : "keep existing") : "add";
    console.log(`${id} -> ${status}`);
    if (doc.icon && !REPLACE) continue;
    if (!APPLY) continue;

    const buffer = await readFile(join(ICON_DIR, `${slug}.png`));
    const asset = await client.assets.upload("image", buffer, {
      filename: `${slug}-icon.png`,
    });
    await client
      .patch(id)
      .set({
        icon: {
          _type: "image",
          alt,
          asset: { _type: "reference", _ref: asset._id },
        },
      })
      .commit();
    console.log(`  uploaded ${asset._id}`);
  }

  if (!APPLY) {
    console.log(
      "\nNo data written. Re-run with --apply to upload and attach icons.",
    );
    return;
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
