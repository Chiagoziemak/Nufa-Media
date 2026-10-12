import { createClient } from "@sanity/client";
import defaults from "../content/defaults.json";
import type { SiteContent } from "./types";

export const fallbackContent = defaults as SiteContent;
const projectId = (import.meta.env.VITE_SANITY_PROJECT_ID || "2bndbdfg").trim();
const dataset = import.meta.env.VITE_SANITY_DATASET?.trim() || "production";
export const cmsConfigured = Boolean(projectId);
const client = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2026-01-01",
      useCdn: true,
      requestTagPrefix: "nufa.website",
      timeout: 5000,
      maxRetries: 1,
    })
  : null;
// Images are dereferenced in every block/item so editors can replace the built-in artwork.
const query = `{
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0],
  "page": *[_type == "page" && (($slug == "home" && _id == "homePage") || ($slug != "home" && slug.current == $slug))][0]{
    ...,
    sections[]{..., image{..., asset->{url}}, items[]{..., image{..., asset->{url}}}}
  }
}`;
export async function getContent(slug = "home"): Promise<SiteContent | null> {
  if (!client) return slug === "home" ? fallbackContent : null;
  const content = await client.fetch<Partial<SiteContent>>(query, { slug });
  if (!content.page && slug !== "home") return null;
  // Only use fallbacks for documents that haven't been published yet. An empty
  // section array is intentional and must not be replaced with demo content.
  return {
    settings: content.settings
      ? { ...fallbackContent.settings, ...content.settings }
      : fallbackContent.settings,
    page: content.page
      ? { ...content.page, sections: content.page.sections ?? [] }
      : fallbackContent.page,
  };
}
export function safeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (
    /^#[A-Za-z][\w-]*$/.test(value) ||
    /^\/(?![\/\\])[\w./#?=&%+-]*$/.test(value)
  )
    return value;
  try {
    const u = new URL(value);
    return ["https:", "http:", "mailto:", "tel:"].includes(u.protocol)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}
