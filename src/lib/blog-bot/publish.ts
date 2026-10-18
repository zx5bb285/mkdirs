import { sanityClient } from "@/sanity/lib/client";
import { slugify } from "transliteration";
import { mirrorImages, uploadRemoteImage } from "./images";
import {
  type PortableTextBlock,
  extractImageUrls,
  markdownToPortableText,
} from "./markdown-to-portable-text";
import { evaluateArticle } from "./quality";
import type { ArticleInput, QualityReport } from "./types";

interface PublishOptions {
  autoPublish: boolean;
  createMissingCategories: boolean;
  keywords?: string[];
}

export interface PublishResult {
  id: string;
  slug: string;
  status: "published" | "draft";
  quality: QualityReport;
  action: "created" | "updated";
  imageCount: number;
  failedImages: Array<{ url: string; reason: string }>;
  /** Locale-less path: /blog/{slug} or /studio/structure/blogPost;{id} */
  path: string;
}

export async function publishArticle(
  article: ArticleInput,
  options: PublishOptions,
): Promise<PublishResult> {
  const primaryMarkdown = article.markdown || article.markdownZh;
  if (!primaryMarkdown) {
    throw new Error("Article has neither `markdown` nor `markdownZh`");
  }

  const zhMarkdown = article.markdownZh;
  const authorId = await resolveAuthorId(article);
  const categories = await resolveCategories(
    article.categories,
    options.createMissingCategories,
  );

  const slug = await uniqueSlug(
    article.slug || slugify(article.title, { lowercase: true }),
    article.externalId,
  );

  // Mirror every image referenced by either language once, then build the
  // Portable Text bodies from the same asset map.
  const allImageUrls = [
    ...extractImageUrls(primaryMarkdown),
    ...(zhMarkdown ? extractImageUrls(zhMarkdown) : []),
    ...(article.coverImageUrl ? [article.coverImageUrl] : []),
  ];
  const mirrored = await mirrorImages(allImageUrls);

  let coverAssetId: string | undefined;
  if (article.coverImageUrl) {
    coverAssetId = mirrored.map.get(article.coverImageUrl)?.assetId;
    if (!coverAssetId) {
      // Surface cover failures instead of silently publishing without one.
      const asset = await uploadRemoteImage(article.coverImageUrl);
      coverAssetId = asset._id;
    }
  } else {
    coverAssetId = mirrored.map.values().next().value?.assetId;
  }

  const body = markdownToPortableText(primaryMarkdown, mirrored.map);
  const bodyZh = zhMarkdown
    ? markdownToPortableText(zhMarkdown, mirrored.map)
    : undefined;

  const quality = evaluateArticle({
    article: {
      title: article.title,
      excerpt: article.excerpt,
      slug,
    },
    markdown: primaryMarkdown,
    markdownZh: zhMarkdown,
    keywords: options.keywords,
    hasCoverImage: !!coverAssetId,
  });

  const shouldPublish = quality.pass && options.autoPublish;
  const publishDate = shouldPublish
    ? article.publishDate
      ? new Date(article.publishDate).toISOString()
      : new Date().toISOString()
    : null;

  const document = {
    _type: "blogPost",
    title: article.title,
    ...(article.titleZh && { titleZh: article.titleZh }),
    slug: { _type: "slug", current: slug },
    excerpt: article.excerpt || undefined,
    ...(article.excerptZh && { excerptZh: article.excerptZh }),
    featured: article.featured ?? false,
    author: { _type: "reference", _ref: authorId },
    ...(categories.length > 0 && {
      categories: categories.map((category, index) => ({
        _type: "reference",
        _ref: category,
        _key: index.toString(),
      })),
    }),
    body: body as PortableTextBlock[],
    ...(bodyZh && { bodyZh: bodyZh as PortableTextBlock[] }),
    ...(coverAssetId && {
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: coverAssetId },
        alt: article.title,
      },
    }),
    publishDate,
    ...(article.lastReviewedAt && {
      lastReviewedAt: new Date(article.lastReviewedAt).toISOString(),
    }),
    ...(article.seoTitle && { seoTitle: article.seoTitle }),
    ...(article.seoDescription && {
      seoDescription: article.seoDescription,
    }),
    externalId: article.externalId || slug,
  };

  const existing = await sanityClient.fetch<{ _id: string } | null>(
    `*[_type == "blogPost" && (externalId == $externalId || slug.current == $slug)][0]{_id}`,
    { externalId: document.externalId, slug },
  );

  let id: string;
  let action: "created" | "updated";
  if (existing?._id) {
    id = existing._id;
    action = "updated";
    await sanityClient.patch(id).set(document).commit();
  } else {
    const created = await sanityClient.create(document);
    id = created._id;
    action = "created";
  }

  const status: "published" | "draft" = publishDate ? "published" : "draft";

  return {
    id,
    slug,
    status,
    quality,
    action,
    imageCount: allImageUrls.length,
    failedImages: mirrored.failed,
    path:
      status === "published"
        ? `/blog/${slug}`
        : `/studio/structure/blogPost;${id}`,
  };
}

async function resolveAuthorId(article: ArticleInput): Promise<string> {
  const authorId = article.authorId || process.env.BLOG_BOT_AUTHOR_ID;
  const authorEmail = article.authorEmail || process.env.BLOG_BOT_AUTHOR_EMAIL;

  if (authorId) {
    const found = await sanityClient.fetch<{ _id: string } | null>(
      `*[_type == "user" && _id == $id][0]{_id}`,
      { id: authorId },
    );
    if (found?._id) return found._id;
  }

  if (authorEmail) {
    const found = await sanityClient.fetch<{ _id: string } | null>(
      `*[_type == "user" && lower(email) == lower($email)][0]{_id}`,
      { email: authorEmail },
    );
    if (found?._id) return found._id;
  }

  const admin = await sanityClient.fetch<{ _id: string } | null>(
    `*[_type == "user" && role == "ADMIN"] | order(_createdAt asc)[0]{_id}`,
  );
  if (admin?._id) return admin._id;

  // Prefer any existing author profile over creating a duplicate persona.
  const anyUser = await sanityClient.fetch<{ _id: string } | null>(
    `*[_type == "user"] | order(_createdAt asc)[0]{_id}`,
  );
  if (anyUser?._id) return anyUser._id;

  // Zero-setup fallback: create an editorial author profile on first use so
  // the bot can publish on a fresh dataset. It has no password and cannot
  // log in; it only exists to own articles (E-E-A-T / Person JSON-LD).
  const name = process.env.BLOG_BOT_AUTHOR_NAME || "Editorial Team";
  const created = await sanityClient.create({
    _type: "user",
    name,
    ...(authorEmail && { email: authorEmail }),
    slug: {
      _type: "slug",
      current: slugify(name, { lowercase: true, separator: "-" }),
    },
    jobTitle: process.env.BLOG_BOT_AUTHOR_TITLE || "Editorial Team",
    bio:
      process.env.BLOG_BOT_AUTHOR_BIO ||
      `The ${name} researches, tests and compares the tools we recommend.`,
    role: "USER",
  });
  return created._id;
}

async function resolveCategories(
  input: ArticleInput["categories"],
  createMissing: boolean,
): Promise<string[]> {
  if (!input || input.length === 0) return [];

  const ids: string[] = [];
  for (const entry of input) {
    const name = typeof entry === "string" ? entry : entry.name;
    const nameZh = typeof entry === "string" ? undefined : entry.nameZh;
    const requestedSlug =
      typeof entry === "string" ? slugify(name) : entry.slug || slugify(name);

    const found = await sanityClient.fetch<{ _id: string } | null>(
      `*[_type == "blogCategory" && (slug.current == $slug || lower(name) == lower($name))][0]{_id}`,
      { slug: requestedSlug, name },
    );
    if (found?._id) {
      ids.push(found._id);
      continue;
    }
    if (!createMissing) continue;

    const slug = await uniqueCategorySlug(requestedSlug || "category");
    const created = await sanityClient.create({
      _type: "blogCategory",
      name,
      ...(nameZh && { nameZh }),
      slug: { _type: "slug", current: slug },
      priority: 0,
    });
    ids.push(created._id);
  }
  return [...new Set(ids)];
}

async function uniqueCategorySlug(base: string): Promise<string> {
  return uniqueSlugForType("blogCategory", base);
}

async function uniqueSlug(base: string, externalId?: string): Promise<string> {
  const normalized = toAsciiSlug(base);
  if (externalId) {
    const existing = await sanityClient.fetch<{ slug?: string } | null>(
      `*[_type == "blogPost" && externalId == $externalId][0]{"slug": slug.current}`,
      { externalId },
    );
    if (existing?.slug) return existing.slug;
  }
  return uniqueSlugForType("blogPost", normalized);
}

async function uniqueSlugForType(
  type: "blogPost" | "blogCategory",
  base: string,
): Promise<string> {
  const normalized = toAsciiSlug(base);
  let candidate = normalized;
  for (let suffix = 2; suffix < 100; suffix++) {
    const taken = await sanityClient.fetch<boolean>(
      "defined(*[_type == $type && slug.current == $slug][0]._id)",
      { type, slug: candidate },
    );
    if (!taken) return candidate;
    candidate = `${normalized}-${suffix}`;
  }
  return `${normalized}-${Date.now()}`;
}

function toAsciiSlug(value: string): string {
  const slug = slugify(value, { lowercase: true, separator: "-" })
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `post-${Date.now()}`;
}
