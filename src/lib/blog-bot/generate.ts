import { xai } from "@ai-sdk/xai";
import { type LanguageModelV1, generateObject, generateText } from "ai";
import { slugify } from "transliteration";
import { type ArticleInput, generatedArticleSchema } from "./types";

const DEFAULT_MODEL = process.env.XAI_BLOG_MODEL || "grok-3";

/**
 * Generate a bilingual SEO review article with Grok (xAI).
 *
 * The primary path uses structured output. Some xAI models reject the
 * tool/JSON-schema mode, so we fall back to plain text + JSON extraction.
 */
export async function generateArticle({
  topic,
  keywords = [],
  imageUrls = [],
}: {
  topic: string;
  keywords?: string[];
  imageUrls?: string[];
}): Promise<ArticleInput> {
  if (!process.env.XAI_API_KEY) {
    throw new Error(
      "XAI_API_KEY is not configured. Set it, or use mode=ingest and send a ready article.",
    );
  }

  // @ai-sdk/xai resolves a newer @ai-sdk/provider than `ai` 4.0.x types
  // against; the runtime interface is identical, so bridge the type here.
  const model = xai(DEFAULT_MODEL) as unknown as LanguageModelV1;
  const system =
    "You are a senior SEO editor and product reviewer. You write factual, useful buying guides. You never invent statistics, prices, review scores, or quotes.";
  const prompt = buildPrompt({ topic, keywords, imageUrls });

  let article: ReturnType<typeof generatedArticleSchema.parse>;

  try {
    const result = await generateObject({
      model,
      schema: generatedArticleSchema,
      system,
      prompt,
      temperature: 0.6,
    });
    article = generatedArticleSchema.parse(result.object);
  } catch {
    const { text } = await generateText({
      model,
      system,
      prompt: `${prompt}\n\nReturn ONLY a valid JSON object, no markdown fences.`,
      temperature: 0.6,
    });
    article = generatedArticleSchema.parse(parseJsonObject(text));
  }

  const slug = slugify(article.slug || article.title, {
    lowercase: true,
    separator: "-",
  });

  return {
    title: article.title,
    titleZh: article.titleZh,
    slug,
    excerpt: article.excerpt,
    excerptZh: article.excerptZh,
    markdown: article.markdown,
    markdownZh: article.markdownZh,
    coverImageUrl: imageUrls[0],
    categories: article.categories,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    externalId: `grok:${slugify(topic, { lowercase: true })}`,
  };
}

function buildPrompt({
  topic,
  keywords,
  imageUrls,
}: {
  topic: string;
  keywords: string[];
  imageUrls: string[];
}) {
  return `Write a buying-guide article about: "${topic}".

Target keywords: ${keywords.length > 0 ? keywords.join(", ") : topic}
Audience: English-speaking readers searching for practical, free or affordable software. Also provide a natural Simplified Chinese translation for a /zh-CN audience.

Hard requirements:
- English body: 1,400-2,000 words. Chinese body: a faithful, natural translation (not a literal machine translation).
- Title: under 65 characters and contains the primary keyword.
- Excerpt: 120-160 characters, compelling but not clickbait.
- Structure: short intro, at least 5 H2 sections, H3 subsections where useful, one comparison table in Markdown, a "How to choose" section, and an FAQ with 4 questions.
- Include honest trade-offs and limitations; do not invent benchmark numbers, prices, ratings, awards, or quotes. Use qualitative claims only.
- Add 2-5 outbound links to official product pages. Use real, well-known URLs only.
- slug: lowercase ASCII words separated by hyphens, no dates.
- categories: 1-3 short category names (e.g. "Video Editing", "AI Tools").
- seoTitle: <= 60 characters. seoDescription: 140-160 characters.
- keywords: 5-10 related search phrases.
${
  imageUrls.length > 0
    ? `- Insert these image URLs as Markdown images with descriptive alt text, spread across sections:\n${imageUrls
        .map((url) => `  - ${url}`)
        .join("\n")}`
    : "- Do not include images in the Markdown body; the caller supplies the cover image."
}`;
}

function parseJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The model did not return a JSON object");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}
