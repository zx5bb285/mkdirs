import { BlogCategoryFilter } from "@/components/blog/blog-category-filter";
import Container from "@/components/container";
import { NewsletterCard } from "@/components/newsletter/newsletter-card";

export default async function BlogListLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="mb-16">
      <div className="mt-8 w-full flex flex-col items-center justify-center gap-8">
        <BlogCategoryFilter />
      </div>

      <Container className="mt-8">{children}</Container>

      <Container className="mt-8">
        <NewsletterCard />
      </Container>
    </div>
  );
}
