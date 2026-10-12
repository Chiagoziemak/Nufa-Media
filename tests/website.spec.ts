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
test("contact matches the direct-link layout and leaves missing channels disabled", async ({
  page,
}) => {
  await mockCms(page);
  await page.goto("/");
  const contact = page.locator("#contact");
  await expect(contact.getByRole("heading")).toHaveText(
    "Got an idea?Let's make people notice.",
  );
  await expect(contact).toContainText(
    "Direct access to our senior strategy & creative partners.",
  );
  await expect(contact.locator("form, input, select, textarea")).toHaveCount(0);
  for (const name of ["WhatsApp us", "Call us", "Email"]) {
    await expect(
      contact.getByRole("button", { name, exact: true }),
    ).toBeVisible();
    await expect(
      contact.getByRole("button", { name, exact: true }),
    ).toBeDisabled();
  }
  await expect(contact.getByRole("link")).toHaveCount(0);
});
test("published contact details open WhatsApp, phone, and email directly", async ({
  page,
}) => {
  await mockCms(
    page,
    {
      ...defaults.settings,
      contactEmail: "hello@example.com",
      whatsappNumber: "2348012345678",
      phoneNumber: "+2348012345678",
      phoneLabel: "+234 (801) 234-5678",
    },
    defaults.page,
  );
  await page.goto("/");
  const contact = page.locator("#contact");
  const whatsapp = contact.getByRole("link", {
    name: "WhatsApp us",
    exact: true,
  });
  const url = new URL((await whatsapp.getAttribute("href"))!);
  expect(url.origin).toBe("https://wa.me");
  expect(url.pathname).toBe("/2348012345678");
  expect(url.searchParams.get("text")).toBe(
    "Hi NUFA MEDIA, I'm interested in discussing a campaign for my brand.",
  );
  await expect(whatsapp).toHaveAttribute("target", "_blank");
  await expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
  await expect(
    contact.getByRole("link", {
      name: "Call us (+234 (801) 234-5678)",
      exact: true,
    }),
  ).toHaveAttribute("href", "tel:+2348012345678");
  const email = contact.getByRole("link", { name: "Email", exact: true });
  const emailUrl = new URL((await email.getAttribute("href"))!);
  expect(emailUrl.protocol).toBe("mailto:");
  expect(emailUrl.pathname).toBe("hello@example.com");
  expect(emailUrl.searchParams.get("subject")).toBe(
    "Project inquiry — NUFA MEDIA",
  );
  await expect(contact.locator("form, input, select, textarea")).toHaveCount(0);
});
test("Sanity controls contact copy and button labels, including blocks with old form data", async ({
  page,
}) => {
  const oldContact = defaults.page.sections.find(
    (section) => section._type === "contactBlock",
  )!;
  await mockCms(
    page,
    {
      ...defaults.settings,
      contactEmail: "projects@example.com",
      whatsappNumber: "2348098765432",
      phoneNumber: "+2348098765432",
      phoneLabel: "Our studio",
    },
    {
      ...defaults.page,
      sections: [
        {
          ...oldContact,
          headline: "Have a campaign in mind?",
          highlight: "Let's talk.",
          description: "A direct connection to our creative team.",
          whatsappLabel: "Message our team",
          phoneButtonLabel: "Speak to us",
          emailLabel: "Write to us",
          whatsappMessage: "Let's discuss a new campaign & its launch.",
          emailSubject: "Campaign planning & creative",
          formLabels: { nameLabel: "Obsolete form field" },
          buttonLabel: "Obsolete submit button",
        },
      ],
    },
  );
  await page.goto("/");
  const contact = page.locator("#contact");
  await expect(contact.getByRole("heading")).toHaveText(
    "Have a campaign in mind?Let's talk.",
  );
  await expect(contact).toContainText(
    "A direct connection to our creative team.",
  );
  await expect(
    contact.getByRole("link", {
      name: "Speak to us (Our studio)",
      exact: true,
    }),
  ).toHaveAttribute("href", "tel:+2348098765432");
  const messageUrl = new URL(
    (await contact
      .getByRole("link", { name: "Message our team", exact: true })
      .getAttribute("href"))!,
  );
  expect(messageUrl.searchParams.get("text")).toBe(
    "Let's discuss a new campaign & its launch.",
  );
  const emailUrl = new URL(
    (await contact
      .getByRole("link", { name: "Write to us", exact: true })
      .getAttribute("href"))!,
  );
  expect(emailUrl.searchParams.get("subject")).toBe(
    "Campaign planning & creative",
  );
  await expect(contact.getByText("Obsolete form field")).toHaveCount(0);
  await expect(contact.locator("form, input, select, textarea")).toHaveCount(0);
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
  await expect(page).toHaveURL(/\/services$/);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});
