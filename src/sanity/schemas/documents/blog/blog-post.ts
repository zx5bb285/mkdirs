import { format, parseISO } from "date-fns";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "blogPost",
  title: "Blog Posts",
  type: "document",
  // localized (zh-CN) fields fall back to the english field via GROQ coalesce
  fieldsets: [
    {
      name: "zh",
      title: "简体中文 (zh-CN)",
      options: { collapsible: true, collapsed: true },
    },
    {
      name: "seo",
      title: "SEO",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "externalId",
      title: "External ID",
      type: "string",
      description:
        "Optional idempotency key supplied by an automated publisher. Posts with the same external id are updated instead of duplicated.",
      readOnly: true,
      hidden: ({ document }) => !document?.externalId,
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "titleZh",
      title: "Title (简体中文)",
      type: "string",
      fieldset: "zh",
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "excerptZh",
      title: "Excerpt (简体中文)",
      type: "text",
      rows: 3,
      fieldset: "zh",
    }),

    defineField({
      name: "featured",
      title: "Mark as Featured",
      type: "boolean",
      initialValue: false,
      description: "Featured posts will be displayed on the home page",
    }),
    defineField({
      name: "categories",
      title: "Categories",
      description:
        "The categories that the post belongs to, may have multiple categories",
      type: "array",
      of: [{ type: "reference", to: { type: "blogCategory" } }],
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "user" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
      description:
        "Primary body. Use English for the /en version and Chinese for /zh-CN when a translation is provided below.",
    }),
    defineField({
      name: "bodyZh",
      title: "Body (简体中文)",
      type: "blockContent",
      fieldset: "zh",
      description:
        "Optional Chinese body. When empty, /zh-CN falls back to the primary body.",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
          description: "Important for SEO and accessiblity",
          initialValue: () => "Blog Post Image",
        },
      ],
    }),
    defineField({
      name: "relatedPosts",
      title: "Related Posts",
      description: "The posts that are related to this post",
      type: "array",
      of: [{ type: "reference", to: { type: "blogPost" } }],
    }),
    defineField({
      name: "publishDate",
      title: "Publish Date",
      description:
        "The post will be visible to the public only if the publish date is set. Future dates stay hidden until that moment.",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),

    // ---------------------------------------------------------------- SEO
    defineField({
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
      fieldset: "seo",
      description:
        "Optional title override for search engines. Keep it under 60 characters.",
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: "seoDescription",
      title: "SEO Description",
      type: "text",
      rows: 3,
      fieldset: "seo",
      description:
        "Optional meta description. Keep it between 120 and 160 characters.",
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
      fieldset: "seo",
      description:
        "Only set this when the article was originally published elsewhere (syndication).",
    }),
    defineField({
      name: "noIndex",
      title: "Hide from search engines",
      type: "boolean",
      fieldset: "seo",
      initialValue: false,
    }),
    defineField({
      name: "lastReviewedAt",
      title: "Last Reviewed",
      type: "datetime",
      fieldset: "seo",
      description:
        "When the facts, prices or recommendations were last verified. Shown to readers and emitted as dateModified.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      date: "publishDate",
    },
    prepare({ title, media, date }) {
      const subtitle = date
        ? format(parseISO(date), "yyyy/MM/dd")
        : "unpublished";
      return {
        title,
        media,
        subtitle,
      };
    },
  },
  orderings: [
    {
      title: "Date (Newest)",
      name: "dateDesc",
      by: [{ field: "publishDate", direction: "desc" }],
    },
    {
      title: "Date (Oldest)",
      name: "dateAsc",
      by: [{ field: "publishDate", direction: "asc" }],
    },
    {
      title: "Title (A-Z)",
      name: "title",
      by: [{ field: "title", direction: "asc" }],
    },
  ],
});
