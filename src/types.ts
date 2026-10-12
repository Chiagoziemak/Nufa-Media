import type { PortableTextBlock } from "@portabletext/react";
export type ImageColorMode = "colour" | "blackAndWhite";
export type ImagePosition = "left" | "right" | "below" | "fullWidth";
export interface ImageValue {
  asset?: { url?: string };
  alt?: string;
  colorMode?: ImageColorMode;
}
export interface Item {
  _key: string;
  title?: string;
  description?: string;
  tags?: string[];
  icon?: string;
  category?: string;
  label?: string;
  artwork?: string;
  summary?: string;
  image?: ImageValue;
  question?: string;
  answer?: string;
}
export interface Section {
  _key: string;
  _type: string;
  anchor?: string;
  eyebrow?: string;
  headline?: string;
  highlight?: string;
  description?: string;
  imagePosition?: ImagePosition;
  primaryHref?: string;
  secondaryHref?: string;
  buttonHref?: string;
  whatsappLabel?: string;
  phoneButtonLabel?: string;
  emailLabel?: string;
  whatsappMessage?: string;
  emailSubject?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  artTitle?: string;
  artHighlight?: string;
  artCaption?: string;
  note?: string;
  items?: Item[];
  quote?: string;
  values?: Item[];
  steps?: Item[];
  buttonLabel?: string;
  labels?: string[];
  body?: PortableTextBlock[];
  image?: ImageValue;
  caption?: string;
}
export interface Settings {
  brandName: string;
  brandDescriptor?: string;
  navigation: { _key: string; label: string; href: string }[];
  ctaLabel: string;
  ctaHref?: string;
  footerTagline: string;
  footerNote: string;
  contactEmail: string;
  whatsappNumber: string;
  phoneNumber?: string;
  phoneLabel?: string;
  officeAddress?: string;
  officeHours?: string;
  responseNote?: string;
  socialLinks: { _key: string; label: string; href: string }[];
}
export interface Page {
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  sections: Section[];
}
export interface SiteContent {
  settings: Settings;
  page: Page;
}
