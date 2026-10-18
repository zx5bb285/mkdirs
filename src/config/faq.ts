import type { FAQConfig } from "@/types";

// question/answer values are message keys ("Faq.item1.question" etc.),
// resolved with next-intl. answers may contain inline HTML (rendered with
// dangerouslySetInnerHTML by PricingFaq/FaqSection)
export const faqConfig: FAQConfig = {
  items: [
    {
      id: "item-1",
      question: "Faq.item1.question",
      answer: "Faq.item1.answer",
    },
    {
      id: "item-2",
      question: "Faq.item2.question",
      answer: "Faq.item2.answer",
    },
    {
      id: "item-3",
      question: "Faq.item3.question",
      answer: "Faq.item3.answer",
    },
    {
      id: "item-4",
      question: "Faq.item4.question",
      answer: "Faq.item4.answer",
    },
  ],
};
