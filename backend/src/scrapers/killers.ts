import { createBrowser } from "../browser/browser";
import { pool } from "../server";
import { scrapeCharacters } from "./characters";
import { saveCharacters, savePerks } from "../fetch";
import pLimit from "p-limit";
import { saveKillerDetails } from "../fetch";
import { scrapePerks } from "./perks";

export async function scrapeKillerDetails(name: string) {
  const { browser, page } = await createBrowser();

  const url = `https://deadbydaylight.wiki.gg/wiki/${name.replace(/\s/g, "_")}`;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const get = async (label: string) => {
      return page
        .$eval(
          ".infoboxtable",
          (table, label) => {
            const rows = table.querySelectorAll("tr");
            console.log(rows);

            for (const row of rows) {
              const tdName = row.querySelectorAll("td")[0];
              const tdValue = row.querySelectorAll("td")[1];

              if (tdName?.textContent?.includes(label)) {
                return tdValue?.textContent?.trim() || null;
              }
            }

            return null;
          },
          label,
        )
        .catch(() => null);
    };
    return {
      in_game_name: name,
      name: await get("Name"),
      game_aliases: await get("Game Alias(es)"),
      gender: await get("Gender"),
      origin: await get("Origin"),
      power_attack_type: await get("Power Attack Type"),
      movement_speed: await get("Movement Speed"),
      alternative_movement_speed: await get("Alternate Movement speed"),
      terror_radius: await get("Terror Radius"),
      height: await get("Height"),
    };
  } finally {
    await browser.close();
  }
}

export const updateKillerDetail = async () => {
  const [rows] = await pool.query<any[]>(
    "SELECT * FROM characters WHERE role='killer'",
  );

  for (const row of rows) {
    const details = await scrapeKillerDetails(row.name);

    await pool.query(
      `
      INSERT INTO killer_detail (
        character_id,
        in_game_name,
        game_aliases,
        gender,
        origin,
        movement_speed,
        alternate_movement_speed,
        terror_radius,
        height
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        in_game_name = VALUES(in_game_name),
        game_aliases = VALUES(game_aliases),
        gender = VALUES(gender),
        origin = VALUES(origin),
        movement_speed = VALUES(movement_speed),
        alternate_movement_speed = VALUES(alternate_movement_speed),
        terror_radius = VALUES(terror_radius),
        height = VALUES(height)
      `,
      [
        row.id,
        details.in_game_name ?? null,
        details.game_aliases ?? null,
        details.gender ?? null,
        details.origin ?? null,
        details.movement_speed ?? null,
        details.alternative_movement_speed ?? null,
        details.terror_radius ?? null,
        details.height ?? null,
      ],
    );
  }
};

export const scrapeKillersAndSaveToDatabase = async () => {
  const url = "https://deadbydaylight.wiki.gg/wiki/Perks";

  const killerPerks = await scrapePerks(url, 1);

  const killers = await scrapeCharacters(url, "killer", 1);
  const killerMap = await saveCharacters(killers);
  const charMap = new Map([...killerMap]);

  const limit = pLimit(5);
  const killerDetails = await Promise.all(
    killers.map((k) =>
      limit(async () => {
        try {
          const details = await scrapeKillerDetails(k.name);

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

  await savePerks(enrich(killerPerks));
};
