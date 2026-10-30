import { PricePlans } from "@/lib/submission";
import { format, parseISO } from "date-fns";
import type { SanityImageAssetDocument } from "next-sanity";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "item",
  title: "Item",
  type: "document",
  groups: [
    {
      name: "content",
      title: "Content",
      default: true,
    },
    {
      name: "review",
      title: "Review",
    },
    {
      name: "pricing",
      title: "Pricing",
    },
    {
      name: "seo",
      title: "SEO",
    },
    {
      name: "status",
      title: "Status",
    },
    {
      name: "sponsor",
      title: "Sponsor",
    },
  ],
  // localized (zh-CN) fields are grouped into a collapsible fieldset;
  // GROQ queries fall back to the english field via coalesce(nameZh, name)
  fieldsets: [
    {
      name: "zh",
      title: "简体中文 (zh-CN)",
      description:
        "Optional Chinese translations, english fields are used as fallback",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "nameZh",
      title: "Name (简体中文)",
      type: "string",
      group: "content",
      fieldset: "zh",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: {
        source: "name",
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "featured",
      title: "Mark as Featured",
      type: "boolean",
      group: "content",
      initialValue: false,
      description:
        "If the item is featured, it will be displayed in the featured section",
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "string",
      group: "content",
      description: "The link shown on the website",
    }),
    defineField({
      name: "affiliateLink",
      title: "Affiliate Link",
      type: "string",
      group: "content",
      description:
        "The affiliate link, not shown on the website, leave it blank if you don't have one",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      group: "content",
      rows: 3,
    }),
    defineField({
      name: "descriptionZh",
      title: "Description (简体中文)",
      type: "text",
      group: "content",
      rows: 3,
      fieldset: "zh",
    }),
    defineField({
      name: "collections",
      title: "Collections",
      description: "The collections of the item, may have multiple collections",
      type: "array",
      group: "content",
      of: [
        {
          type: "reference",
          to: [{ type: "collection" }],
        },
      ],
    }),
    defineField({
      name: "categories",
      title: "Categories",
      description: "The categories of the item, may have multiple categories",
      type: "array",
      group: "content",
      of: [
        {
          type: "reference",
          to: [{ type: "category" }],
        },
      ],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      description: "The tags of the item, may have multiple tags",
      type: "array",
      group: "content",
      of: [
        {
          type: "reference",
          to: [{ type: "tag" }],
        },
      ],
    }),
    defineField({
      name: "submitter",
      title: "Submitter",
      type: "reference",
      group: "content",
      to: [{ type: "user" }],
      // do not require submitter, because the item maybe submitted by admin
      // validation: (rule) => rule.required(),
    }),
    defineField({
      name: "introduction",
      title: "Introduction",
      description: "The introduction of the item, in markdown format",
      type: "markdown",
      group: "content",
      // https://github.com/sanity-io/sanity-plugin-markdown?tab=readme-ov-file#custom-image-urls
      // The function will be invoked whenever an image is pasted
      // or dragged into the markdown editor, after upload completes.
      options: {
        imageUrl: (imageAsset: SanityImageAssetDocument) => {
          return `${imageAsset.url}?w=400&h=400`;
        },
      },
    }),
    defineField({
      name: "introductionZh",
      title: "Introduction (简体中文)",
      description: "The chinese introduction of the item, in markdown format",
      type: "markdown",
      group: "content",
      fieldset: "zh",
      options: {
        imageUrl: (imageAsset: SanityImageAssetDocument) => {
          return `${imageAsset.url}?w=400&h=400`;
        },
      },
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "image",
      group: "content",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
          description: "Important for SEO and accessiblity",
          initialValue: (_, parent) => {
            return `Icon for ${parent?.name || "item"}`;
          },
        },
      ],
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      group: "content",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
          description: "Important for SEO and accessiblity",
          initialValue: (_, parent) => {
            return `Image for ${parent?.name || "item"}`;
          },
        },
      ],
    }),
    // ---------------------------------------------------------------------
    // Review content (optional; legacy items can stay as they are)
    defineField({
      name: "verdict",
      title: "Verdict",
      description:
        "Answer-first editorial verdict, 40-70 words. Shown near the top of the item page.",
      type: "text",
      rows: 4,
      group: "review",
    }),
    defineField({
      name: "bestFor",
      title: "Best for",
      description:
        "One line describing the reader this tool suits, e.g. 'Best for teams that write in English every day'.",
      type: "string",
      group: "review",
      validation: (rule) =>
        rule.max(120).warning("Keep this to one short line."),
    }),
    defineField({
      name: "pros",
      title: "Pros",
      type: "array",
      group: "review",
      of: [{ type: "string" }],
      validation: (rule) => rule.max(8),
    }),
    defineField({
      name: "cons",
      title: "Cons",
      type: "array",
      group: "review",
      of: [{ type: "string" }],
      validation: (rule) => rule.max(8),
    }),
    defineField({
      name: "keyFeatures",
      title: "Key features",
      description:
        "Four to six short feature blocks. Each one is rendered as a numbered card.",
      type: "array",
      group: "review",
      of: [
        {
          type: "object",
          name: "keyFeature",
          title: "Key feature",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 2,
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "description" },
          },
        },
      ],
      validation: (rule) => rule.max(8),
    }),
    defineField({
      name: "faqs",
      title: "FAQs",
      description:
        "Four to six questions readers actually ask. Rendered in an accordion and as FAQPage structured data.",
      type: "array",
      group: "review",
      of: [
        {
          type: "object",
          name: "faq",
          title: "FAQ",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "answer",
              title: "Answer",
              type: "text",
              rows: 4,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: "question", subtitle: "answer" },
          },
        },
      ],
      validation: (rule) => rule.max(8),
    }),
    defineField({
      name: "alternatives",
      title: "Alternatives",
      description:
        "Up to five alternatives. Prefer an internal item reference; use name + URL for tools not yet in the directory.",
      type: "array",
      group: "review",
      of: [
        {
          type: "object",
          name: "alternative",
          title: "Alternative",
          fields: [
            defineField({
              name: "item",
              title: "Directory item",
              description: "Optional internal reference.",
              type: "reference",
              to: [{ type: "item" }],
            }),
            defineField({
              name: "name",
              title: "Name",
              description: "Required for external alternatives.",
              type: "string",
            }),
            defineField({
              name: "url",
              title: "URL",
              description: "Optional external link.",
              type: "url",
            }),
            defineField({
              name: "note",
              title: "Why it is an alternative",
              type: "string",
            }),
          ],
          preview: {
            select: {
              name: "name",
              itemName: "item.name",
              url: "url",
              media: "item.icon",
            },
            prepare({ name, itemName, url, media }) {
              return {
                title: name || itemName || "Alternative",
                subtitle: url,
                media,
              };
            },
          },
        },
      ],
      validation: (rule) =>
        rule.max(5).custom((rows) => {
          if (!Array.isArray(rows)) return true;
          const alternatives = rows as Array<{
            item?: unknown;
            name?: unknown;
          }>;
          const invalid = alternatives.findIndex(
            (row) => !row?.item && !row?.name,
          );
          return invalid === -1
            ? true
            : `Alternative #${invalid + 1} needs a directory item or a name.`;
        }),
    }),
    defineField({
      name: "sources",
      title: "Sources",
      description:
        "Official pages used to verify the facts on this page (product page, pricing page, docs).",
      type: "array",
      group: "review",
      of: [
        {
          type: "object",
          name: "source",
          title: "Source",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "url" },
          },
        },
      ],
      validation: (rule) => rule.max(8),
    }),
    defineField({
      name: "lastVerified",
      title: "Last verified",
      description:
        "The date the facts and prices on this page were last checked against the official sources.",
      type: "date",
      group: "review",
      options: { dateFormat: "YYYY-MM-DD" },
    }),
    defineField({
      name: "reviewer",
      title: "Reviewer",
      description: "Editor or editorial team responsible for this review.",
      type: "reference",
      group: "review",
      to: [{ type: "user" }],
    }),

    // ---------------------------------------------------------------------
    // Pricing (optional; only publish verified numbers)
    defineField({
      name: "pricingSummary",
      title: "Pricing summary",
      description:
        "Short explanation of the plan structure, free-tier limits, and billing caveats.",
      type: "text",
      rows: 3,
      group: "pricing",
    }),
    defineField({
      name: "pricingRows",
      title: "Pricing rows",
      description:
        "Structured rows for the public pricing table. Use display strings such as '$12/mo'.",
      type: "array",
      group: "pricing",
      of: [
        {
          type: "object",
          name: "pricingRow",
          title: "Pricing row",
          fields: [
            defineField({
              name: "plan",
              title: "Plan",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "price",
              title: "Price",
              type: "string",
              description: "Display string, e.g. '$12/mo' or 'Free'.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "billing",
              title: "Billing",
              description: "e.g. 'Billed annually' or 'Per seat / month'.",
              type: "string",
            }),
            defineField({
              name: "includes",
              title: "What's included",
              type: "text",
              rows: 2,
            }),
            defineField({
              name: "note",
              title: "Note",
              type: "string",
            }),
          ],
          preview: {
            select: { title: "plan", subtitle: "price" },
          },
        },
      ],
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: "hasFreePlan",
      title: "Has a free plan",
      description:
        "Only enable this after verifying the free tier on the official pricing page.",
      type: "boolean",
      group: "pricing",
    }),
    defineField({
      name: "startingPrice",
      title: "Starting price",
      description:
        "Lowest PAID monthly price, in the selected currency. Do not enter 0 for a free tier; leave empty instead.",
      type: "number",
      group: "pricing",
      validation: (rule) =>
        rule.min(0).warning("Pricing must be zero or positive."),
    }),
    defineField({
      name: "priceCurrency",
      title: "Currency",
      type: "string",
      group: "pricing",
      initialValue: "USD",
      options: {
        list: ["USD", "EUR", "GBP", "CAD", "AUD"],
        layout: "dropdown",
      },
    }),
    defineField({
      name: "pricingUrl",
      title: "Official pricing URL",
      type: "url",
      group: "pricing",
    }),

    // ---------------------------------------------------------------------
    // SEO overrides (optional)
    defineField({
      name: "seoTitle",
      title: "SEO title",
      description:
        "Optional title WITHOUT the ' - DirHunt AI' suffix. Keep it under 47 characters so the full title stays near 60.",
      type: "string",
      group: "seo",
      validation: (rule) =>
        rule.max(47).warning("Long titles are truncated in search results."),
    }),
    defineField({
      name: "seoDescription",
      title: "SEO description",
      description:
        "Optional meta description. Aim for 140-155 characters and include the search intent.",
      type: "text",
      rows: 3,
      group: "seo",
      validation: (rule) =>
        rule
          .max(160)
          .warning("Descriptions over 160 characters are truncated."),
    }),

    // publish related fields
    defineField({
      name: "publishDate",
      title: "Publish Date",
      description: "*Required if you want to show the item in the directory",
      type: "datetime",
      group: "status",
      // hidden: ({ parent }) => !parent.published,
    }),
    // price plan related fields
    defineField({
      name: "pricePlan",
      title: "Price Plan",
      description: "The price plan of the item, chosen by the submitter",
      type: "string",
      group: "status",
      initialValue: "free",
      options: {
        list: ["free", "pro", "sponsor"],
        layout: "radio",
        direction: "horizontal",
      },
      readOnly: true,
    }),
    defineField({
      name: "freePlanStatus",
      title: "Free Plan Status",
      description: "The status of the item when the item is in free plan",
      type: "string",
      group: "status",
      initialValue: "submitting",
      options: {
        list: [
          { title: "Submitting", value: "submitting" },
          { title: "Pending (Waiting for review)", value: "pending" },
          { title: "Approved", value: "approved" },
          { title: "Rejected", value: "rejected" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      hidden: ({ parent }) => parent.pricePlan !== "free",
    }),
    defineField({
      name: "proPlanStatus",
      title: "Pro Plan Status",
      description: "The status of the item when the item is in pro plan",
      type: "string",
      group: "status",
      initialValue: "submitting",
      options: {
        list: [
          { title: "Submitting", value: "submitting" },
          { title: "Pending (Waiting for payment)", value: "pending" },
          { title: "Success", value: "success" },
          { title: "Failed", value: "failed" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      hidden: ({ parent }) => parent.pricePlan !== "pro",
    }),
    defineField({
      name: "rejectionReason",
      title: "Rejection Reason",
      description: "The reason for rejecting the item",
      type: "string",
      group: "status",
      hidden: ({ parent }) => parent.freePlanStatus !== "rejected",
      initialValue: "Other reasons",
      options: {
        list: [
          "The item is not good fit for our directory",
          "The image of the item is not in good quality",
          "The icon of the item is not in good quality",
          "The information of the item is not clear",
          "The backlink to our site is not provided",
          "Other reasons",
        ],
        layout: "dropdown",
      },
    }),
    // sponsor related fields
    defineField({
      name: "sponsorPlanStatus",
      title: "Sponsor Plan Status",
      description: "The status of the item when the item is in sponsor plan",
      type: "string",
      group: ["status", "sponsor"],
      initialValue: "submitting",
      options: {
        list: [
          { title: "Submitting", value: "submitting" },
          { title: "Pending (Waiting for payment)", value: "pending" },
          { title: "Success", value: "success" },
          { title: "Failed", value: "failed" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      hidden: ({ parent }) => parent.pricePlan !== "sponsor",
    }),
    // payment related fields
    defineField({
      name: "paid",
      title: "Paid",
      description: "If the item is paid, it means the payment is successful",
      type: "boolean",
      group: "status",
      initialValue: false,
      readOnly: true,
    }),
    defineField({
      name: "order",
      title: "Order",
      description: "The successful payment order of the submission",
      type: "reference",
      group: "status",
      to: [{ type: "order" }],
      hidden: ({ parent }) => !parent.paid,
      // readOnly: true,
    }),
    defineField({
      name: "forceHidden",
      title: "Force Hidden",
      description:
        "If the item is force hidden, it will not be displayed regardless of the status. It's helpful when you want to hide an item temporarily.",
      type: "boolean",
      group: "status",
      initialValue: false,
    }),
    // sponsor related fields
    defineField({
      name: "sponsor",
      title: "Sponsor",
      description: "(Deprecated) Website owner can mark the item as sponsor",
      type: "boolean",
      group: "sponsor",
      initialValue: false,
    }),
    defineField({
      name: "sponsorStartDate",
      title: "Sponsor Start Date",
      description: "The start date of the sponsor",
      type: "datetime",
      group: "sponsor",
      hidden: ({ parent }) => !parent.sponsor,
    }),
    defineField({
      name: "sponsorEndDate",
      title: "Sponsor End Date",
      description: "The end date of the sponsor",
      type: "datetime",
      group: "sponsor",
      hidden: ({ parent }) => !parent.sponsor,
    }),
    defineField({
      name: "note",
      title: "Note",
      description: "Take a note for the item, not visible to the public",
      type: "string",
      group: "sponsor",
    }),
  ],
  // https://www.sanity.io/docs/previews-list-views
  // Configure and customize how documents are displayed
  // within Sanity Studio's document lists.
  preview: {
    select: {
      // Studio previews the draft and published snapshots separately and
      // prefers the draft. A draft snapshot keeps the `drafts.` prefix on
      // `_id`, so it is a reliable published/unpublished marker; `publishDate`
      // is not, because a draft inherits it from the published document.
      id: "_id",
      name: "name",
      icon: "icon",
      image: "image",
      featured: "featured",
      date: "publishDate",
      forceHidden: "forceHidden",
      pricePlan: "pricePlan",
      freePlanStatus: "freePlanStatus",
      proPlanStatus: "proPlanStatus",
      sponsorPlanStatus: "sponsorPlanStatus",
    },
    prepare({
      id,
      name,
      icon,
      image,
      featured,
      date,
      forceHidden,
      pricePlan,
      freePlanStatus,
      proPlanStatus,
      sponsorPlanStatus,
    }) {
      const error =
        freePlanStatus === "rejected" ||
        proPlanStatus === "failed" ||
        sponsorPlanStatus === "failed";
      const isDraft = typeof id === "string" && id.startsWith("drafts.");
      // ✅ published, 📝 draft / unpublished changes, ❌ rejected or failed
      // and still unpublished.
      const marker = isDraft ? (error ? "❌" : "📝") : "✅";
      const title = `${marker} ${name || "Untitled"}`;
      const feature = featured ? "⭐" : "";
      // Drafts can be half-filled while an editor is typing, so never assume
      // `pricePlan` is present: a thrown preview would break the whole list.
      const plan = typeof pricePlan === "string" ? pricePlan.toUpperCase() : "";
      const status =
        plan === PricePlans.FREE.toUpperCase()
          ? freePlanStatus
          : plan === PricePlans.PRO.toUpperCase()
            ? proPlanStatus
            : sponsorPlanStatus;
      const state = isDraft
        ? forceHidden === true
          ? "draft, hidden"
          : "draft"
        : forceHidden === true
          ? "published, hidden"
          : "published";
      const time =
        isDraft || !date
          ? state
          : `${state}, date: ${format(parseISO(date), "yyyy/MM/dd")}`;
      const subtitle = `${feature}${plan || "no plan"}: ${status || "unknown"}, ${time}`;
      const media = icon ?? image;
      return {
        title,
        media,
        subtitle,
      };
    },
  },
  orderings: [
    {
      title: "Publish Date (Newest)",
      name: "dateDesc",
      by: [{ field: "publishDate", direction: "desc" }],
    },
    {
      title: "Publish Date (Oldest)",
      name: "dateAsc",
      by: [{ field: "publishDate", direction: "asc" }],
    },
    {
      title: "Name (A-Z)",
      name: "name",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
});
