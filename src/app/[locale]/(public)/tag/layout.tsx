import Container from "@/components/container";
import { TagFilter } from "@/components/tag/tag-filter";

/**
 * Headings live in the pages, not the layout, so /tag/[slug] can use the tag
 * name as its only h1.
 */
export default function TagLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-16">
      <div className="mt-8 w-full">
        <TagFilter />
      </div>

      <Container className="mt-4">{children}</Container>
    </div>
  );
}
