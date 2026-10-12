import { createClient } from "@sanity/client";
import defaults from "../content/defaults.json";
import type { SiteContent } from "./types";
import { corePage } from "../content/pages";

export const fallbackContent = defaults as SiteContent;
export function fallbackForPage(slug: string): SiteContent | null {
  const page = slug === "home" ? fallbackContent.page : corePage(slug);
  return page ? { settings: fallbackContent.settings, page } : null;
}
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
const pageProjection = `{
  ...,
  sections[]{..., image{..., asset->{url}}, items[]{..., image{..., asset->{url}}}}
}`;
const query = `{
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0],
  "page": *[_type == "page" && (($slug == "home" && _id == "homePage") || ($slug != "home" && slug.current == $slug))][0]${pageProjection},
  "home": *[_type == "page" && _id == "homePage" && $slug != "home"][0]${pageProjection}
}`;
export async function getContent(slug = "home"): Promise<SiteContent | null> {
  if (!client) return fallbackForPage(slug);
  const content = await client.fetch<
    Partial<SiteContent> & { home?: SiteContent["page"] }
  >(query, { slug });
  const page =
    content.page ??
    (slug === "home"
      ? fallbackContent.page
      : corePage(slug, content.home ?? fallbackContent.page));
  if (!page) return null;
  // Only use fallbacks for documents that haven't been published yet. An empty
  // section array is intentional and must not be replaced with demo content.
  return {
    settings: content.settings
      ? { ...fallbackContent.settings, ...content.settings }
      : fallbackContent.settings,
    page: { ...page, sections: page.sections ?? [] },
  };
}
// Previously imported settings can still contain the original menu anchors.
// Resolve those destinations to pages without changing other custom links.
export function pageUrl(value: string | undefined): string | undefined {
  const url = safeUrl(value);
  if (url === "#home") return "/";
  if (url && ["#about", "#services", "#work", "#contact"].includes(url))
    return `/${url.slice(1)}`;
  return url;
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
