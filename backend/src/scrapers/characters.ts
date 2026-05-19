import { createBrowser } from "../browser/browser";
import { saveCharacters, savePerks } from "../fetch";
import { scrapePerks } from "./perks";

type Character = {
  name: string;
  role: "killer" | "survivor";
  img_url: string | undefined;
};

export async function scrapeCharacters(
  url: string,
  role: "killer" | "survivor",
  tableIndex: number,
) {
  const { browser, page } = await createBrowser();

  const characters: Character[] = [];

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const tables = await page.$$(
      ".wikitable.overflowScroll.sortable.jquery-tablesorter",
    );

    const table = tables[tableIndex];

    const rows = await table.$$("tbody tr");

    for (const row of rows) {
      const name = await row
        .$eval("th:nth-child(4) a", (el) => el.getAttribute("title"))
        .catch(() => null);

      if (!name) continue;

      const img = await row
        .$eval("th:nth-child(4) img", (el) => el.getAttribute("src"))
        .catch(() => null);

      characters.push({
        name,
        img_url: img ? `https://deadbydaylight.wiki.gg${img}` : undefined,
        role: tableIndex === 0 ? "survivor" : "killer",
      });

      if (tableIndex === 1) {
      }

      console.log(name, tableIndex === 0 ? "survivor" : "killer");
      await page.waitForTimeout(300 + Math.random() * 500);
    }

    return characters;
  } finally {
    await browser.close();
  }
}

export const scrapeSurvivors = async () => {
  const url = "https://deadbydaylight.wiki.gg/wiki/Perks";

  const survivorPerks = await scrapePerks(url, 0);

  const survivors = await scrapeCharacters(url, "survivor", 0);

  const survivorMap = await saveCharacters(survivors);

  const enrich = (perks: any[]) =>
    perks.map((p) => ({
      ...p,
      character_id: p.character_name
        ? survivorMap.get(p.character_name)
        : undefined,
    }));

  await savePerks(enrich(survivorPerks));
};

export const scrapeSurvivorsAndSaveToDatabase = async () => {
  const url = "https://deadbydaylight.wiki.gg/wiki/Perks";

  const survivorsPerks = await scrapePerks(url, 0);

  const survivors = await scrapeCharacters(url, "survivor", 0);
  const survivorsMap = await saveCharacters(survivors);
  const charMap = new Map([...survivorsMap]);

  const enrich = (perks: any[]) =>
    perks.map((p) => ({
      ...p,
      character_id: p.character_name
        ? charMap.get(p.character_name)
        : undefined,
    }));

  await savePerks(enrich(survivorsPerks));
};
