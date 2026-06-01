import { createBrowser } from "../browser/browser";
import { pool } from "../server";
import { scrapeCharacters } from "./characters";
import { saveCharacters, savePerks } from "../fetch";
import pLimit from "p-limit";
import { saveKillerDetails } from "../fetch";
import { scrapePerks } from "./perks";

export const killerReleaseYears = {
  2016: [
    "The Trapper",
    "The Wraith",
    "The Hillbilly",
    "The Nurse",
    "The Shape",
    "The Hag",
  ],

  2017: ["The Doctor", "The Huntress", "The Cannibal", "The Nightmare"],

  2018: ["The Pig", "The Clown", "The Spirit", "The Legion"],

  2019: ["The Plague", "The Ghost Face", "The Demogorgon", "The Oni"],

  2020: ["The Deathslinger", "The Executioner", "The Blight", "The Twins"],

  2021: ["The Trickster", "The Nemesis", "The Cenobite", "The Artist"],

  2022: ["The Onryō", "The Dredge", "The Mastermind", "The Knight"],

  2023: [
    "The Skull Merchant",
    "The Singularity",
    "The Xenomorph",
    "The Good Guy",
  ],

  2024: ["The Unknown", "The Lich", "The Dark Lord"],

  2025: ["The Houndmaster", "The Ghoul"],
};

export function getKillerReleaseYear(name: string): string | null {
  for (const [year, killers] of Object.entries(killerReleaseYears)) {
    if (killers.includes(name)) {
      return String(year);
    }
  }

  return null;
}

export async function scrapeKillerDetails(
  in_game_name: string,
  full_name: string | null,
) {
  const { browser, page } = await createBrowser();

  const url = `https://deadbydaylight.wiki.gg/wiki/${in_game_name.replace(/\s/g, "_")}`;

  try {
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForSelector(".killerInfobox");

    const get = async (label: string) => {
      const tabel = (await page.$$(".killerInfobox"))[0];

      const rows = await tabel.$$("tr");

      for (const row of rows) {
        const title = await row
          .$eval(".titleColumn", (el) => el?.textContent?.trim())
          .catch(() => "");

        const value = await row
          .$eval(".valueColumn", (el) => el?.textContent?.trim())
          .catch(() => "");

        if (title.includes(label)) {
          return value;
        }
      }
    };

    return {
      in_game_name,
      full_name,
      name: await get("Name"),
      game_aliases: await get("Game Alias"),
      gender: await get("Gender"),
      origin: await get("Origin"),
      power_attack_type: await get("Attack"),
      movement_speed: await get("Movement Speed"),
      alternative_movement_speed: await get("Alternate Movement speed"),
      terror_radius: await get("Terror Radius"),
      height: await get("Height"),
      release_date: getKillerReleaseYear(in_game_name || ""),
    };
  } finally {
    await browser.close();
  }
}

export const scrapeKillersAndSaveToDatabase = async () => {
  const url = "https://deadbydaylight.wiki.gg/wiki/Perks";

  // const killerPerks = await scrapePerks(url, 1);
  const killers = await scrapeCharacters(url, "killer", 1);
  const killerMap = await saveCharacters(killers);
  const charMap = new Map([...killerMap]);

  const limit = pLimit(5);
  const killerDetails = await Promise.all(
    killers.map((k) =>
      limit(async () => {
        try {
          const details = await scrapeKillerDetails(k.name, k.fullName);

          return {
            ...details,
            character_id: charMap.get(k.name),
          };
        } catch (err) {
          console.error("Błąd dla:", k.name);
          return null;
        }
      }),
    ),
  );

  const validDetails = killerDetails.filter(Boolean);
  await saveKillerDetails(validDetails as []);

  const enrich = (perks: any[]) =>
    perks.map((p) => ({
      ...p,
      character_id: p.character_name
        ? charMap.get(p.character_name)
        : undefined,
    }));

  // await savePerks(enrich(killerPerks));
};
