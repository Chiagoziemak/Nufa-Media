import { test, expect, type Page, type Locator } from "@playwright/test";
import defaults from "../content/defaults.json" with { type: "json" };
import type { ImageColorMode } from "../src/types";

const cms = /https:\/\/2bndbdfg\.(api|apicdn)\.sanity\.io\/.*\/data\/query\//;
const original = (type: string) =>
  defaults.page.sections.find((section) => section._type === type)!;
const image = (alt: string, colorMode?: ImageColorMode) => ({
  asset: { url: "/images/platform.svg" },
  alt,
  ...(colorMode ? { colorMode } : {}),
});
function imagePage(position?: "left" | "right", colorMode?: ImageColorMode) {
  const placement = position ? { imagePosition: position } : {};
  return {
    ...defaults.page,
    sections: [
      {
        ...original("heroBlock"),
        ...placement,
        image: image("Hero image", colorMode),
      },
      {
        ...original("servicesBlock"),
        ...placement,
        image: image("Services image", colorMode),
      },
      {
        ...original("aboutBlock"),
        ...placement,
        image: image("About image", colorMode),
      },
      {
        ...original("workBlock"),
        items: [
          {
            ...original("workBlock").items![0],
            image: image("Project image", colorMode),
          },
        ],
      },
      {
        _key: "banner",
        _type: "imageBlock",
        anchor: "banner",
        headline: "An image with a story",
        description: "Supporting copy for the image.",
        caption: "An editable caption.",
        ...placement,
        image: image("Banner image", colorMode),
      },
    ],
  };
}
async function loadContent(page: Page, content: ReturnType<typeof imagePage>) {
  await page.unroute(cms);
  await page.route(cms, (route) =>
    route.fulfill({
      json: { result: { settings: defaults.settings, page: content } },
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Ideas ThatMove Brands.",
  );
}
async function assertPlacement(
  img: Locator,
  copy: Locator,
  position: "left" | "right",
  mobile: boolean,
) {
  await img.scrollIntoViewIfNeeded();
  await expect(img).not.toHaveJSProperty("naturalWidth", 0);
  const imageBox = (await img.boundingBox())!;
  const copyBox = (await copy.boundingBox())!;
  expect(imageBox).not.toBeNull();
  expect(copyBox).not.toBeNull();
  if (mobile) {
    if (position === "left")
      expect(imageBox.y + imageBox.height).toBeLessThanOrEqual(copyBox.y + 1);
    else expect(copyBox.y + copyBox.height).toBeLessThanOrEqual(imageBox.y + 1);
  } else {
    if (position === "left")
      expect(imageBox.x + imageBox.width).toBeLessThanOrEqual(copyBox.x + 1);
    else expect(copyBox.x + copyBox.width).toBeLessThanOrEqual(imageBox.x + 1);
  }
}

test("Sanity colour choices apply to every uploaded image and the project dialog", async ({
  page,
}) => {
  for (const colorMode of ["colour", "blackAndWhite"] as const) {
    await loadContent(page, imagePage(undefined, colorMode));
    const filter = colorMode === "colour" ? "none" : "grayscale(1)";
    for (const alt of [
      "Hero image",
      "Services image",
      "About image",
      "Project image",
      "Banner image",
    ]) {
      await expect(page.getByRole("img", { name: alt, exact: true })).toHaveCSS(
        "filter",
        filter,
      );
    }
    await page.getByRole("button", { name: /The Form of Void/ }).click();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("img", { name: "Project image", exact: true }),
    ).toHaveCSS("filter", filter);
    await page.keyboard.press("Escape");
  }
});

test("left and right placements work beside text and stack correctly on mobile", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile";
  for (const position of ["left", "right"] as const) {
    await loadContent(page, imagePage(position));
    for (const [alt, section] of [
      ["Services image", "#services"],
      ["About image", "#about"],
      ["Banner image", "#banner"],
    ]) {
      await assertPlacement(
        page.getByRole("img", { name: alt, exact: true }),
        page.locator(`${section} .image-copy`),
        position,
        mobile,
      );
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  }
});

test("hero placement shifts the background and keeps text readable on either side", async ({
  page,
}, testInfo) => {
  const copyPositions: number[] = [];
  const imagePositions: number[] = [];
  for (const position of ["right", "left"] as const) {
    await loadContent(page, imagePage(position, "colour"));
    await expect(
      page.getByRole("img", { name: "Hero image", exact: true }),
    ).toHaveCSS("object-position", position === "left" ? "25% 50%" : "75% 50%");
    await expect(page.locator(".hero-copy")).toBeVisible();
    copyPositions.push((await page.locator(".hero-copy").boundingBox())!.x);
    imagePositions.push(
      (await page
        .getByRole("img", { name: "Hero image", exact: true })
        .boundingBox())!.x,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  }
  if (testInfo.project.name === "desktop") {
    expect(copyPositions[1]).toBeGreaterThan(copyPositions[0] + 100);
    expect(imagePositions[1]).toBeLessThan(imagePositions[0] - 100);
  }
});

test("existing images without new options keep their original appearance and layout", async ({
  page,
}, testInfo) => {
  await loadContent(page, imagePage());
  for (const alt of ["Hero image", "Services image", "Project image"]) {
    await expect(page.getByRole("img", { name: alt, exact: true })).toHaveCSS(
      "filter",
      "grayscale(1)",
    );
  }
  for (const alt of ["About image", "Banner image"]) {
    await expect(page.getByRole("img", { name: alt, exact: true })).toHaveCSS(
      "filter",
      "none",
    );
  }
  await assertPlacement(
    page.getByRole("img", { name: "Services image", exact: true }),
    page.locator("#services .image-copy"),
    "right",
    testInfo.project.name === "mobile",
  );
  const about = page.getByRole("img", { name: "About image", exact: true });
  await about.scrollIntoViewIfNeeded();
  await expect(about).not.toHaveJSProperty("naturalWidth", 0);
  expect((await about.boundingBox())!.y).toBeGreaterThan(
    (await page.locator("#about .about-quote").boundingBox())!.y,
  );
  const banner = page.getByRole("img", { name: "Banner image", exact: true });
  await banner.scrollIntoViewIfNeeded();
  await expect(banner).not.toHaveJSProperty("naturalWidth", 0);
  expect((await banner.boundingBox())!.width).toBeCloseTo(
    (await page.locator("#banner .image-copy").boundingBox())!.width,
    0,
  );
});
