import { randomUUID } from "node:crypto";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

/**
 * Minimal, dependency-light Markdown → Sanity Portable Text converter.
 *
 * Supported: headings, paragraphs, bullet/numbered lists, blockquotes,
 * fenced code, images (must be uploaded first), links, bold, italic,
 * strikethrough, inline code, hard breaks and GFM tables.
 * Tables become readable text rows because the Studio schema has no table
 * primitive.
 */

interface UploadedImage {
  assetId: string;
  alt?: string;
}

export type ImageAssetMap = Map<string, UploadedImage>;

interface Span {
  _type: "span";
  _key: string;
  text: string;
  marks?: string[];
}

interface MarkDef {
  _key: string;
  _type: string;
  href?: string;
}

interface Block {
  _type: "block";
  _key: string;
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  markDefs: MarkDef[];
  children: Span[];
}

interface ImageBlock {
  _type: "image";
  _key: string;
  asset: { _type: "reference"; _ref: string };
  alt?: string;
}

interface CodeBlock {
  _type: "code";
  _key: string;
  language?: string;
  code: string;
}

interface TableBlock {
  _type: "table";
  _key: string;
  rows: Array<{ _key: string; cells: string[] }>;
}

export type PortableTextBlock = Block | ImageBlock | CodeBlock | TableBlock;

export function markdownToPortableText(
  markdown: string,
  images: ImageAssetMap = new Map(),
): PortableTextBlock[] {
  const tree = remark().use(remarkGfm).parse(markdown) as unknown as {
    children?: Array<Record<string, unknown>>;
  };
  const blocks: PortableTextBlock[] = [];
  const nodes = (tree.children ?? []) as unknown as MdNode[];
  for (const node of nodes) {
    blocks.push(...convertNode(node, images));
  }
  return blocks;
}

interface MdNode {
  type: string;
  children?: MdNode[];
  // biome-ignore lint/suspicious/noExplicitAny: mdast nodes are untyped here
  [key: string]: any;
}

function convertNode(node: MdNode, images: ImageAssetMap): PortableTextBlock[] {
  switch (node.type) {
    case "heading":
      return [textBlock(node, `h${Math.min(Math.max(node.depth ?? 2, 1), 6)}`)];
    case "paragraph": {
      const blocks: PortableTextBlock[] = [];
      const imagesOnly = filterImages(node.children ?? []);
      if (imagesOnly.length > 0) {
        for (const image of imagesOnly) {
          const block = imageBlock(image, images);
          if (block) blocks.push(block);
        }
        const textChildren = (node.children ?? []).filter(
          (child: MdNode) => child.type !== "image",
        );
        if (textChildren.some((child: MdNode) => visibleText(child).trim())) {
          blocks.push(textBlock({ ...node, children: textChildren }, "normal"));
        }
        return blocks;
      }
      return [textBlock(node, "normal")];
    }
    case "blockquote": {
      const children = (node.children ?? []) as MdNode[];
      return children.flatMap((child) =>
        child.type === "paragraph" ? [textBlock(child, "blockquote")] : [],
      );
    }
    case "list":
      return convertList(node, images);
    case "code":
      return [
        {
          _type: "code",
          _key: randomUUID(),
          language: node.lang || undefined,
          code: node.value || "",
        },
      ];
    case "image": {
      const block = imageBlock(node, images);
      return block ? [block] : [fallbackImageParagraph(node)];
    }
    case "table":
      return convertTable(node);
    case "thematicBreak":
      return [];
    case "html":
      return [
        {
          ...textBlock(
            {
              children: [{ type: "text", value: stripHtml(node.value || "") }],
            },
            "normal",
          ),
        },
      ];
    default:
      return [];
  }
}

function convertList(node: MdNode, images: ImageAssetMap): PortableTextBlock[] {
  const ordered = !!node.ordered;
  const result: PortableTextBlock[] = [];

  const walk = (listNode: MdNode, level: number) => {
    for (const item of (listNode.children ?? []) as MdNode[]) {
      if (item.type !== "listItem") continue;
      const itemChildren = (item.children ?? []) as MdNode[];
      const paragraph = itemChildren.find(
        (child) => child.type === "paragraph",
      );
      if (paragraph) {
        result.push({
          ...textBlock(paragraph, "normal"),
          listItem: ordered ? "number" : "bullet",
          level,
        });
      }
      for (const child of itemChildren) {
        if (child.type === "list") {
          walk(child, level + 1);
        }
      }
    }
  };

  walk(node, 1);
  return result;
}

function convertTable(node: MdNode): PortableTextBlock[] {
  const rows = (node.children ?? []) as MdNode[];
  const tableRows: TableBlock["rows"] = [];
  for (const row of rows) {
    const cells = ((row.children ?? []) as MdNode[]).map((cell) =>
      inlineText(cell.children ?? []).trim(),
    );
    if (cells.every((cell) => !cell)) continue;
    tableRows.push({ _key: randomUUID(), cells });
  }
  if (tableRows.length === 0) return [];
  return [{ _type: "table", _key: randomUUID(), rows: tableRows }];
}

function textBlock(node: { children?: MdNode[] }, style: string): Block {
  const { children, markDefs } = convertInline(node.children ?? []);
  return {
    _type: "block",
    _key: randomUUID(),
    style,
    markDefs,
    children:
      children.length > 0
        ? children
        : [{ _type: "span", _key: randomUUID(), text: "" }],
  };
}

function convertInline(nodes: MdNode[]): {
  children: Span[];
  markDefs: MarkDef[];
} {
  const children: Span[] = [];
  const markDefs: MarkDef[] = [];

  const push = (text: string, marks: string[] = []) => {
    if (!text) return;
    children.push({
      _type: "span",
      _key: randomUUID(),
      text,
      ...(marks.length > 0 ? { marks } : {}),
    });
  };

  const walk = (list: MdNode[], marks: string[]) => {
    for (const node of list) {
      switch (node.type) {
        case "text":
          push(node.value || "", marks);
          break;
        case "strong":
          walk(node.children ?? [], [...marks, "strong"]);
          break;
        case "emphasis":
          walk(node.children ?? [], [...marks, "em"]);
          break;
        case "delete":
          walk(node.children ?? [], [...marks, "strike-through"]);
          break;
        case "inlineCode":
          push(node.value || "", [...marks, "code"]);
          break;
        case "break":
          push("\n", marks);
          break;
        case "link": {
          const key = randomUUID();
          markDefs.push({ _key: key, _type: "link", href: node.url });
          walk(node.children ?? [], [...marks, key]);
          break;
        }
        case "image": {
          const alt = node.alt || "image";
          push(`[${alt}](${node.url})`, marks);
          break;
        }
        case "html":
          push(stripHtml(node.value || ""), marks);
          break;
        default:
          if (node.children) walk(node.children, marks);
          break;
      }
    }
  };

  walk(nodes, []);
  return { children, markDefs };
}

function inlineText(nodes: MdNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text" || node.type === "inlineCode") {
        return node.value || "";
      }
      if (node.type === "image") return node.alt || "";
      if (node.children) return inlineText(node.children);
      return "";
    })
    .join("");
}

function imageBlock(node: MdNode, images: ImageAssetMap): ImageBlock | null {
  const url = node.url || "";
  const uploaded = images.get(url);
  if (!uploaded) return null;
  return {
    _type: "image",
    _key: randomUUID(),
    asset: { _type: "reference", _ref: uploaded.assetId },
    alt: uploaded.alt || node.alt || undefined,
  };
}

function fallbackImageParagraph(node: MdNode): Block {
  return textBlock(
    {
      children: [
        {
          type: "text",
          value: `[${node.alt || "image"}](${node.url || ""})`,
        },
      ],
    },
    "normal",
  );
}

function filterImages(nodes: MdNode[]): MdNode[] {
  return nodes.filter((node) => node.type === "image");
}

function visibleText(node: MdNode): string {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value || "";
  }
  if (node.children) return inlineText(node.children);
  return "";
}

export function extractImageUrls(markdown: string): string[] {
  const urls = new Set<string>();
  const regex = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
  for (const match of markdown.matchAll(regex)) {
    if (match[1]) urls.add(match[1]);
  }
  return [...urls];
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
}
