import { defineConfig, type Template } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";
import { starterTool } from "./StarterContent";
import { corePages, corePage } from "../content/pages";
import type { Page } from "../src/types";
export function studioConfig(
  projectId: string,
  dataset: string,
  basePath = "/",
) {
  return defineConfig({
    name: "nufa-media",
    title: "Nufa Media",
    projectId,
    dataset,
    basePath,
    schema: {
      types: schemaTypes,
      templates: (previous) => [
        ...previous,
        {
          id: "core-page",
          title: "Website page",
          schemaType: "page",
          parameters: [{ name: "slug", title: "URL slug", type: "string" }],
          value: async (params, context) => {
            const home = await context
              .getClient({ apiVersion: "2026-01-01" })
              .fetch<Page | null>('*[_type == "page" && _id == "homePage"][0]');
            const initial = corePage(params?.slug ?? "", home ?? undefined);
            if (!initial) return {};
            const { _id, _type, ...fields } = initial;
            return fields;
          },
        } satisfies Template<{ slug: string }, Record<string, unknown>>,
      ],
    },
    plugins: [
      structureTool({
        title: "Content",
        structure: (S) =>
          S.list()
            .title("Nufa Media")
            .items([
              S.listItem()
                .title("Site settings")
                .id("siteSettings")
                .child(
                  S.document()
                    .schemaType("siteSettings")
                    .documentId("siteSettings"),
                ),
              S.listItem()
                .title("Home")
                .id("homePage")
                .child(S.document().schemaType("page").documentId("homePage")),
              ...corePages.map((page) =>
                S.listItem()
                  .title(page.title)
                  .id(`${page.slug}Page`)
                  .child(
                    S.document()
                      .schemaType("page")
                      .documentId(`${page.slug}Page`)
                      .initialValueTemplate("core-page", { slug: page.slug }),
                  ),
              ),
              S.documentTypeListItem("page").title("All pages"),
            ]),
      }),
    ],
    tools: (existing) => [...existing, starterTool],
    document: {
      newDocumentOptions: (previous) =>
        previous.filter(
          (option) =>
            !["siteSettings", "core-page"].includes(option.templateId),
        ),
    },
  });
}
