import { siteConfig } from "@/config/site";
import { localePath, routing } from "@/i18n/routing";
import {
  blogBotSecretConfigured,
  isBlogBotAuthorized,
} from "@/lib/blog-bot/auth";
import { generateArticle } from "@/lib/blog-bot/generate";
import { extractImageUrls } from "@/lib/blog-bot/markdown-to-portable-text";
import { publishArticle } from "@/lib/blog-bot/publish";
import { evaluateArticle } from "@/lib/blog-bot/quality";
import { type ArticleInput, generateRequestSchema } from "@/lib/blog-bot/types";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_BODY_BYTES = 3 * 1024 * 1024;

/**
 * Blog bot endpoint.
 *
 * POST /api/blog/generate
 * Authorization: Bearer $BLOG_BOT_SECRET
 *
 * Two modes:
 *  - ingest:   send a finished bilingual article (`article`) and it is
 *              quality-checked, images mirrored, then published or drafted.
 *  - generate: send a `topic`; the route asks Grok (xAI) for the article.
 *
 * See docs/blog-bot.md for the request schema and curl examples.
 */
export async function POST(request: Request) {
  if (!blogBotSecretConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "BLOG_BOT_SECRET is not configured (minimum 16 characters). The endpoint is disabled.",
      },
      { status: 503 },
    );
  }

  if (!isBlogBotAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Request body too large" },
      { status: 413 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = generateRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed",
        issues: parsed.error.issues,
      },
      { status: 422 },
    );
  }

  const {
    mode,
    topic,
    keywords,
    imageUrls,
    article,
    autoPublish,
    createMissingCategories,
    dryRun,
  } = parsed.data;

  let input: ArticleInput;
  try {
    if (mode === "generate") {
      input = await generateArticle({
        topic: topic as string,
        keywords,
        imageUrls,
      });
    } else {
      input = article as ArticleInput;
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        stage: "generate",
        error: error instanceof Error ? error.message : "Generation failed",
      },
      { status: 502 },
    );
  }

  const markdown = input.markdown || input.markdownZh || "";
  if (!markdown) {
    return NextResponse.json(
      { ok: false, error: "Article has neither `markdown` nor `markdownZh`" },
      { status: 422 },
    );
  }

  if (dryRun) {
    const quality = evaluateArticle({
      article: {
        title: input.title,
        excerpt: input.excerpt,
        slug: input.slug || "draft-slug",
      },
      markdown,
      markdownZh: input.markdownZh,
      keywords,
      hasCoverImage:
        !!input.coverImageUrl || extractImageUrls(markdown).length > 0,
    });
    return NextResponse.json({
      ok: true,
      dryRun: true,
      quality,
      article: {
        title: input.title,
        slug: input.slug,
        wordCount: quality.metrics.wordCount,
      },
    });
  }

  const shouldAutoPublish =
    autoPublish ?? process.env.BLOG_AUTO_PUBLISH !== "false";

  try {
    const result = await publishArticle(input, {
      autoPublish: shouldAutoPublish,
      createMissingCategories,
      keywords,
    });

    // Make a newly published post visible immediately instead of waiting
    // for the 60s sanityFetch revalidation window.
    if (result.status === "published") {
      // URLs are locale-less (localePrefix: "never"), so one revalidation
      // covers every language.
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath(result.path);
      revalidatePath("/feed.xml");
      revalidatePath("/sitemap.xml");
    }

    const base = siteConfig.url.replace(/\/$/, "");
    const publishedUrls =
      result.status === "published"
        ? Object.fromEntries(
            routing.locales.map((locale) => [
              locale,
              `${base}${localePath(locale, result.path)}`,
            ]),
          )
        : undefined;

    return NextResponse.json({
      ok: true,
      ...result,
      publishedUrls,
      studioUrl:
        result.status === "draft"
          ? `${base}${result.path}`
          : `${base}/studio/structure/blogPost;${result.id}`,
    });
  } catch (error) {
    console.error("blog bot publish failed", error);
    return NextResponse.json(
      {
        ok: false,
        stage: "publish",
        error: error instanceof Error ? error.message : "Publish failed",
      },
      { status: 500 },
    );
  }
}

/**
 * Lightweight authenticated health check, useful when wiring the bot.
 */
export async function GET(request: Request) {
  if (!isBlogBotAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    model: process.env.XAI_BLOG_MODEL || "grok-3",
    autoPublish: process.env.BLOG_AUTO_PUBLISH !== "false",
    authorConfigured: !!(
      process.env.BLOG_BOT_AUTHOR_EMAIL || process.env.BLOG_BOT_AUTHOR_ID
    ),
    minWords: Number(process.env.BLOG_BOT_MIN_WORDS || 800),
  });
}
