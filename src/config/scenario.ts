// "Find tools by scenario" section on the home page.
// Each entry renders a top-N ranked list of items in the given category.
// NOTE: categorySlug must match an existing category slug in Sanity CMS,
// sections whose category is missing (or has no items) are skipped at render.
export type ScenarioItem = {
  key: string;
  categorySlug: string;
  titleKey: string;
  count?: number;
};

export const scenarioList: ScenarioItem[] = [
  {
    key: "aiChat",
    categorySlug: "ai-chat",
    titleKey: "Scenarios.aiChat",
    count: 6,
  },
  {
    key: "imageGen",
    categorySlug: "ai-image-generators",
    titleKey: "Scenarios.imageGen",
    count: 6,
  },
  {
    key: "writing",
    categorySlug: "ai-writing",
    titleKey: "Scenarios.writing",
    count: 6,
  },
  {
    key: "video",
    categorySlug: "ai-video",
    titleKey: "Scenarios.video",
    count: 6,
  },
  {
    key: "coding",
    categorySlug: "ai-coding",
    titleKey: "Scenarios.coding",
    count: 6,
  },
  {
    key: "productivity",
    categorySlug: "productivity",
    titleKey: "Scenarios.productivity",
    count: 6,
  },
  {
    key: "audio",
    categorySlug: "ai-audio",
    titleKey: "Scenarios.audio",
    count: 6,
  },
  {
    key: "search",
    categorySlug: "ai-search",
    titleKey: "Scenarios.search",
    count: 6,
  },
];
