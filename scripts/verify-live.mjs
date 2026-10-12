// Optional integration smoke test. Uses the real public Sanity dataset; writes nothing.
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5173";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
const browser = await chromium.launch({ executablePath });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(base);
  await page.locator("h1").waitFor();
  const status = await page.getByRole("status").allTextContents();
  if (status.some((text) => text.includes("temporarily unavailable")))
    throw new Error(
      "The browser could not read the live Sanity dataset. Check HTTPS trust, CORS, and the network allowlist.",
    );
  console.log("Live Sanity content request: passed.");
  for (const image of await page.locator("main img").all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(
      (img) =>
        new Promise((resolve, reject) => {
          if (img.complete)
            return img.naturalWidth
              ? resolve()
              : reject(new Error("Broken image"));
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener(
            "error",
            () => reject(new Error("Broken image")),
            { once: true },
          );
        }),
    );
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "/tmp/nufa-website-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/nufa-website-mobile.png",
    fullPage: true,
  });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error("Mobile page overflows.");
  await page.goto(`${base}/studio`);
  await page
    .getByText("Sign in", { exact: false })
    .first()
    .waitFor({ timeout: 30000 });
  console.log("Connected Studio sign-in: passed.");
  await page.screenshot({ path: "/tmp/nufa-studio-login.png" });
} finally {
  await browser.close();
}
