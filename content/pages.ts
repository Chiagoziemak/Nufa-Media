import defaults from "./defaults.json";
import definitions from "./pages.json";
import type { Page } from "../src/types";

export const corePages = definitions;

// Before a separate page is published, reuse the editor's current Home blocks.
// This also supplies initial content when a page is first created in Studio.
export function corePage(slug: string, home: Page = defaults.page as Page) {
  const definition = corePages.find((page) => page.slug === slug);
  if (!definition) return null;
  return {
    _id: `${slug}Page`,
    _type: "page" as const,
    title: definition.title,
    slug: { _type: "slug" as const, current: slug },
    seoTitle: `${definition.title} — Nufa Media`,
    seoDescription: definition.seoDescription,
    sections: definition.blocks.flatMap((type) =>
      (home.sections ?? []).filter((section) => section._type === type),
    ),
  };
}
