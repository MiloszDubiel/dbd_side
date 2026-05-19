import { chromium } from "playwright-extra";

export async function createBrowser() {
  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
    locale: "en-US",
    timezoneId: "Europe/Warsaw",
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

 
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  return { browser, context, page };
}




