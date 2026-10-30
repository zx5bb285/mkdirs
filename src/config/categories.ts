/**
 * Fallback category descriptions.
 *
 * The CMS categories were seeded without descriptions, which left empty
 * subtitles and very short meta descriptions. Editors can override any entry
 * in Sanity; these are used only when `category.description` is blank.
 */
export const categoryDescriptions: Record<string, string> = {
  "api-proxy":
    "Compare AI API and proxy services for building, routing and scaling model access, including pricing, rate limits and developer support.",
  "ai-detection":
    "Explore AI detection tools that identify machine-generated text, images and audio, with reviews, accuracy considerations and alternatives.",
  "image-design":
    "Compare AI image and design tools for generating art, editing photos, removing backgrounds and creating on-brand visuals for web and social.",
  video:
    "Explore AI video tools for text-to-video generation, editing, lip sync and repurposing content, with reviews, pricing and alternatives.",
  "voice-audio":
    "Compare AI voice and audio tools for text-to-speech, voice cloning, dubbing and music generation, with pricing, free plans and alternatives.",
  productivity:
    "Find AI productivity tools that automate notes, meetings, scheduling and everyday workflows, with reviews and practical comparisons.",
  "writing-text":
    "Compare AI writing tools for grammar checks, paraphrasing, long-form drafting and brand voice, with reviews, pricing and free alternatives.",
  "coding-development":
    "Explore AI coding assistants and developer tools for completion, code review, debugging and app generation, with pricing and alternatives.",
  "life-assistant":
    "Discover AI assistants for everyday planning, learning, health, travel and personal tasks, with reviews and free alternatives.",
  "marketing-advertising":
    "Compare AI marketing tools for copywriting, SEO, social media, ads and campaign analytics, with reviews, pricing and alternatives.",
  "education-learning":
    "Explore AI education tools for tutoring, study notes, language learning and course creation, with reviews and free alternatives.",
  "business-finance":
    "Compare AI business and finance tools for accounting, forecasting, customer support and operations, with pricing and alternatives.",
};

export function getCategoryDescription(
  slug: string,
  description?: string | null,
): string | undefined {
  const trimmed = description?.trim();
  return trimmed || categoryDescriptions[slug];
}
