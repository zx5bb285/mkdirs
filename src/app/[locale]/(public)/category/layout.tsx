import { CategoryFilter } from "@/components/category/category-filter";
import Container from "@/components/container";

/**
 * Each page renders its own heading: the index uses the generic "Category"
 * title, while /category/[slug] uses the category name as the h1. Keeping the
 * heading out of the layout avoids two h1s on detail pages.
 */
export default function CategoryLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="mb-16">
      <div className="mt-8 w-full">
        <CategoryFilter />
      </div>

      <Container className="mt-4">{children}</Container>
    </div>
  );
}
