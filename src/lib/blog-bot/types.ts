import { z } from "zod";

export const categoryInputSchema = z.union([
  z.string().min(1).max(80),
  z.object({
    slug: z.string().min(1).max(96).optional(),
    name: z.string().min(1).max(80),
    nameZh: z.string().max(80).optional(),
  }),
]);

export const articleInputSchema = z.object({
  title: z.string().min(5).max(140),
  titleZh: z.string().min(2).max(140).optional(),
  slug: z.string().min(3).max(96).optional(),
  excerpt: z.string().max(500).optional(),
  excerptZh: z.string().max(500).optional(),
  /** English/primary markdown body */
  markdown: z.string().min(100).optional(),
  /** Chinese markdown body (optional fallback to `markdown`) */
  markdownZh: z.string().min(100).optional(),
  coverImageUrl: z.string().url().optional(),
  categories: z.array(categoryInputSchema).max(8).optional(),
  authorEmail: z.string().email().optional(),
  authorId: z.string().optional(),
  publishDate: z.string().datetime().optional(),
  lastReviewedAt: z.string().datetime().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(200).optional(),
  featured: z.boolean().optional(),
  externalId: z.string().min(3).max(200).optional(),
});

export const generateRequestSchema = z
  .object({
    mode: z.enum(["ingest", "generate"]).default("ingest"),
    /** Used in generate mode */
    topic: z.string().min(5).max(300).optional(),
    keywords: z.array(z.string().min(2).max(120)).max(12).optional(),
    /** Optional image URLs the bot wants inserted into generated content */
    imageUrls: z.array(z.string().url()).max(10).optional(),
    article: articleInputSchema.optional(),
    autoPublish: z.boolean().optional(),
    createMissingCategories: z.boolean().default(true),
    dryRun: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "ingest" && !value.article) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "`article` is required when mode is `ingest`",
        path: ["article"],
      });
    }
    if (value.mode === "generate" && !value.topic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "`topic` is required when mode is `generate`",
        path: ["topic"],
      });
    }
  });

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type ArticleInput = z.infer<typeof articleInputSchema>;

export const generatedArticleSchema = z.object({
  title: z.string().min(5).max(140),
  titleZh: z.string().min(2).max(140),
  slug: z.string().min(3).max(96),
  excerpt: z.string().min(20).max(500),
  excerptZh: z.string().min(10).max(500),
  markdown: z.string().min(500),
  markdownZh: z.string().min(300),
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(200),
  categories: z.array(z.string()).max(8),
  keywords: z.array(z.string()).max(12),
});

export type GeneratedArticle = z.infer<typeof generatedArticleSchema>;

export interface QualityIssue {
  code: string;
  message: string;
}

export interface QualityReport {
  pass: boolean;
  score: number;
  issues: QualityIssue[];
  warnings: QualityIssue[];
  metrics: {
    wordCount: number;
    headingCount: number;
    imageCount: number;
    linkCount: number;
    titleLength: number;
    excerptLength: number;
    keywordMatches: number;
  };
}
