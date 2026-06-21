import { createBrowser } from "../browser/browser";
import { pool } from "../server";
import { scrapeCharacters } from "./characters";
import { saveCharacters, savePerks } from "../fetch";
import pLimit from "p-limit";
import { saveKillerDetails } from "../fetch";
import { scrapePerks } from "./perks";
import { join } from "node:path";

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

  2024: ["The Unknown", "The Lich", "The Dark Lord", "The Houndmaster"],

  2025: ["The Ghoul", "The Krasue", "The Animatronic"],
  2026: ["The First", "The Slasher"],
};

export const RANGED = [
  "The Huntress",
  "The Trickster",
  "The Deathslinger",
  "The Artist",
  "The First",
  "The Slasher",
];

export const HYBRID = [
  "The Nurse",
  "The Blight",
  "The Oni",
  "The Hillbilly",
  "The Cannibal",
  "The Shape",
  "The Demogorgon",
  "The Executioner",
  "The Singularity",
  "The Xenomorph",
  "The Mastermind",
  "The Lich",
  "The Krasue",
];

export const getKillerAttackType = (name: string): string => {
  for (const range of RANGED) {
    if (range.toLocaleLowerCase().includes(name.toLocaleLowerCase()))
      return "Ranged";
  }

  for (const hybrid of HYBRID) {
    if (hybrid.toLocaleLowerCase().includes(name.toLocaleLowerCase()))
      return "Hybrid";
  }

  return "Basic Attack";
};

export function getKillerReleaseYear(name: string): string | null {
  for (const [year, killers] of Object.entries(killerReleaseYears)) {
    for (const killer of killers) {
      if (killer.toLocaleLowerCase().includes(name.toLocaleLowerCase())) {
        return String(year);
      }
    }
  }
  return null;
}
const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> => {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      console.log(
        `Próba ${i + 1}/${retries} nieudana. Ponawiam za ${delay}ms...`,
      );

      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};
export async function scrapeKillerDetails(
  in_game_name: string,
  full_name: string | null,
) {
  const { browser, page } = await createBrowser();

  const url = `https://deadbydaylight.wiki.gg/wiki/The_${in_game_name.replace(/\s/g, "_")}`;

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

        let value = await row
          .$eval(".valueColumn", (el) => el?.textContent?.trim())
          .catch(() => "");

        if (label === "Movement Speed") {
          const mainMatch = value?.match(/\d+(?:\.\d+)?/g) || [];

          value = mainMatch?.map((v) => `${v}m/s`).join(" ");
        }
        if (label === "Origin") value = value.split("(")[0];

        if (label === "Terror Radius") {
          const matches = value?.match(/\d+(?:\.\d+)?/g) || [];

          value = matches.map((v) => `${v}m`).join(" ");
        }

        if (label === "Alternate Movement speed") {
          const matches = value?.match(/\d+(?:\.\d+)?/g) || [];

          value = matches.map((v) => `${v}m/s`).join(" ");
        }

        if (title.includes(label)) {
          return value;
        }
      }
    };

    console.log(in_game_name);

    return {
      in_game_name,
      full_name,
      name: await get("Name"),
      game_aliases: await get("Game Alias"),
      gender: await get("Gender"),
      origin: await get("Origin"),
      power_attack_type: getKillerAttackType(in_game_name),
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

  const killerPerks = await scrapePerks(url, 1);
  const killers = await scrapeCharacters(url, "killer", 1);
  const killerMap = await saveCharacters(killers);
  const charMap = new Map([...killerMap]);

  const limit = pLimit(5);

  const uniqueKillers = [...new Map(killers.map((k) => [k.name, k])).values()];
  const killerDetails = await Promise.all(
    uniqueKillers.map((k) =>
      limit(async () => {
        try {
          const details = await retry(
            () => scrapeKillerDetails(k.name, k.fullName),
            5,
            2000,
          );

          return {
            ...details,
            character_id: charMap.get(k.name),
          };
        } catch (err) {
          console.error("Błąd dla:", k.name, err);
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

  await savePerks(enrich(killerPerks));
};
