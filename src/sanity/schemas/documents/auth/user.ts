import { format, parseISO } from "date-fns";
import { defineField } from "sanity";

const user = {
  name: "user",
  title: "User",
  type: "document",
  groups: [
    {
      name: "stripe",
      title: "Stripe",
    },
  ],
  fields: [
    defineField({
      name: "name",
      title: "User Name",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "User Email",
      type: "string",
    }),
    defineField({
      name: "emailVerified",
      title: "Email Verification",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "image",
      title: "User Image",
      type: "string",
    }),
    defineField({
      name: "link",
      title: "User Link",
      type: "string",
    }),
    // ------------------------------------------------- author / E-E-A-T
    defineField({
      name: "slug",
      title: "Author Slug",
      type: "slug",
      description:
        "Used for the public author page, e.g. /blog/author/jane-doe",
      options: { source: "name", maxLength: 96 },
    }),
    defineField({
      name: "jobTitle",
      title: "Job Title",
      type: "string",
      description: "e.g. Senior Editor, Video Production Specialist",
    }),
    defineField({
      name: "bio",
      title: "Author Bio",
      type: "text",
      rows: 4,
      description:
        "Short biography shown below articles and on the author page. Credentials and experience build E-E-A-T.",
    }),
    defineField({
      name: "expertise",
      title: "Areas of Expertise",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "twitter",
      title: "X / Twitter",
      type: "url",
    }),
    defineField({
      name: "linkedin",
      title: "LinkedIn",
      type: "url",
    }),
    defineField({
      name: "website",
      title: "Personal Website",
      type: "url",
    }),
    defineField({
      name: "password",
      title: "User Password",
      type: "string",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      initialValue: "USER",
      options: {
        list: ["ADMIN", "USER"],
      },
    }),
    defineField({
      name: "accounts",
      title: "Accounts",
      type: "reference",
      to: [{ type: "account" }],
    }),
    // stripe
    defineField({
      name: "stripeCustomerId",
      title: "Stripe Customer Id",
      type: "string",
      group: "stripe",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      id: "_id",
      name: "name",
      date: "_createdAt",
    },
    prepare({ id, name, date }) {
      const title = name;
      // get simple user id by concating the first 4 and last 4 characters
      const userid = `${id.substring(5, 9)}...${id.substring(id.length - 4)}`;
      const subtitle = `${format(parseISO(date), "yyyy/MM/dd")}-${userid}`;
      return {
        title,
        subtitle,
      };
    },
  },
};

export default user;
