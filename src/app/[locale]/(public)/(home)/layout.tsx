import Container from "@/components/container";
import HomeHero from "@/components/home/home-hero";
import { NewsletterCard } from "@/components/newsletter/newsletter-card";
import { FaqSection } from "@/components/shared/faq-section";
import type { SiteStatsQueryResult } from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import { siteStatsQuery } from "@/sanity/lib/queries";

export default async function HomeLayout({
  children,
}: { children: React.ReactNode }) {
  // site-wide stats shown as hero badges (0 is fine on an empty site)
  let stats: SiteStatsQueryResult = { toolCount: 0, categoryCount: 0 };
  try {
    stats =
      (await sanityFetch<SiteStatsQueryResult>({
        query: siteStatsQuery,
      })) || stats;
  } catch {
    // stats are cosmetic — never block the home page on them
  }

  return (
    <Container className="mt-12 mb-16 flex flex-col gap-16">
      <HomeHero stats={stats} />

      {children}

      <FaqSection />

      <NewsletterCard />
    </Container>
  );
}
