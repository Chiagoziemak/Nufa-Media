import { defineType, defineField, type FieldDefinition } from "sanity";
import defaults from "../../content/defaults.json";
const text = (name: string, title: string, required = false): FieldDefinition =>
  defineField({
    name,
    title,
    type: "string",
    validation: required ? (r) => r.required() : undefined,
  });
const paragraph = (name: string, title: string): FieldDefinition =>
  defineField({ name, title, type: "text", rows: 3 });
const image = (name = "image", title = "Image"): FieldDefinition =>
  defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alternative text",
        type: "string",
        description: "Describe the image for screen readers.",
        validation: (r) => r.required(),
      }),
    ],
  });
const anchor = defineField({
  name: "anchor",
  title: "Section link / anchor",
  type: "string",
  description:
    "Used by navigation, e.g. services links to #services. Must be unique on the page.",
  validation: (r) =>
    r.regex(/^[a-z][a-z0-9-]*$/, {
      name: "lowercase letters, numbers, and hyphens",
    }),
});
const headings = [
  anchor,
  text("eyebrow", "Small label"),
  text("headline", "Heading", true),
  text("highlight", "Second line"),
  paragraph("description", "Description"),
];
const itemArray = (
  name: string,
  title: string,
  fields: FieldDefinition[],
): FieldDefinition =>
  defineField({
    name,
    title,
    type: "array",
    of: [
      {
        type: "object",
        fields,
        preview: {
          select: { title: "title", subtitle: "category", media: "image" },
        },
      },
    ],
  });
const linkFields = [
  text("label", "Label", true),
  defineField({
    name: "href",
    title: "Destination",
    type: "string",
    description: "A section anchor (#contact) or a full https:// URL.",
    validation: (r) =>
      r.required().custom((v) => {
        if (!v) return true;
        if (/^#[a-z][\w-]*$/.test(v) || /^\/(?![\/\\])[\w./#?=&%+-]*$/.test(v))
          return true;
        try {
          return ["https:", "http:", "mailto:", "tel:"].includes(
            new URL(v).protocol,
          )
            ? true
            : "Use https, http, mailto, tel, or an anchor.";
        } catch {
          return "Enter a full URL or a section anchor.";
        }
      }),
  }),
];
const preview = {
  select: { title: "headline" },
  prepare: ({ title }: { title?: string }) => ({
    title: title || "Content block",
  }),
};
const block = (
  name: string,
  title: string,
  fields: FieldDefinition[],
  extra: Record<string, unknown> = {},
) => defineType({ name, title, type: "object", fields, preview, ...extra });
const {
  _key: _heroKey,
  _type: _heroType,
  ...heroInitial
} = defaults.page.sections[0];
const heroBlock = block(
  "heroBlock",
  "Hero",
  [
    ...headings,
    text("primaryLabel", "Primary button label"),
    text("secondaryLabel", "Explore button label"),
    text("artCaption", "Artwork caption"),
    text("primaryHref", "Primary button destination"),
    text("secondaryHref", "Explore button destination"),
    image("image", "Hero background image"),
  ],
  { initialValue: heroInitial },
);
const servicesBlock = block("servicesBlock", "Services", [
  ...headings,
  text("note", "Image caption"),
  image("image", "Supporting image"),
  itemArray("items", "Services", [
    text("title", "Service name", true),
    paragraph("description", "Description"),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      options: {
        list: [
          { title: "Spark", value: "spark" },
          { title: "Website", value: "web" },
          { title: "Camera", value: "camera" },
          { title: "Growth", value: "growth" },
        ],
      },
    }),
  ]),
]);
const workBlock = block("workBlock", "Work / projects", [
  ...headings,
  itemArray("items", "Projects", [
    text("title", "Project title", true),
    text("category", "Category"),
    text("label", "Project label (e.g. Studio concept)"),
    paragraph("summary", "Project description"),
    image(),
    defineField({
      name: "artwork",
      title: "Fallback artwork",
      type: "string",
      options: {
        list: [
          { title: "The Form of Void", value: "bloom" },
          { title: "Concrete Words", value: "orbit" },
          { title: "Platform Zero", value: "form" },
        ],
      },
      initialValue: "bloom",
    }),
  ]),
]);
const aboutBlock = block("aboutBlock", "About / philosophy", [
  ...headings,
  text("buttonLabel", "Approach button label"),
  text("buttonHref", "Approach button destination"),
  paragraph("quote", "Studio statement"),
  image("image", "Supporting image"),
  itemArray("values", "Values", [
    text("title", "Title", true),
    paragraph("description", "Description"),
  ]),
]);
const processBlock = block("processBlock", "Process", [
  ...headings,
  itemArray("steps", "Steps", [
    text("title", "Title", true),
    paragraph("description", "Description"),
  ]),
]);
const faqBlock = block("faqBlock", "FAQ", [
  ...headings,
  defineField({
    name: "items",
    title: "Questions",
    type: "array",
    of: [
      {
        type: "object",
        fields: [
          text("question", "Question", true),
          paragraph("answer", "Answer"),
        ],
        preview: { select: { title: "question" } },
      },
    ],
  }),
]);
const contactBlock = block("contactBlock", "Contact / project brief", [
  ...headings,
  text("buttonLabel", "Form button"),
  defineField({
    name: "services",
    title: "Services in dropdown",
    type: "array",
    of: [{ type: "string" }],
  }),
  text("formNote", "Form supporting note"),
  defineField({
    name: "formLabels",
    title: "Form labels and placeholders",
    type: "object",
    fields: [
      "nameLabel",
      "namePlaceholder",
      "emailLabel",
      "emailPlaceholder",
      "serviceLabel",
      "servicePlaceholder",
      "messageLabel",
      "messagePlaceholder",
    ].map((name) => text(name, name.replace(/([A-Z])/g, " $1"))),
  }),
]);
const richTextBlock = block("richTextBlock", "Rich text", [
  ...headings,
  defineField({
    name: "body",
    title: "Content",
    type: "array",
    of: [
      {
        type: "block",
        styles: [
          { title: "Normal", value: "normal" },
          { title: "Heading 2", value: "h2" },
          { title: "Heading 3", value: "h3" },
          { title: "Quote", value: "blockquote" },
        ],
        marks: {
          decorators: [
            { title: "Bold", value: "strong" },
            { title: "Italic", value: "em" },
          ],
          annotations: [
            {
              name: "link",
              title: "Link",
              type: "object",
              fields: [
                defineField({
                  name: "href",
                  title: "URL",
                  type: "url",
                  validation: (r) =>
                    r.uri({ scheme: ["http", "https", "mailto", "tel"] }),
                }),
              ],
            },
          ],
        },
        lists: [
          { title: "Bullet", value: "bullet" },
          { title: "Number", value: "number" },
        ],
      },
    ],
  }),
]);
const imageBlock = block("imageBlock", "Image / banner", [
  anchor,
  text("headline", "Heading"),
  image(),
  text("caption", "Caption"),
]);
const tickerBlock = block("tickerBlock", "Text strip / partners", [
  anchor,
  text("eyebrow", "Small label"),
  text("note", "Supporting label"),
  defineField({
    name: "labels",
    title: "Names / words",
    description:
      "Use real client names only when their inclusion has been approved. Starter content lists capabilities.",
    type: "array",
    of: [{ type: "string" }],
  }),
]);
const sectionTypes = [
  heroBlock,
  servicesBlock,
  workBlock,
  aboutBlock,
  processBlock,
  faqBlock,
  contactBlock,
  richTextBlock,
  imageBlock,
  tickerBlock,
];
const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  initialValue: defaults.settings,
  fields: [
    text("brandName", "Brand name", true),
    text("brandDescriptor", "Brand descriptor"),
    itemArray("navigation", "Navigation links", linkFields),
    text("ctaLabel", "Header / contact button"),
    text("ctaHref", "Contact button destination"),
    text("briefReadyHeading", "Prepared brief heading"),
    paragraph("briefReadyDescription", "Prepared brief message"),
    paragraph("briefUnavailableDescription", "Contact not configured message"),
    paragraph("footerTagline", "Footer introduction"),
    text("footerNote", "Footer supporting text"),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      description:
        "Leave blank until the real address is available. No fake email is shown.",
      validation: (r) =>
        r.custom((v) =>
          !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
            ? true
            : "Enter a valid email address.",
        ),
    }),
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp number",
      type: "string",
      description: "Country code and digits only. Leave blank until confirmed.",
      validation: (r) =>
        r.custom((v) =>
          !v || /^[1-9]\d{6,14}$/.test(v)
            ? true
            : "Use 7–15 digits, starting with the country code.",
        ),
    }),
    defineField({
      name: "phoneNumber",
      title: "Telephone number",
      type: "string",
      description: "International format, e.g. +234…",
      validation: (r) =>
        r.custom((v) =>
          !v || /^\+?[1-9]\d{6,14}$/.test(v)
            ? true
            : "Use an international telephone number.",
        ),
    }),
    text("phoneLabel", "Telephone display label"),
    paragraph("officeAddress", "Office address"),
    text("officeHours", "Office hours"),
    text("responseNote", "Contact supporting text"),
    itemArray("socialLinks", "Social / footer links", linkFields),
  ],
});
const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    text("title", "Page title", true),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      description:
        "The home document uses home. Other pages render at /your-slug.",
      options: { source: "title" },
      validation: (r) =>
        r
          .required()
          .custom((v) =>
            !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.current || "")
              ? true
              : "Use lowercase letters, digits, and hyphens.",
          ),
    }),
    text("seoTitle", "Browser / search title"),
    paragraph("seoDescription", "Search description"),
    defineField({
      name: "sections",
      title: "Content blocks",
      description:
        "Add blocks with the + button. Drag to reorder. Publish to update the website.",
      type: "array",
      of: sectionTypes.map((t) => ({ type: t.name })),
      validation: (r) =>
        r.custom((value) => {
          const anchors = (value || [])
            .map((v: unknown) => (v as { anchor?: string }).anchor)
            .filter(Boolean);
          return new Set(anchors).size === anchors.length
            ? true
            : "Each section anchor must be unique.";
        }),
    }),
  ],
});
export const schemaTypes = [siteSettings, page, ...sectionTypes];
