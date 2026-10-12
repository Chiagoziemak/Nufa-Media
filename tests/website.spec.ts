import { test, expect, type Page } from "@playwright/test";
import defaults from "../content/defaults.json" with { type: "json" };
const cms = /https:\/\/2bndbdfg\.(api|apicdn)\.sanity\.io\/.*\/data\/query\//;
async function mockCms(
  page: Page,
  settings: unknown = null,
  content: unknown = null,
) {
  await page.route(cms, (route) =>
    route.fulfill({
      json: { result: { settings, page: content } },
      headers: { "access-control-allow-origin": "*" },
    }),
  );
}
async function brief(page: Page) {
  await page.getByLabel("Your name").fill("Ada Example");
  await page.getByLabel("Email address").fill("ada@example.com");
  await page
    .getByLabel("What can we help with?")
    .selectOption("Digital Product");
  await page
    .getByLabel("A little about your project")
    .fill("We would like a website and a new visual identity.");
  await page.getByRole("button", { name: "Prepare project brief" }).click();
}
test("unseeded public dataset renders the working starter website", async ({
  page,
}) => {
  await mockCms(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Ideas ThatMove Brands.",
  );
  await expect(page).toHaveTitle("Nufa Media — Ideas That Move Brands");
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Advertising", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toHaveAttribute("href", "#main");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
});
test("all bundled artwork loads, and the website does not download Studio", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (r) => requested.push(r.url()));
  await mockCms(page);
  await page.goto("/");
  for (const img of await page.locator("main img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveJSProperty("complete", true);
    await expect(img).not.toHaveJSProperty("naturalWidth", 0);
  }
  expect(requested.some((url) => /StudioPage.*\.js/.test(url))).toBe(false);
});
test("project dialog has keyboard dismissal and restores focus", async ({
  page,
}) => {
  await mockCms(page);
  await page.goto("/");
  const project = page.getByRole("button", { name: /The Form of Void/ });
  await project.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "The Form of Void" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("studio concept");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(project).toBeFocused();
});
test("FAQ opens and closes accessibly", async ({ page }) => {
  await mockCms(page);
  await page.goto("/");
  const faq = page.locator("details").first();
  await faq.locator("summary").click();
  await expect(faq).toHaveAttribute("open", "");
  await expect(faq.locator("p")).toBeVisible();
  await faq.locator("summary").click();
  await expect(faq).not.toHaveAttribute("open", "");
});
test("missing contact coordinates produce a downloadable brief without claiming delivery", async ({
  page,
}) => {
  await mockCms(page);
  await page.goto("/");
  await brief(page);
  await expect(
    page.getByRole("heading", { name: "Your brief is ready." }),
  ).toBeVisible();
  await expect(
    page.getByText("Our contact channel is being finalised.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open email draft" }),
  ).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download brief" }).click();
  expect((await download).suggestedFilename()).toBe("nufa-project-brief.txt");
  await page.getByRole("button", { name: "Edit your brief" }).click();
  await expect(page.getByLabel("Your name")).toHaveValue("Ada Example");
});
test("published settings populate email, WhatsApp, and telephone with the brief", async ({
  page,
}) => {
  await mockCms(
    page,
    {
      ...defaults.settings,
      contactEmail: "hello@example.com",
      whatsappNumber: "2348012345678",
      phoneNumber: "+2348012345678",
      phoneLabel: "Call the studio",
    },
    defaults.page,
  );
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Call the studio" }),
  ).toHaveAttribute("href", "tel:+2348012345678");
  await brief(page);
  const email = await page
    .getByRole("link", { name: "Open email draft" })
    .getAttribute("href");
  expect(email).toContain("mailto:hello@example.com?");
  expect(decodeURIComponent(email!)).toContain("Ada Example");
  const whatsapp = await page
    .getByRole("link", { name: "Open WhatsApp" })
    .getAttribute("href");
  expect(whatsapp).toContain("https://wa.me/2348012345678?text=");
  expect(decodeURIComponent(whatsapp!)).toContain("new visual identity");
  await expect(
    page.getByText("Nothing has been sent yet.", { exact: false }),
  ).toBeVisible();
});
test("published blocks replace fallbacks, render in order, and support rich text", async ({
  page,
}) => {
  await mockCms(
    page,
    { ...defaults.settings, brandName: "NUFA EDITED" },
    {
      ...defaults.page,
      seoTitle: "A title from Sanity",
      sections: [
        {
          _key: "first",
          _type: "richTextBlock",
          anchor: "story",
          headline: "A new content block",
          body: [
            {
              _key: "p",
              _type: "block",
              style: "normal",
              markDefs: [],
              children: [
                {
                  _key: "c",
                  _type: "span",
                  text: "Published text from the CMS.",
                  marks: [],
                },
              ],
            },
          ],
        },
        {
          _key: "second",
          _type: "heroBlock",
          headline: "Reordered",
          highlight: "from Sanity",
          eyebrow: "Published content",
        },
      ],
    },
  );
  await page.goto("/");
  await expect(page).toHaveTitle("A title from Sanity");
  await expect(page.getByText("Published text from the CMS.")).toBeVisible();
  await expect(page.locator("main > section").first()).toHaveAttribute(
    "id",
    "story",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Reorderedfrom Sanity",
  );
  await expect(
    page.getByRole("heading", { name: "Advertising", exact: true }),
  ).toHaveCount(0);
});
test("CMS image blocks and image replacements render with alt text", async ({
  page,
}) => {
  await mockCms(page, defaults.settings, {
    ...defaults.page,
    sections: [
      {
        _key: "image",
        _type: "imageBlock",
        headline: "A new image block",
        image: {
          asset: { url: "/images/void.svg" },
          alt: "Published editorial study",
        },
        caption: "A caption from Sanity",
      },
    ],
  });
  await page.goto("/");
  await expect(
    page.getByRole("img", { name: "Published editorial study" }),
  ).toBeVisible();
  await expect(page.locator("figcaption")).toHaveText("A caption from Sanity");
});
test("intentionally empty published pages remain empty", async ({ page }) => {
  await mockCms(page, defaults.settings, { ...defaults.page, sections: [] });
  await page.goto("/");
  await expect(page.locator("main > section")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
});
test("custom pages query their slug, and missing pages show a useful result", async ({
  page,
}) => {
  let query = "";
  await page.route(cms, (route) => {
    query = new URL(route.request().url()).searchParams.get("$slug") || "";
    return route.fulfill({
      json: { result: { settings: defaults.settings, page: null } },
    });
  });
  await page.goto("/unpublished-page");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  expect(query).toBe('"unpublished-page"');
  await expect(
    page.getByRole("link", { name: "Back to home" }),
  ).toHaveAttribute("href", "/");
});
test("CMS failure retains useful content and explains its fallback", async ({
  page,
}) => {
  await page.route(cms, (route) =>
    route.fulfill({ status: 403, json: { error: "Unavailable" } }),
  );
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText(
    "temporarily unavailable",
  );
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
test("unsafe CMS navigation destinations are not rendered", async ({
  page,
}) => {
  await mockCms(
    page,
    {
      ...defaults.settings,
      navigation: [
        {
          _key: "bad",
          label: "Unsafe navigation",
          href: "javascript:alert(1)",
        },
        { _key: "ok", label: "Safe navigation", href: "#services" },
      ],
    },
    defaults.page,
  );
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Unsafe navigation" }),
  ).toHaveCount(0);
});
test("mobile menu closes on navigation and Escape", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation only");
  await mockCms(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Services", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page).toHaveURL(/#services$/);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});
