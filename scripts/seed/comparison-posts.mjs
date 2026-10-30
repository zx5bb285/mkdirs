/**
 * Create the first two posts in the "alternatives / vs" content cluster.
 *
 * Usage:
 *   node scripts/seed/comparison-posts.mjs             # dry-run (default)
 *   node scripts/seed/comparison-posts.mjs --apply     # back up + write drafts
 *   node scripts/seed/comparison-posts.mjs --apply --replace-drafts
 *
 * Posts are written as `drafts.blogPost-<slug>` and are never published by
 * this script. An editor reviews and publishes them in Studio.
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const APPLY = process.argv.includes("--apply");
const REPLACE_DRAFTS = process.argv.includes("--replace-drafts");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-08-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: "raw",
});

let keyCounter = 0;
const key = () => `k${++keyCounter}`;
const span = (text, marks = []) => ({
  _type: "span",
  _key: key(),
  text,
  marks,
});

/**
 * Minimal inline parser for internal item/post links and external links.
 *   [label](item:chatgpt)
 *   [label](post:how-we-review-ai-tools)
 *   [label](https://example.com)
 */
function rich(text) {
  const children = [];
  const markDefs = [];
  const pattern =
    /\[([^\]]+)\]\((item|post):([a-z0-9-]+)\)|\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let last = 0;
  let match = pattern.exec(text);
  let linkIndex = 0;

  while (match) {
    if (match.index > last) {
      children.push(span(text.slice(last, match.index)));
    }
    const id = `link${++linkIndex}`;
    if (match[2]) {
      const type = match[2] === "item" ? "item" : "blogPost";
      markDefs.push({
        _key: id,
        _type: "internalLink",
        reference: {
          _type: "reference",
          _ref: `${type === "item" ? "item" : "blogPost"}-${match[3]}`,
          ...(type === "blogPost" ? { _weak: true } : {}),
        },
      });
      children.push(span(match[1], [id]));
    } else {
      markDefs.push({ _key: id, _type: "link", href: match[5] });
      children.push(span(match[4], [id]));
    }
    last = pattern.lastIndex;
    match = pattern.exec(text);
  }

  if (last < text.length) {
    children.push(span(text.slice(last)));
  }
  return { children, markDefs };
}

const block = (style, text) => ({
  _type: "block",
  _key: key(),
  style,
  ...rich(text),
});
const p = (text) => block("normal", text);
const h2 = (text) => block("h2", text);
const h3 = (text) => block("h3", text);
const list = (items) =>
  items.map((text) => ({
    _type: "block",
    _key: key(),
    style: "normal",
    listItem: "bullet",
    level: 1,
    ...rich(text),
  }));
const table = (rows) => ({
  _type: "table",
  _key: key(),
  rows: rows.map((cells) => ({
    _type: "tableRow",
    _key: key(),
    cells,
  })),
});

const authorRef = {
  _type: "reference",
  _ref: "author-dirhuntai-editorial",
  _weak: false,
};
const comparisonCategory = {
  _key: "category-comparisons",
  _type: "reference",
  _ref: "blogCategory-comparisons",
  _weak: false,
};

const posts = [
  {
    slug: "chatgpt-vs-claude",
    title: "ChatGPT vs Claude in 2026: Which AI Assistant Should You Choose?",
    seoTitle: "ChatGPT vs Claude in 2026: Which Is Better?",
    seoDescription:
      "Compare ChatGPT and Claude on plans, pricing, writing, long documents, research and coding. See which assistant fits your workflow in 2026.",
    excerpt:
      "ChatGPT and Claude share a chat interface but differ in breadth, document handling and pricing. Here is a practical comparison by workflow.",
    publishDate: "2026-10-21T00:01:00Z",
    body: [
      p(
        "ChatGPT and Claude are the two most common starting points for people choosing an AI assistant. Both can write, analyze files, search the web and help with code, so the decision usually comes down to workflow rather than a single capability. This comparison uses public pricing pages and product documentation; it is not a controlled benchmark.",
      ),
      p(
        "The short version: [ChatGPT](item:chatgpt) is the broader platform, with more plan options, image generation and a large ecosystem of custom assistants. [Claude](item:claude) is more focused on long documents, careful writing and code-adjacent work. The right choice depends on what you do every day.",
      ),
      h2("Quick comparison"),
      table([
        ["Dimension", "ChatGPT", "Claude"],
        ["Free plan", "Yes, with limits", "Yes, with limits"],
        ["Entry paid plan", "Go at $8/mo", "Pro at $20/mo"],
        ["Top individual plan", "Pro from $100/mo", "Max from $100/mo"],
        ["Best for", "Breadth and mixed tasks", "Long documents and writing"],
        [
          "Notable strength",
          "Images, custom GPTs, Deep Research",
          "Artifacts, Projects, Claude Code",
        ],
        [
          "Watch out for",
          "Plan and model limits vary",
          "Usage limits can interrupt heavy sessions",
        ],
      ]),
      h2("Writing and document work"),
      p(
        "ChatGPT is comfortable with short, varied tasks: an email, a landing page draft, a summary of a uploaded spreadsheet, then a revised version in the same thread. Custom GPTs and Projects help turn repeated instructions into a reusable setup. It is a good default when you want one tool for many kinds of work.",
      ),
      p(
        "Claude is stronger when the source material is long. It can hold a report, contract or set of research notes in context and work through it section by section. Artifacts display the output as a document or small app beside the conversation, which makes iteration more direct than copying text back and forth.",
      ),
      p(
        "For a single important document, Claude often feels calmer and more precise. For a day full of unrelated requests, ChatGPT's breadth is more useful. Neither removes the need for a human editor on published work.",
      ),
      h2("Research and web access"),
      p(
        "Both assistants can search the web. ChatGPT adds Deep Research on paid plans, which runs a longer, multi-source investigation and returns a cited report. That is useful when the task is to gather and reconcile sources rather than answer a single question.",
      ),
      p(
        "Claude can work with uploaded sources, connectors and web search, and its long context helps when several documents need to be compared. The practical difference is the starting point: ChatGPT is built to go find material, while Claude is particularly good at digesting material you already have.",
      ),
      h2("Coding and technical work"),
      p(
        "ChatGPT includes Codex access with plan-dependent limits. It can explain errors, draft functions and work through a bug in conversation. [Cursor](item:cursor) remains the more focused choice for repository-level editing, but ChatGPT is often enough for snippets and debugging questions.",
      ),
      p(
        "Claude includes Claude Code on Pro and higher plans, aimed at working with codebases from the terminal or editor. It also handles long files and code review well. Developers choosing between the two should test their own repository and review every generated diff.",
      ),
      h2("Pricing and limits"),
      p(
        "ChatGPT is free with limits. Go is $8 per month, Plus is $20 per month, and Pro starts at $100 per month. Business is $25 per user per month, or $20 per user per month billed annually, with a two-seat minimum. Enterprise is quoted by sales.",
      ),
      p(
        "Claude is also free with limits. Pro is $20 per month, or $17 per month billed annually. Max starts at $100 per month with 5x or 20x Pro usage. Team Standard is $25 per seat per month ($20 annual), Team Premium is $125 ($100 annual), and Enterprise is $20 per seat per month billed annually with a 20-seat minimum.",
      ),
      p(
        "The headline prices are close at the top, but the plans are not equivalent. Compare the actual usage limits for the models you rely on, and treat every published limit as temporary: both companies change them frequently.",
      ),
      h2("Which should you choose?"),
      ...list([
        "Choose ChatGPT if you want one assistant for writing, images, file analysis, research and light coding, especially at the $8–$20 tier.",
        "Choose Claude if your work is document-heavy, you review long files, or you want Artifacts and Projects in the same workspace.",
        "Choose both if the cost is justified: many teams use ChatGPT for breadth and Claude for long-form review.",
        "Choose neither as a replacement for editorial or engineering review; both can be confidently wrong.",
      ]),
      h2("Frequently asked questions"),
      h3("Is ChatGPT or Claude better for writing?"),
      p(
        "ChatGPT is more flexible across formats and has more built-in tools. Claude tends to produce careful prose and handles long documents more comfortably. The best test is to give both the same real brief and compare the edits you have to make.",
      ),
      h3("Are ChatGPT and Claude free?"),
      p(
        "Both offer free plans with usage limits. ChatGPT Go is $8 per month and Plus is $20; Claude Pro is $20 per month. Paid plans raise limits and unlock features such as projects, agents or coding tools.",
      ),
      h3("Can I use both assistants together?"),
      p(
        "Yes. A common workflow is to research or draft in one assistant and ask the other to critique the result. That can surface assumptions, but it does not verify facts; check important claims against primary sources.",
      ),
      p(
        "For the criteria behind this comparison, read [how we review AI tools](post:how-we-review-ai-tools).",
      ),
    ],
  },
  {
    slug: "grammarly-alternatives",
    title: "Grammarly Alternatives in 2026: 5 Options Compared",
    seoTitle: "Grammarly Alternatives in 2026: 5 Options",
    seoDescription:
      "Looking for a Grammarly alternative? Compare ChatGPT, Claude, Jasper, Copy.ai and QuillBot by workflow, free access and the jobs they do best.",
    excerpt:
      "Grammarly is strongest as an inline checker. If you need generation, long-document editing or marketing workflows, one of these five options may fit better.",
    publishDate: "2026-10-21T00:02:00Z",
    body: [
      p(
        "[Grammarly](item:grammarly) is an AI writing assistant that corrects grammar, clarity and tone inside the apps where people already write. That placement is its advantage, and it is also the reason some users look elsewhere: it improves existing text more than it generates new material or manages a content workflow.",
      ),
      p(
        "The alternatives below are not interchangeable. Some are general assistants, one is a marketing platform, and one is a focused paraphrasing tool. We compare them by the job they handle best rather than by a single quality score.",
      ),
      h2("Quick comparison"),
      table([
        ["Option", "Best for", "Free access", "Main trade-off"],
        [
          "ChatGPT",
          "Flexible drafting and rewriting",
          "Yes, with limits",
          "Not an inline checker",
        ],
        [
          "Claude",
          "Long documents and careful editing",
          "Yes, with limits",
          "Not an inline checker",
        ],
        [
          "Jasper",
          "Brand-consistent marketing teams",
          "Trial only",
          "Higher cost per seat",
        ],
        [
          "Copy.ai",
          "Repeatable sales and marketing workflows",
          "Check current plans",
          "Workflow-first, less ad hoc",
        ],
        [
          "QuillBot",
          "Paraphrasing and summarizing",
          "Free tier available",
          "Narrower than a full editor",
        ],
      ]),
      h2("1. ChatGPT: the general-purpose replacement"),
      p(
        "[ChatGPT](item:chatgpt) is the most flexible alternative. It can rewrite a paragraph, explain why a sentence is unclear, draft an email from a brief and then adjust the tone. The free plan covers unlimited text chats with limits on advanced features; Go is $8 per month and Plus is $20.",
      ),
      p(
        "The trade-off is placement. ChatGPT does not sit inside every text box, so the workflow becomes copy, paste, revise and copy back. It is better for substantial rewrites and explanations than for catching a missing comma while typing.",
      ),
      h2("2. Claude: long documents and careful prose"),
      p(
        "[Claude](item:claude) is a strong choice when the text is long or the source material is dense. It can review a report or contract in context, suggest structural edits and keep the revision consistent across sections. Artifacts let you work on the output beside the conversation.",
      ),
      p(
        "Claude's free plan has limits; Pro is $20 per month, or $17 per month billed annually. Like ChatGPT, it is a separate workspace rather than an inline checker, so it suits planned editing sessions more than quick corrections.",
      ),
      h2("3. Jasper: marketing teams and brand voice"),
      p(
        "[Jasper](item:jasper) is built for teams that produce campaigns, ads, emails and landing pages. Brand Voice, knowledge assets and marketing agents are designed to keep output consistent when several people write for one company.",
      ),
      p(
        "Jasper does not advertise a free plan. Pro is $69 per seat per month, or $59 billed annually, and Business is custom. It is more expensive than a general assistant, so the case for it depends on repeatable marketing volume and a team that will maintain the brand setup.",
      ),
      h2("4. Copy.ai: repeatable content operations"),
      p(
        "[Copy.ai](item:copy-ai) focuses on workflows rather than one-off prompts. Teams use it to standardize processes such as prospect research, content repurposing and campaign variants. That makes it more useful for an operations-minded team than for an individual polishing an essay.",
      ),
      p(
        "Pricing and free access have changed over time, so check the current plans before assuming a tier. If your main need is grammar correction, Copy.ai is more platform than you need.",
      ),
      h2("5. QuillBot: paraphrasing and summarizing"),
      p(
        "[QuillBot](item:quillbot) is the narrowest option here. It paraphrases, summarizes and supports citation work, which makes it useful for students and writers who need a quick rewording or a shorter version of a source.",
      ),
      p(
        "It does not replace Grammarly's inline checks across apps, and it is not a research or campaign platform. For a single repeated task, that focus can be an advantage.",
      ),
      h2("How to choose"),
      ...list([
        "Stay with Grammarly if you mainly need correctness and tone checks while typing in many apps.",
        "Choose ChatGPT or Claude if you need substantial rewriting, drafting or document-level feedback.",
        "Choose Jasper if a marketing team needs shared brand voice and campaign workflows.",
        "Choose Copy.ai if the work is a repeatable content or sales process rather than a single document.",
        "Choose QuillBot if paraphrasing and summarizing are the main tasks.",
      ]),
      h2("Frequently asked questions"),
      h3("What is the best free Grammarly alternative?"),
      p(
        "ChatGPT and Claude both have free plans with limits and can handle rewriting and explanation. QuillBot also offers a free tier for paraphrasing. The best choice depends on whether you need general drafting, long-document review or a focused rewording tool.",
      ),
      h3("Can ChatGPT replace Grammarly?"),
      p(
        "For substantial rewrites and explanations, often yes. For catching errors while typing in email, documents and social apps, no: ChatGPT is a separate workspace, while Grammarly works inline. Many users keep both.",
      ),
      h3("Are Grammarly alternatives cheaper?"),
      p(
        "Some are. ChatGPT Go is $8 per month and Claude Pro is $20, while Grammarly Pro is $12 per month billed annually or $30 month-to-month. Jasper is more expensive at $69 per seat per month. Compare the features you actually use, not just the headline price.",
      ),
      p(
        "See [how we review AI tools](post:how-we-review-ai-tools) for the evidence standards behind these comparisons.",
      ),
    ],
  },
].map((post) => ({
  ...post,
  _id: `drafts.blogPost-${post.slug}`,
  _type: "blogPost",
  slug: { _type: "slug", current: post.slug },
  categories: [comparisonCategory],
  author: authorRef,
  featured: false,
  lastReviewedAt: "2026-10-20T00:00:00Z",
}));

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error("SANITY_API_TOKEN is not set");
  }

  const ids = posts.map((post) => post._id);
  const publishedIds = posts.map((post) => `blogPost-${post.slug}`);
  const [existingDrafts, published, refs] = await Promise.all([
    client.fetch("*[_id in $ids]", { ids }),
    client.fetch("*[_id in $ids]{_id}", { ids: publishedIds }),
    client.fetch("*[_id in $ids]{_id}", {
      ids: ["author-dirhuntai-editorial", "blogCategory-comparisons"],
    }),
  ]);

  if (published.length) {
    throw new Error(
      `Published posts already exist: ${published
        .map((doc) => doc._id)
        .join(", ")}. Refusing to create drafts over published content.`,
    );
  }

  const foundRefs = new Set(refs.map((doc) => doc._id));
  for (const id of ["author-dirhuntai-editorial", "blogCategory-comparisons"]) {
    if (!foundRefs.has(id)) {
      throw new Error(`Required reference not found: ${id}`);
    }
  }

  if (existingDrafts.length && !REPLACE_DRAFTS && APPLY) {
    throw new Error(
      `Drafts already exist: ${existingDrafts
        .map((doc) => doc._id)
        .join(", ")}. Re-run with --replace-drafts to overwrite them.`,
    );
  }

  for (const post of posts) {
    const bodyText = post.body
      .filter((node) => node._type === "block")
      .map((node) => node.children.map((child) => child.text).join(""))
      .join(" ");
    console.log(
      `\n${post._id}\n  title ${post.title.length} chars · description ${post.seoDescription.length} · body ${bodyText.split(/\s+/).length} words`,
    );
    if (
      existingDrafts.some((draft) => draft._id === post._id) &&
      !REPLACE_DRAFTS
    ) {
      console.log("  DRAFT EXISTS (dry run will not overwrite)");
    }
  }

  console.log(`\n${APPLY ? "Applying" : "Dry run:"} ${posts.length} draft(s).`);

  if (!APPLY) {
    console.log(
      "No data written. Re-run with --apply to back up and create drafts.",
    );
    return;
  }

  if (existingDrafts.length) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = join(ROOT, "backups");
    await mkdir(backupDir, { recursive: true });
    const path = join(backupDir, `comparison-posts-${stamp}.json`);
    await writeFile(
      path,
      JSON.stringify(
        { createdAt: new Date().toISOString(), drafts: existingDrafts },
        null,
        2,
      ),
    );
    console.log(`Backup: ${path}`);
  }

  for (const post of posts) {
    await client.createOrReplace(post);
    console.log(`Wrote ${post._id}`);
  }

  console.log(
    "\nDone. Nothing was published. Review each draft in Studio before publishing.",
  );
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
