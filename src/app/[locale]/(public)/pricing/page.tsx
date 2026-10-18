import Container from "@/components/container";
import { PricingPlans } from "@/components/dashboard/pricing-plans";
import { PricingFaq } from "@/components/pricing/pricing-faq";
import { HeaderSection } from "@/components/shared/header-section";
import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/metadata";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const locale = (await getLocale()) as "zh-CN" | "en";
  const t = await getTranslations({ locale, namespace: "Price" });
  return constructMetadata({
    title: t("title"),
    description: t("subtitle"),
    canonicalUrl: `${siteConfig.url}/pricing`,
    locale,
  });
}

export default async function PricingPage() {
  const t = await getTranslations();
  return (
    <Container className="mt-8 pb-16">
      <div className="w-full flex flex-col gap-16">
        <section className="w-full flex flex-col gap-8 justify-center">
          <HeaderSection
            labelAs="h1"
            label={t("Price.title")}
            titleAs="h2"
            title={t("Price.subtitle")}
          />

          <div className="w-full mx-auto">
            <PricingPlans />
          </div>

          {/* add tips only for Mkdirs demo directory website */}
          {siteConfig.name === "Directory" && (
            <p className="text-center text-sm text-muted-foreground leading-normal">
              This is in <span className="font-bold">TEST</span> environment.
              <br />
              You can use Stripe test card to simulate the paid submission
              process.
              <br />
              Stripe test card number: 4242 4242 4242 4242
            </p>
          )}
        </section>

        <section className="w-full flex flex-col gap-8 justify-center">
          <HeaderSection label="FAQ" titleAs="h2" title={t("Home.faqTitle")} />

          <div className="w-full max-w-4xl mx-auto">
            <PricingFaq />
          </div>
        </section>
      </div>
    </Container>
  );
}
