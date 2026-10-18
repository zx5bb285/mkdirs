import { BannerAd } from "@/components/layout/banner-ad";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/shared/command-palette";
import { marketingConfig } from "@/config/marketing";
import type { CategoryListQueryResult } from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import { categoryListQuery } from "@/sanity/lib/queries";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  // top categories for the ⌘K command palette
  let categories: CategoryListQueryResult = [];
  try {
    categories =
      (await sanityFetch<CategoryListQueryResult>({
        query: categoryListQuery,
      })) || [];
  } catch {
    // palette still works without categories
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* <div className="sticky top-0 z-50">
        <BannerAd />
        <Navbar scroll={true} config={marketingConfig} />
      </div> */}
      <Navbar scroll={true} config={marketingConfig} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CommandPalette
        categories={categories.map((category) => ({
          id: category._id,
          name: category.name,
          slug: category.slug.current,
        }))}
      />
    </div>
  );
}
