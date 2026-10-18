import { format, parseISO } from "date-fns";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "tag",
  title: "Tag",
  type: "document",
  // localized (zh-CN) fields fall back to the english field via GROQ coalesce
  fieldsets: [
    {
      name: "zh",
      title: "简体中文 (zh-CN)",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "nameZh",
      title: "Name (简体中文)",
      type: "string",
      fieldset: "zh",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "descriptionZh",
      title: "Description (简体中文)",
      type: "text",
      rows: 3,
      fieldset: "zh",
    }),
  ],
  preview: {
    select: {
      title: "name",
      date: "_createdAt",
    },
    prepare({ title, date }) {
      const subtitle = format(parseISO(date), "yyyy/MM/dd");
      return {
        title,
        subtitle,
      };
    },
  },
  orderings: [
    {
      title: "name",
      name: "name",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
});
