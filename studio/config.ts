import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";
import { starterTool } from "./StarterContent";
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
    schema: { types: schemaTypes },
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
              S.documentTypeListItem("page").title("All pages"),
            ]),
      }),
    ],
    tools: (existing) => [...existing, starterTool],
    document: {
      newDocumentOptions: (previous) =>
        previous.filter((option) => option.templateId !== "siteSettings"),
    },
  });
}
