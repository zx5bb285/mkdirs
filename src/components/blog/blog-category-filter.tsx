import Container from "@/components/container";
import type { BlogCategoryListQueryResult } from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import { blogCategoryListQuery } from "@/sanity/lib/queries";
import { getLocale } from "next-intl/server";
import { BlogCategoryListDesktop } from "./blog-category-list-desktop";
import { BlogCategoryListMobile } from "./blog-category-list-mobile";

export async function BlogCategoryFilter() {
  const locale = await getLocale();
  const categoryList = await sanityFetch<BlogCategoryListQueryResult>({
    query: blogCategoryListQuery,
    params: { locale },
  });

  return (
    <section className="w-full">
      {/* Desktop View, has Container */}
      <Container className="hidden md:block">
        <BlogCategoryListDesktop categoryList={categoryList} />
      </Container>

      {/* Mobile View, no Container */}
      <div className="block md:hidden w-full">
        <BlogCategoryListMobile categoryList={categoryList} />
      </div>
    </section>
  );
}
