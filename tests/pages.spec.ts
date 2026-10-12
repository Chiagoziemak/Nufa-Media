import { test, expect } from "@playwright/test";
import defaults from "../content/defaults.json" with { type: "json" };

const cms = /https:\/\/2bndbdfg\.(api|apicdn)\.sanity\.io\/.*\/data\/query\//;
const legacySettings = {
  ...defaults.settings,
  ctaHref: "#contact",
  navigation: defaults.settings.navigation.map((link) => ({
    ...link,
    href: link.label === "Home" ? "#home" : `#${link.label.toLowerCase()}`,
  })),
};

test("legacy navigation opens real pages, survives reload, and returns home", async ({
  page,
}, testInfo) => {
  await page.route(cms, (route) =>
    route.fulfill({
      json: {
        result: { settings: legacySettings, page: null, home: defaults.page },
      },
    }),
  );
  await page.goto("/");
  for (const [label, slug, heading] of [
    ["About", "about", "We turn attentioninto impact."],
    ["Services", "services", "Built to get noticed."],
    ["Work", "work", "Work worth looking at twice."],
    ["Contact", "contact", "Got an idea?Let's make people notice."],
  ]) {
    const nav =
      testInfo.project.name === "mobile"
        ? page.getByRole("dialog", { name: "Navigation" })
        : page.getByRole("navigation", { name: "Main navigation" });
    if (testInfo.project.name === "mobile")
      await page.getByRole("button", { name: "Open menu" }).click();
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${slug}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page).toHaveTitle(`${label} — Nufa Media`);
    await expect(page.locator(".hero")).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  }
  await page.goBack();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Work worth looking at twice.",
  );
  await page
    .getByRole("link", { name: "NUFA MEDIA home", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Ideas ThatMove Brands.",
  );
});

test("separate pages initially preserve published Home copy and image choices", async ({
  page,
}) => {
  const home = structuredClone(defaults.page);
  const about = home.sections.find(
    (section) => section._type === "aboutBlock",
  )!;
  Object.assign(about, {
    headline: "Our edited story",
    highlight: "from Sanity",
    imagePosition: "left",
    image: {
      asset: { url: "/images/platform.svg" },
      alt: "Our colour image",
      colorMode: "colour",
    },
  });
  await page.route(cms, (route) =>
    route.fulfill({
      json: { result: { settings: defaults.settings, page: null, home } },
    }),
  );
  await page.goto("/about/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Our edited storyfrom Sanity",
  );
  await expect(page.getByRole("img", { name: "Our colour image" })).toHaveCSS(
    "filter",
    "none",
  );
  await expect(page.locator(".about-intro")).toHaveClass(/image-left/);
  await expect(
    page.locator(".services-section, .work-section, .hero"),
  ).toHaveCount(0);
});

test("an independently published page replaces Home blocks and respects empty content", async ({
  page,
}) => {
  const separatePage = {
    title: "About our team",
    seoTitle: "Meet our team — Nufa Media",
    sections: [
      {
        _key: "team",
        _type: "richTextBlock",
        headline: "Meet our team",
        description: "Our independent About page.",
      },
    ],
  };
  await page.route(cms, (route) =>
    route.fulfill({
      json: {
        result: {
          settings: defaults.settings,
          page: separatePage,
          home: defaults.page,
        },
      },
    }),
  );
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Meet our team",
  );
  await expect(page).toHaveTitle("Meet our team — Nufa Media");
  await expect(page.locator("main > section")).toHaveCount(1);
  separatePage.sections = [];
  await page.reload();
  await expect(page.locator("main > section")).toHaveCount(0);
  await expect(
    page.getByText("We turn attention", { exact: false }),
  ).toHaveCount(0);
});

test("calls to action use page URLs while deliberate section links stay usable", async ({
  page,
}) => {
  const home = structuredClone(defaults.page);
  Object.assign(home.sections[0], {
    primaryHref: "#contact",
    secondaryHref: "#work",
  });
  await page.route(cms, (route) =>
    route.fulfill({
      json: { result: { settings: legacySettings, page: home } },
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Start a conversation" }),
  ).toHaveAttribute("href", "/contact");
  await expect(
    page.getByRole("link", { name: "Explore work", exact: true }),
  ).toHaveAttribute("href", "/work");
  await expect(page.locator(".floating-contact")).toHaveAttribute(
    "href",
    "/contact",
  );
  await expect(
    page.getByRole("link", { name: "Our approach" }),
  ).toHaveAttribute("href", "#process");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toHaveAttribute("href", "#main");
  await page.getByRole("button", { name: /The Form of Void/ }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("link", { name: "Create something like this" }),
  ).toHaveAttribute("href", "/contact");
});

test("core page URLs retain a working page during a CMS outage", async ({
  page,
}) => {
  await page.route(cms, (route) =>
    route.fulfill({ status: 403, json: { error: "Unavailable" } }),
  );
  await page.goto("/contact");
  await expect(page.getByRole("status")).toContainText(
    "temporarily unavailable",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Got an idea?Let's make people notice.",
  );
  await expect(page.locator("#contact form")).toHaveCount(0);
});

test("a direct section link scrolls after the page's CMS blocks load", async ({
  page,
}) => {
  await page.route(cms, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      json: {
        result: {
          settings: defaults.settings,
          page: null,
          home: defaults.page,
        },
      },
    });
  });
  await page.goto("/about#process");
  await expect(
    page.getByRole("heading", { name: /Good work\.\s*Great chemistry\./ }),
  ).toBeInViewport();
  await expect
    .poll(async () =>
      page
        .locator("#process")
        .evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeLessThan(200);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
});
