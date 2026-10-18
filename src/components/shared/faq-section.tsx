import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqConfig } from "@/config/faq";
import { siteConfig } from "@/config/site";
import { useTranslations } from "next-intl";

/**
 * Reusable FAQ accordion fed by src/config/faq.ts (localized message keys).
 * Answers may contain inline html; `{siteUrl}` is swapped for the site url.
 */
export function FaqSection({ title }: { title?: string }) {
  const t = useTranslations();
  return (
    <section className="w-full flex flex-col gap-6">
      {title && <h2 className="text-2xl font-bold text-center">{title}</h2>}
      <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto">
        {faqConfig.items.map((faqItem) => (
          <AccordionItem key={faqItem.id} value={faqItem.id}>
            <AccordionTrigger className="text-base">
              <div className="text-left w-full">{t(faqItem.question)}</div>
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground whitespace-pre-wrap">
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
    </section>
  );
}
