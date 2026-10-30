import type { ItemMetadataBySlugQueryResult } from "@/sanity.types";

const BRAND_SUFFIX_LENGTH = " - DirHunt AI".length;
const MAX_BASE_TITLE_LENGTH = 60 - BRAND_SUFFIX_LENGTH;
const MIN_DESCRIPTION_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 158;

type ItemSeoInput = Pick<
  NonNullable<ItemMetadataBySlugQueryResult>,
  "name" | "description" | "seoTitle" | "seoDescription"
>;

/**
 * Build a search-intent title without the brand suffix.
 *
 * `constructMetadata` appends " - DirHunt AI", so keeping the base title at
 * 47 characters or less keeps the final title near 60 characters.
 */
export function buildItemTitle(item: ItemSeoInput): string {
  const name = item.name?.trim() || "AI Tool";
  const override = item.seoTitle?.trim();
  if (override) return override;

  const year = new Date().getFullYear();
  const detailed = `${name} Review ${year}: Features, Pricing & Alternatives`;
  if (detailed.length <= MAX_BASE_TITLE_LENGTH) return detailed;

  return `${name} Review ${year}`;
}

/**
 * Build a meta description long enough to carry search intent.
 *
 * Existing directory descriptions are often 68-85 characters. When the editor
 * has not supplied a manual description, expand a short one with a factual
 * sentence about what the page covers.
 */
export function buildItemDescription(item: ItemSeoInput): string {
  const name = item.name?.trim() || "this AI tool";
  const year = new Date().getFullYear();
  const base =
    item.seoDescription?.trim() ||
    item.description?.trim() ||
    `${name} is an AI tool listed on DirHunt AI.`;

  if (base.length >= MIN_DESCRIPTION_LENGTH) {
    return truncateAtWord(base, MAX_DESCRIPTION_LENGTH);
  }

  const ending = /[.!?]$/.test(base) ? "" : ".";
  const suffix = ` Compare features, pricing, free plan and alternatives for ${name} in ${year}.`;
  return truncateAtWord(`${base}${ending}${suffix}`, MAX_DESCRIPTION_LENGTH);
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const clipped = value.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(
    clipped.lastIndexOf(". "),
    clipped.lastIndexOf("! "),
    clipped.lastIndexOf("? "),
  );
  if (sentenceEnd >= MIN_DESCRIPTION_LENGTH) {
    return clipped.slice(0, sentenceEnd + 1).trim();
  }

  const lastSpace = clipped.lastIndexOf(" ");
  const boundary = lastSpace > 0 ? lastSpace : maxLength;
  return clipped
    .slice(0, boundary)
    .trim()
    .replace(/[,;:\s]+$/, "");
}
