import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqConfig } from "@/config/faq";
import { siteConfig } from "@/config/site";
import { getTranslations } from "next-intl/server";

export async function PricingFaq() {
  const t = await getTranslations();
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqConfig.items.map((faqItem) => (
        <AccordionItem key={faqItem.id} value={faqItem.id}>
          <AccordionTrigger className="text-base">
            <div className="text-left w-full">{t(faqItem.question)}</div>
          </AccordionTrigger>
          <AccordionContent className="text-base text-muted-foreground whitespace-pre-wrap">
            {/* answer may contain inline html (e.g. the backlink anchor);
                the {siteUrl} placeholder is swapped for the configured url */}
            <div
              // biome-ignore lint/security/noDangerouslySetInnerHtml: faq answers contain localized inline html from our own message files
              dangerouslySetInnerHTML={{
                // t.raw returns the raw message string without icu rich-text
                // parsing, so inline html tags (<a>, <br/>) stay intact
                __html: String(t.raw(faqItem.answer)).replaceAll(
                  "{siteUrl}",
                  siteConfig.url || "",
                ),
              }}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
