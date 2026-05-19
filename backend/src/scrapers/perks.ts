import { createBrowser } from "../browser/browser";

export async function scrapePerks(url: string, tableIndex: number) {
  const { browser, page } = await createBrowser();

  const perks: any[] = [];

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const tables = await page.$$(
      ".wikitable.overflowScroll.sortable.jquery-tablesorter",
    );

    const table = tables[tableIndex];

    const rows = await table.$$("tbody tr");

    for (const row of rows) {
      const name = await row
        .$eval("th:nth-child(2) a", (el) => el.textContent?.trim())
        .catch(() => null);

      if (!name) continue;

      const icon = await row
        .$eval("th:nth-child(1) img", (el) => el.getAttribute("src"))
        .catch(() => null);

      const description = await row
        .$eval("td:nth-child(3)", (el) => el.innerHTML)
        .catch(() => "");

      const character_name = await row
        .$eval("th:nth-child(4) a", (el) => el.getAttribute("title"))
        .catch(() => null);

      console.log(
        name,
        character_name,
        tableIndex === 0 ? "survivor" : "killer",
      );

      perks.push({
        name,
        description: description || "",
        icon_url: icon ? `https://deadbydaylight.wiki.gg${icon}` : "",
        character_name: character_name || undefined,
        role: tableIndex === 0 ? "survivor" : "killer",
      });

      await page.waitForTimeout(200 + Math.random() * 400);
    }

    return perks;
  } finally {
    await browser.close();
  }
}
