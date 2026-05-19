import { pool } from "../src/server";

export async function saveCharacters(chars: any[]) {
  const conn = await pool.getConnection();
  const map = new Map<string, number>();

  try {
    for (const c of chars) {
      const [res]: any = await conn.query(
        `INSERT INTO characters (name, role, image_url)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [c.name, c.role, c.img_url || null],
      );

      map.set(c.name, res.insertId);
    }
  } finally {
    conn.release();
  }

  return map;
}

export async function savePerks(perks: any[]) {
  const conn = await pool.getConnection();

  try {
    for (const p of perks) {
      await conn.query(
        `INSERT INTO perks (name, description, icon_url, character_id, role)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           description = VALUES(description),
           icon_url = VALUES(icon_url),
           character_id = VALUES(character_id),
           role = VALUES(role)`,
        [p.name, p.description, p.icon_url, p.character_id || null, p.role],
      );
    }
  } finally {
    conn.release();
  }
}

type KillerDetails = {
  character_id: number;
  in_game_name?: string;
  game_aliases?: string | null;
  gender?: string;
  origin?: string;
  movement_speed?: string;
  alternative_movement_speed?: string;
  terror_radius?: string;
  height?: string;
};

export async function saveKillerDetails(details: KillerDetails[]) {
  if (!details.length) return;

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for (const d of details) {
      await conn.query(
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
          d.character_id,
          d.in_game_name ?? null,
          d.game_aliases ?? null,
          d.gender ?? null,
          d.origin ?? null,
          d.movement_speed ?? null,
          d.alternative_movement_speed ?? null,
          d.terror_radius ?? null,
          d.height ?? null,
        ],
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error("Błąd zapisu killer_detail:", err);
    throw err;
  } finally {
    conn.release();
  }
}
