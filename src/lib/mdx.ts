import { localePath } from "@/i18n/routing";
import toMarkdown from "@sanity/block-content-to-markdown";
import { urlForImage } from "./image";

/**
 * 1. block-content-to-markdown
 * https://github.com/sanity-io/block-content-to-markdown
 *
 * 2. code example
 * https://github.com/skillrecordings/products/blob/dcfd9e9b339b178b297f1f0932ecc0e73e25fbaf/apps/epic-web/migrations/pt-to-md.ts#L84
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function portableTextToMarkdown(body: any, locale?: string) {
  const markdownContent = toMarkdown(body, {
    serializers: buildSerializers(locale),
  });
  return markdownContent;
}

const INTERNAL_LINK_PREFIX: Record<string, string> = {
  blogPost: "/blog",
  blogCategory: "/blog/category",
  item: "/item",
  page: "",
};

function buildSerializers(locale?: string) {
  return {
    types: {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      image: ({ node }: any) => {
        // don't use toMarkdown.getImageUrl, because it doesn't work
        const imageUrl = urlForImage(node);
        const alt = (node.alt || "").replace(/[\[\]]/g, "");
        // Empty alt keeps decorative CMS images accessible without
        // inventing meaningless alternative text.
        return `![${alt}](${imageUrl.src})`;
      },
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      code: ({ node }: any) => {
        // From @sanity/code-input
        return `\`\`\`${node.language || ""}\n${node.code}\n\`\`\``;
      },
      // GFM table. Portable Text has no native table primitive, so tables are
      // stored as a custom object and re-emitted as Markdown for rendering.
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      table: ({ node }: any) => {
        const rows = (node.rows || []) as Array<{ cells?: string[] }>;
        if (rows.length === 0) return "";
        const cell = (value?: string) =>
          (value || "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
        const header = (rows[0].cells || []).map(cell);
        if (header.length === 0) return "";
        const lines = [
          `| ${header.join(" | ")} |`,
          `| ${header.map(() => "---").join(" | ")} |`,
          ...rows
            .slice(1)
            .map((row) => `| ${(row.cells || []).map(cell).join(" | ")} |`),
        ];
        return `\n\n${lines.join("\n")}\n\n`;
      },
    },
    marks: {
      // The default `link` serializer is kept; this adds the custom
      // `internalLink` annotation that the Studio schema exposes.
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      internalLink: ({ children, mark }: any) => {
        const slug = mark?.slug?.current;
        if (!slug) return children;
        const prefix = INTERNAL_LINK_PREFIX[mark.type] ?? "";
        return `[${children}](${localePath(locale ?? "", `${prefix}/${slug}`)})`;
      },
    },
  };
}
