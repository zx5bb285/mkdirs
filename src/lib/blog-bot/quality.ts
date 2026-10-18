import type { ArticleInput, QualityIssue, QualityReport } from "./types";

const MIN_WORDS = Number(process.env.BLOG_BOT_MIN_WORDS || 800);
const MIN_ZH_CHARS = Number(process.env.BLOG_BOT_MIN_ZH_CHARS || 600);

const BANNED_PHRASES = [
  "lorem ipsum",
  "as an ai language model",
  "as an ai, i",
  "[insert",
  "insert keyword",
  "todo:",
  "placeholder text",
  "undefined",
];

/**
 * Rule-based quality gate. It is intentionally conservative: anything that
 * fails here is saved as a draft instead of going live.
 */
export function evaluateArticle({
  article,
  markdown,
  markdownZh,
  keywords = [],
  hasCoverImage,
}: {
  article: Pick<ArticleInput, "title" | "excerpt" | "slug">;
  markdown: string;
  markdownZh?: string;
  keywords?: string[];
  hasCoverImage: boolean;
}): QualityReport {
  const issues: QualityIssue[] = [];
  const warnings: QualityIssue[] = [];

  const wordCount = countWords(markdown);
  const headingCount = (markdown.match(/^#{2,3}\s+\S/gm) || []).length;
  const inlineImages = (
    markdown.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g) || []
  ).length;
  const imageCount = inlineImages + (hasCoverImage ? 1 : 0);
  const linkCount = (markdown.match(/\]\((https?:\/\/[^)\s]+)\)/g) || [])
    .length;
  const titleLength = article.title.length;
  const excerptLength = (article.excerpt || "").length;

  const searchable =
    `${article.title}\n${markdown.slice(0, 2500)}`.toLowerCase();
  const keywordMatches = keywords.filter((keyword) =>
    searchable.includes(keyword.toLowerCase()),
  ).length;

  if (wordCount < MIN_WORDS) {
    issues.push({
      code: "too_short",
      message: `Body has ${wordCount} words; minimum is ${MIN_WORDS}.`,
    });
  }
  if (headingCount < 2) {
    issues.push({
      code: "missing_headings",
      message: "Add at least two H2/H3 sections for scannability.",
    });
  }
  if (titleLength < 15 || titleLength > 90) {
    issues.push({
      code: "title_length",
      message: `Title is ${titleLength} characters; keep it between 15 and 90.`,
    });
  }
  if (excerptLength === 0) {
    issues.push({ code: "missing_excerpt", message: "Add an excerpt." });
  } else if (excerptLength < 50 || excerptLength > 220) {
    warnings.push({
      code: "excerpt_length",
      message: `Excerpt is ${excerptLength} characters; 50-220 works best.`,
    });
  }
  if (imageCount === 0) {
    issues.push({
      code: "missing_images",
      message: "Include at least one cover or inline image.",
    });
  }
  if (keywords.length > 0 && keywordMatches === 0) {
    issues.push({
      code: "keyword_missing",
      message: "None of the target keywords appears in the title or intro.",
    });
  }
  if (linkCount < 2) {
    warnings.push({
      code: "few_links",
      message: "Add at least two outbound or internal links.",
    });
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) {
    issues.push({
      code: "invalid_slug",
      message:
        "Slug must be lowercase ASCII words separated by hyphens (e.g. best-free-video-editors).",
    });
  }

  const lower = `${markdown}\n${markdownZh || ""}`.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      issues.push({
        code: "placeholder_text",
        message: `Remove placeholder phrase: "${phrase}".`,
      });
    }
  }

  if (markdownZh) {
    const zhChars = countCjk(markdownZh);
    const zhHeadings = (markdownZh.match(/^#{2,3}\s+\S/gm) || []).length;
    if (zhChars < MIN_ZH_CHARS) {
      issues.push({
        code: "zh_too_short",
        message: `Chinese body has ${zhChars} characters; minimum is ${MIN_ZH_CHARS}.`,
      });
    }
    if (zhHeadings < 2) {
      issues.push({
        code: "zh_missing_headings",
        message: "Chinese body needs at least two H2/H3 sections.",
      });
    }
  } else {
    warnings.push({
      code: "missing_zh",
      message:
        "No Chinese body supplied; /zh-CN will fall back to the primary language.",
    });
  }

  const penalty =
    issues.length * 18 + warnings.length * 5 + (wordCount < MIN_WORDS ? 10 : 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    pass: issues.length === 0,
    score,
    issues,
    warnings,
    metrics: {
      wordCount,
      headingCount,
      imageCount,
      linkCount,
      titleLength,
      excerptLength,
      keywordMatches,
    },
  };
}

export function countWords(markdown: string): number {
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#>*_~`|-]/g, " ");

  const latinWords = (
    cleaned.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []
  ).length;
  return latinWords + countCjk(cleaned);
}

export function countCjk(value: string): number {
  return (value.match(/[㐀-鿿]/g) || []).length;
}
