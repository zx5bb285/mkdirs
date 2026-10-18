/**
 * Seed the launch blog: one editorial author, three categories, four posts.
 *
 * Usage: node scripts/seed/blog.mjs
 *
 * The posts are editorial comparisons based on public documentation, pricing
 * pages and published user feedback. They deliberately avoid invented
 * benchmarks or first-hand testing claims.
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

let keyCounter = 0;
const key = () => `k${++keyCounter}`;
const span = (text, marks = []) => ({
  _type: "span",
  _key: key(),
  text,
  marks,
});

/**
 * Very small inline parser:
 *   [label](item:chatgpt)          -> internal item link
 *   [label](post:some-slug)        -> internal blog link
 *   [label](https://example.com)   -> external link
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
          // Posts are created in a single pass and may link to a post that
          // appears later in the list, so allow the reference to resolve
          // after the mutation instead of rejecting the write.
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

const p = (text) => ({
  _type: "block",
  _key: key(),
  style: "normal",
  markDefs: [],
  ...rich(text),
});
const h2 = (text) => ({
  _type: "block",
  _key: key(),
  style: "h2",
  markDefs: [],
  ...rich(text),
});
const h3 = (text) => ({
  _type: "block",
  _key: key(),
  style: "h3",
  markDefs: [],
  ...rich(text),
});
const quote = (text) => ({
  _type: "block",
  _key: key(),
  style: "blockquote",
  markDefs: [],
  ...rich(text),
});
const list = (items, ordered = false) =>
  items.map((text) => ({
    _type: "block",
    _key: key(),
    style: "normal",
    listItem: ordered ? "number" : "bullet",
    level: 1,
    markDefs: [],
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

const author = {
  _id: "author-dirhuntai-editorial",
  _type: "user",
  name: "DirHunt AI Editorial",
  email: "hello@dirhuntai.com",
  slug: { _type: "slug", current: "dirhuntai-editorial" },
  authorType: "Organization",
  jobTitle: "Editorial team",
  bio: "DirHunt AI's editorial team researches AI products using public documentation, pricing pages, release notes and published user reports. We separate vendor claims from verifiable capabilities, avoid invented benchmarks, and update articles when products change.",
  expertise: ["AI writing", "AI coding", "AI video", "Software reviews"],
  role: "USER",
};

const categories = [
  {
    _id: "blogCategory-reviews",
    name: "Reviews",
    slug: "reviews",
    priority: 100,
    description: "In-depth reviews of individual AI products and platforms.",
  },
  {
    _id: "blogCategory-comparisons",
    name: "Comparisons",
    slug: "comparisons",
    priority: 90,
    description:
      "Side-by-side comparisons to help you choose between similar AI tools.",
  },
  {
    _id: "blogCategory-guides",
    name: "Guides",
    slug: "guides",
    priority: 80,
    description: "Practical guides for evaluating and getting more from AI tools.",
  },
].map((category) => ({
  ...category,
  _type: "blogCategory",
  slug: { _type: "slug", current: category.slug },
}));

const posts = [
  {
    slug: "best-ai-writing-tools",
    title: "Best AI Writing Tools in 2026: A Practical Comparison",
    seoTitle: "Best AI Writing Tools in 2026: Compared",
    seoDescription:
      "Compare ChatGPT, Claude, Jasper, Copy.ai, Grammarly, QuillBot and Surfer SEO by workflow, output quality, free tiers and the jobs they do best.",
    excerpt:
      "There is no single best AI writing tool. We compare seven options by the work they handle best, from long-form editing to marketing campaigns and SEO briefs.",
    category: "comparisons",
    featured: true,
    publishDate: "2026-10-16T09:00:00Z",
    body: [
      p(
        "AI writing tools now cover everything from a single sentence to a full content program. The hard part is no longer generating text — it is choosing a tool whose workflow, controls and output quality match the way you actually publish.",
      ),
      p(
        "We compared seven tools that represent different approaches: general assistants, marketing platforms, editing tools and SEO-focused editors. This is an editorial comparison based on public documentation, pricing pages and published user feedback, not a controlled lab benchmark.",
      ),
      h2("How we compared these tools"),
      p(
        "We looked at five things: how well each tool follows a brief, how much control it gives over voice and structure, whether it fits an existing publishing workflow, how clearly it explains limits and pricing, and whether it exports clean text. Free-tier details change frequently, so confirm current limits on each product's pricing page.",
      ),
      h2("Quick comparison"),
      table([
        ["Tool", "Best for", "Free tier", "Notable strength"],
        ["ChatGPT", "Flexible drafting and research", "Yes", "Conversational editing and file analysis"],
        ["Claude", "Long documents and careful editing", "Yes", "Large context and natural prose"],
        ["Jasper", "Marketing teams", "Trial only", "Brand voice and campaign workflows"],
        ["Copy.ai", "Sales and marketing operations", "Yes", "Reusable workflows"],
        ["Grammarly", "Everyday correctness and tone", "Yes", "Works across apps"],
        ["QuillBot", "Paraphrasing and study", "Yes", "Fast rewording"],
        ["Surfer SEO", "Search-driven articles", "No", "SERP-based content scoring"],
      ]),
      h2("General assistants: ChatGPT and Claude"),
      p(
        "[ChatGPT](item:chatgpt) is the most flexible option in this group. It can draft, restructure, summarize uploaded files and answer follow-up questions in the same conversation. That makes it a good first stop when you are not sure what kind of help you need.",
      ),
      p(
        "[Claude](item:claude) is particularly comfortable with long documents. If your workflow involves reviewing reports, contracts or codebases, its ability to hold a large amount of context in one conversation is the main reason to choose it. Its prose also tends to need fewer corrective passes.",
      ),
      p(
        "Neither tool is a complete content platform. They do not manage brand assets, editorial calendars or publication workflows. They are best used as drafting and analysis partners alongside a tool that owns the process.",
      ),
      h2("Marketing platforms: Jasper and Copy.ai"),
      p(
        "[Jasper](item:jasper) is built around marketing teams. Brand voice controls, templates and campaign workflows matter when several people produce copy and the output has to sound consistent. It is a paid product with a trial rather than a permanent free tier, so it makes most sense when writing volume justifies the cost.",
      ),
      p(
        "[Copy.ai](item:copy-ai) has moved beyond one-off copy generation into reusable workflows for sales outreach, content repurposing and marketing operations. Teams that repeat the same process every week will get more from it than someone who only needs an occasional paragraph.",
      ),
      h2("Editing and rewriting: Grammarly and QuillBot"),
      p(
        "[Grammarly](item:grammarly) works where you already write: browsers, desktop apps and mobile keyboards. Its value is consistency — grammar, clarity and tone checks without changing tools. Paid plans add rewriting and team style guides, but the free tier is enough for basic correctness.",
      ),
      p(
        "[QuillBot](item:quillbot) is narrower: paraphrasing, summarizing and citation support. That focus makes it fast for rewording a paragraph or condensing a source, which is useful for students and writers who need a quick second pass rather than a full editing environment.",
      ),
      h2("SEO content: Surfer SEO"),
      p(
        "[Surfer SEO](item:surfer-seo) starts from search results rather than a blank prompt. It builds briefs from competing pages, scores drafts against relevant terms and suggests internal links. It is not a replacement for editorial judgment, but it makes the research-to-draft handoff explicit and repeatable.",
      ),
      h2("How to choose"),
      ...list([
        "If you need one tool for mixed writing and research, start with a general assistant such as ChatGPT or Claude.",
        "If several marketers publish under one brand, prioritize voice controls and shared workflows over raw generation speed.",
        "If correctness matters more than generation, choose an editor that runs inside your existing apps.",
        "If organic search is the main channel, use an SEO editor and keep a human editor in the loop.",
      ]),
      h2("Frequently asked questions"),
      h3("Are free AI writing tools good enough?"),
      p(
        "For short drafts, summaries and rewrites, yes. Free tiers usually limit message counts, context length or access to the newest models. Paid plans matter most when you need consistent brand voice, team collaboration or higher usage.",
      ),
      h3("Can AI writing tools replace a human editor?"),
      p(
        "They can produce a usable first draft, but they do not verify facts, understand your audience's sensitivities or take responsibility for what is published. Treat output as a draft that still needs editorial review.",
      ),
      h3("Which tool is best for long articles?"),
      p(
        "Claude and ChatGPT are the strongest general-purpose options for long drafts because they can work with large documents and follow detailed instructions. For search-optimized articles, pair them with a brief from Surfer SEO or a similar tool.",
      ),
      p(
        "For more on how these comparisons are produced, read [our review methodology](post:how-we-review-ai-tools).",
      ),
    ],
  },
  {
    slug: "best-ai-coding-assistants",
    title: "Best AI Coding Assistants in 2026: Cursor, Copilot, or Windsurf?",
    seoTitle: "Best AI Coding Assistants in 2026",
    seoDescription:
      "Compare Cursor, GitHub Copilot, Windsurf, Tabnine, Continue and JetBrains AI by agent capability, editor fit, privacy controls and team workflow.",
    excerpt:
      "AI coding assistants have split into agentic editors, platform-integrated tools and privacy-first completion. Here is how the leading options differ.",
    category: "comparisons",
    featured: false,
    publishDate: "2026-10-17T09:00:00Z",
    body: [
      p(
        "AI coding assistants have moved from single-line completion to multi-file editing, terminal commands and pull-request review. The right choice now depends less on which model is best and more on where your code lives, how much autonomy you want to delegate and what your security team will allow.",
      ),
      h2("How we compared these tools"),
      p(
        "We evaluated the editing surface, the amount of context each tool can use, how it handles multi-step tasks, deployment and privacy options, and how well it fits an existing team workflow. Features in this category change quickly, so treat the comparison as a starting point and verify current capabilities before standardizing.",
      ),
      h2("Quick comparison"),
      table([
        ["Tool", "Best for", "Free tier", "Notable strength"],
        ["Cursor", "AI-first individual editing", "Limited", "Multi-file agent inside VS Code"],
        ["GitHub Copilot", "Teams already on GitHub", "Limited", "Integration across the development lifecycle"],
        ["Windsurf", "Agentic refactors", "Limited", "Cascade multi-step flows"],
        ["Tabnine", "Regulated enterprises", "Trial", "Self-hosting and policy controls"],
        ["Continue", "Open-source and local models", "Open source", "Model and context flexibility"],
        ["JetBrains AI", "JetBrains IDE users", "Limited", "IDE-aware project context"],
      ]),
      h2("Agentic editors: Cursor and Windsurf"),
      p(
        "[Cursor](item:cursor) is built on VS Code, which keeps the migration cost low for most developers. Its agent can read across a codebase, propose multi-file changes and run commands. The experience is closest to working with a fast pair programmer who can take a task and return with a diff.",
      ),
      p(
        "[Windsurf](item:windsurf) takes a similar agent-first approach with its Cascade feature. The difference is mostly in interaction design and how much of the workflow is delegated to the agent. Both are strongest when you give them a clear task, access to the relevant files and a way to verify the result.",
      ),
      h2("Platform-native: GitHub Copilot"),
      p(
        "[GitHub Copilot](item:github-copilot) has the broadest footprint. It works in popular editors and inside GitHub, where it can review pull requests and work from issues. For teams that already run planning, review and CI on GitHub, keeping assistance in the same system reduces context switching.",
      ),
      h2("Privacy and self-hosting: Tabnine"),
      p(
        "[Tabnine](item:tabnine) is aimed at organizations that cannot send source code to a public AI service. Self-hosted models, private repositories and organizational policies are the core of the offer. It is less about flashy agents and more about deploying completion under constraints.",
      ),
      h2("Open source and model choice: Continue"),
      p(
        "[Continue](item:continue) is an open-source assistant for VS Code and JetBrains. You can connect hosted or local models and customize prompts and context providers. It requires more setup than a commercial product, but it gives teams something they can audit and adapt.",
      ),
      h2("IDE-native: JetBrains AI"),
      p(
        "[JetBrains AI](item:jetbrains-ai) is the natural choice if your team lives in IntelliJ, PyCharm or WebStorm. It uses the IDE's understanding of project structure for completion, explanation and refactoring suggestions, which can be more precise than a generic editor plug-in.",
      ),
      h2("How to choose"),
      ...list([
        "Choose an agentic editor when you want help with multi-file changes and are comfortable reviewing generated diffs.",
        "Choose a platform-integrated tool when issue tracking, review and CI already live in one place.",
        "Choose a self-hosted or open-source option when code cannot leave your infrastructure.",
        "Pilot with one team and measure review time, not just completion acceptance.",
      ]),
      h2("Frequently asked questions"),
      h3("Do AI coding assistants introduce more bugs?"),
      p(
        "They can. Generated code may compile and still be wrong, and larger agent edits are harder to review. The mitigation is process: small diffs, tests, and a reviewer who understands the change.",
      ),
      h3("Can I use these tools with a private codebase?"),
      p(
        "Most commercial tools offer business plans with data-handling terms, and some offer self-hosting. Check the provider's current terms and your own compliance requirements before rolling a tool out.",
      ),
      h3("Which tool is best for beginners?"),
      p(
        "A tool that explains code and keeps changes visible is more useful than one that silently edits many files. GitHub Copilot and JetBrains AI are approachable for learners; Continue is a good option if you want to experiment with local models.",
      ),
      p(
        "See [how we review AI tools](post:how-we-review-ai-tools) for the criteria behind these comparisons.",
      ),
    ],
  },
  {
    slug: "best-ai-video-generators",
    title:
      "Best AI Video Generators in 2026: Runway, Pika, Luma and Kling Compared",
    seoTitle: "Best AI Video Generators in 2026",
    seoDescription:
      "Compare Runway, Pika, Luma Dream Machine, Kling AI and Hailuo AI on motion quality, clip length, camera control and the workflows they suit.",
    excerpt:
      "Text-to-video tools are improving quickly, but they excel at different things. We compare five leading generators by motion, control and production fit.",
    category: "comparisons",
    featured: false,
    publishDate: "2026-10-18T09:00:00Z",
    body: [
      p(
        "AI video generation has become good enough for storyboards, social clips and select production shots. It is still unreliable for long, continuous narrative, and every tool in this category requires iteration. The practical question is which one gives you the control and motion quality your project needs.",
      ),
      h2("How we compared these tools"),
      p(
        "We looked at prompt adherence, motion quality, clip length, camera and keyframe controls, editing options, and how easy it is to iterate. Output quality varies by prompt and version, so this comparison focuses on workflow and documented capabilities rather than a single leaderboard.",
      ),
      h2("Quick comparison"),
      table([
        ["Tool", "Best for", "Free tier", "Notable strength"],
        ["Runway", "Generation plus editing", "Credits", "All-in-one production toolkit"],
        ["Pika", "Social clips and effects", "Credits", "Playful transformations"],
        ["Luma Dream Machine", "Cinematic motion", "Credits", "Camera and keyframe control"],
        ["Kling AI", "Dynamic scenes", "Credits", "Longer, motion-heavy shots"],
        ["Hailuo AI", "Stylized short videos", "Credits", "Expressive character motion"],
      ]),
      h2("Runway: the production suite"),
      p(
        "[Runway](item:runway) is the broadest option. It combines generation with editing tools such as object removal, shot extension and style effects, so you can refine a clip after generating it. Teams that need a repeatable pipeline will appreciate having those steps in one place.",
      ),
      h2("Pika: fast, playful clips"),
      p(
        "[Pika](item:pika) is designed for short, shareable videos. Effects such as morphing and scene transformations are easy to apply, and the workflow encourages quick iteration. It is a good fit for social content where the idea matters more than cinematic continuity.",
      ),
      h2("Luma Dream Machine: motion and camera control"),
      p(
        "[Luma Dream Machine](item:luma-dream-machine) emphasizes natural motion and cinematic framing. Starting and ending frames plus camera prompts give more directorial control than a single text box, which helps when a shot needs to match a storyboard.",
      ),
      h2("Kling AI: dynamic movement"),
      p(
        "[Kling AI](item:kling-ai) has been noted for handling movement and longer shots. Controls for motion intensity and camera behavior make it useful for action-oriented scenes, though complex motion still benefits from several attempts and careful selection.",
      ),
      h2("Hailuo AI: expressive short-form"),
      p(
        "[Hailuo AI](item:hailuo-ai) focuses on short clips with expressive character motion. Templates and a lightweight interface make it approachable for social formats, where a single striking shot is often enough.",
      ),
      h2("A practical workflow"),
      ...list([
        "Write a shot list before touching the prompt box; generation works best when each clip has one clear idea.",
        "Generate several variations and keep the best take rather than trying to perfect one prompt.",
        "Use image-to-video or keyframes when composition matters.",
        "Plan for post-production: upscaling, color, sound and editing still decide whether a clip feels finished.",
      ]),
      h2("Frequently asked questions"),
      h3("Can AI video generators make a full film?"),
      p(
        "Not reliably. They can produce individual shots and short sequences, but continuity, character consistency and narrative pacing still require human planning and editing.",
      ),
      h3("Are the outputs commercially usable?"),
      p(
        "Licensing depends on the provider and your plan. Check the current terms for commercial use and content restrictions before publishing.",
      ),
      h3("Which tool is best for beginners?"),
      p(
        "Pika and Hailuo AI have the simplest short-clip workflows. Runway offers more control but also more options to learn.",
      ),
      p(
        "For the criteria behind these comparisons, read [how we review AI tools](post:how-we-review-ai-tools).",
      ),
    ],
  },
  {
    slug: "how-we-review-ai-tools",
    title: "How We Review AI Tools: Our Methodology and Editorial Standards",
    seoTitle: "How We Review AI Tools",
    seoDescription:
      "Our editorial process: what we evaluate, which sources we use, how we handle pricing changes, sponsorships and corrections, and when reviews are updated.",
    excerpt:
      "Trust starts with a clear method. Here is how DirHunt AI evaluates tools, what we count as evidence and how we handle corrections.",
    category: "guides",
    featured: false,
    publishDate: "2026-10-15T09:00:00Z",
    body: [
      p(
        "DirHunt AI publishes a directory and editorial comparisons of AI tools. Because the category changes quickly, we explain how we work rather than asking readers to trust a score without context.",
      ),
      h2("What we evaluate"),
      ...list([
        "Capabilities: what the product actually does, based on documentation and observable product behavior.",
        "Output quality: whether results are usable, controllable and consistent enough for the stated use case.",
        "Workflow: setup cost, collaboration features, export options and how the tool fits existing work.",
        "Pricing clarity: whether free tiers and limits are explained without hidden conditions.",
        "Data handling: what the provider says about retention, training and enterprise controls.",
        "Support and reliability: documentation quality, status history and published user feedback.",
      ]),
      h2("Which sources we use"),
      p(
        "We rely on official documentation, release notes, pricing pages, security and privacy documentation, and published user reports. When we can test a product directly, we describe what we tested. When a conclusion rests on vendor material or community feedback, we say so.",
      ),
      h2("What we do not do"),
      ...list([
        "We do not invent benchmark scores or claim hands-on testing we did not perform.",
        "We do not sell rankings. Paid listings or sponsorships are labeled and kept separate from editorial ordering.",
        "We do not treat a vendor's marketing claim as verified fact.",
        "We do not copy pricing into a permanent table without noting that prices change.",
      ]),
      h2("How often we update"),
      p(
        "Articles show a last-reviewed date. We update a comparison when a major model, pricing change or ownership change affects the recommendation. Smaller changes may be reflected in the directory listing before the article is revised.",
      ),
      h2("Corrections"),
      p(
        "If you find an error, contact us at hello@dirhuntai.com with the page and the correction. We review factual claims against primary sources and update the article when a correction is warranted.",
      ),
      h2("Sponsorship and independence"),
      p(
        "The directory may include sponsored placements in the future. Sponsorship affects placement, never the editorial assessment of a product. Editorial comparisons are written independently of commercial relationships.",
      ),
      p(
        "You can browse the directory by [category](https://dirhuntai.com/category) or start with a comparison such as [the best AI writing tools](post:best-ai-writing-tools).",
      ),
    ],
  },
].map((post) => ({
  ...post,
  _id: `blogPost-${post.slug}`,
  _type: "blogPost",
  slug: { _type: "slug", current: post.slug },
  author: { _type: "reference", _ref: author._id },
  categories: [
    { _type: "reference", _ref: `blogCategory-${post.category}` },
  ],
  lastReviewedAt: "2026-10-18T00:00:00Z",
}));

await client.createOrReplace(author);
console.log(`author: ${author.name}`);

for (const category of categories) {
  await client.createOrReplace(category);
  console.log(`blog category: ${category.name}`);
}

for (const post of posts) {
  const { category, ...document } = post;
  await client.createOrReplace(document);
  console.log(`post: ${post.slug.current}`);
}

console.log(`done: ${posts.length} posts`);
