import axios from "axios";
import * as cheerio from "cheerio";
import { pool } from "./server";

type Perk = {
  icon: string;
  name: string;
  description: string;
  icon_url?: string;
  character_name?: string;
  character_id?: number;
};

type Character = {
  name: string;
  img_url?: string;
  role: "killer" | "survivor";
};

async function scrapePerks(
  url: string,
  role: "killer" | "survivor",
  tableIndex: number,
) {
  const { data } = await axios.get(url);

  const $ = cheerio.load(data);

  const perks: Perk[] = [];

  const table = $(".wikitable").eq(tableIndex);

  table.find("tbody tr").each((_, el) => {
    const name = $(el).find("td:nth-child(1) a").text().trim();
    const description = $(el).find("td:nth-child(3)").text().trim();
    const icon = $(el).find("td:nth-child(1) img").attr("src");

    const character_name = $(el).find("td:nth-child(4) a").attr("title");

    if (name) {
      perks.push({
        name,
        description,
        icon: icon || "",
        character_name: character_name || undefined,
        character_id: undefined,
      });
    }
  });

  return perks;
}

async function scrapeCharacters(
  url: string,
  role: "killer" | "survivor",
  tableIndex: number,
) {
  const { data } = await axios.get(url);

  const $ = cheerio.load(data);

  const characters: Character[] = [];

  const table = $(".wikitable").eq(tableIndex);

  table.find("tbody tr").each((_, el) => {
    const name = $(el).find("td:nth-child(4) a").attr("title");
    const img_url = $(el).find("td:nth-child(4) img").attr("src");

    if (name) {
      characters.push({
        name,
        role,
        img_url: img_url || undefined,
      });
    }
  });

  return characters;
}

async function saveCharacters(characters: Character[]) {
  const conn = await pool.getConnection();
  const map = new Map<string, number>();

  try {
    for (const char of characters) {
      const [result]: any = await conn.query(
        `INSERT INTO characters (name, role, img_url)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [char.name, char.role, char.img_url || null],
      );

      const id = result.insertId;

      map.set(char.name, id);
    }
  } catch (err) {
    console.error("CHAR ERROR:", err);
  } finally {
    conn.release();
  }

  return map;
}

function assignCharacterIds(
  perks: Perk[],
  charMap: Map<string, number>,
): Perk[] {
  return perks.map((perk) => {
    const character_id = perk.character_name
      ? charMap.get(perk.character_name)
      : undefined;

    return {
      ...perk,
      character_id,
    };
  });
}

async function savePerks(perks: Perk[]) {
  const conn = await pool.getConnection();

  try {
    for (const perk of perks) {
      console.log(perk);
      await conn.query(
        `INSERT INTO perks (name, description, icon_url, character_id)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=name`,
        [
          perk.name,
          perk.description,
          perk.icon_url || null,
          perk.character_id || null,
        ],
      );
    }
  } catch (err) {
    console.error("PERK ERROR:", err);
  } finally {
    conn.release();
  }
}

export async function main() {
  const url = "https://deadbydaylight.wiki.gg/wiki/Perks";

  const survivorPerks = await scrapePerks(url, "survivor", 1);
  const killerPerks = await scrapePerks(url, "killer", 2);

  const survivorsCharacters = await scrapeCharacters(url, "survivor", 1);
  const killerCharacters = await scrapeCharacters(url, "killer", 2);

  const survivorMap = await saveCharacters(survivorsCharacters);
  const killerMap = await saveCharacters(killerCharacters);

  const charMap = new Map([...survivorMap, ...killerMap]);

  const killerFinal = assignCharacterIds(killerPerks, charMap);
  const survivorFinal = assignCharacterIds(survivorPerks, charMap);

  await savePerks(killerFinal);
  await savePerks(survivorFinal);

  console.log("SCRAPING DONE");
}
