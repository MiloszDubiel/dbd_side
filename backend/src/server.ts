import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import { scrapeSurvivorsAndSaveToDatabase } from "./scrapers/characters";
import {
  getKillerAttackType,
  getKillerReleaseYear,
  scrapeKillersAndSaveToDatabase,
} from "./scrapers/killers";
import { KillerDetails } from "./fetch";

const app = express();
app.use(cors());

export const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1qazXSW@",
  database: "dbd",
});

app.get("/perks", async (req, res) => {
  const { role } = req.query;

  const [rows] = await pool.query("SELECT * FROM perks WHERE role = ?", [role]);

  res.json(rows);
});

app.get("/random-build", async (req, res) => {
  const { role } = req.query;

  const [rows] = await pool.query(
    `SELECT * FROM perks
     WHERE role = ?
     ORDER BY RAND()
     LIMIT 4`,
    [role],
  );

  res.json(rows);
});

app.get("/scrape-data", async () => {
  await scrapeKillersAndSaveToDatabase();
  await scrapeSurvivorsAndSaveToDatabase();
});
app.get("/scrape-killers", async () => {
  await scrapeKillersAndSaveToDatabase();
});
app.get("/scrape-survivors", async () => {
  await scrapeSurvivorsAndSaveToDatabase();
});

app.get("/get-killers", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM characters  INNER JOIN killer_detail ON characters.id = killer_detail.character_id WHERE characters.role = 'killer'",
  );

  return res.json({ killers: rows });
});

app.get("/get-selected-killer", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM todays_killer INNER JOIN characters ON todays_killer.character_id = characters.id INNER JOIN killer_detail ON characters.id = killer_detail.character_id",
  );

  return res.json({ killers: rows });
});

async function updateTodaysKiller() {
  const [rows]: any = await pool.query(`
    SELECT *
    FROM todays_killer
    LIMIT 1
  `);

  const current = rows[0];

  if (!current) {
    await createNewTodaysKiller();
    return;
  }

  const lastUpdate = new Date(current.updated_at);
  const now = new Date();

  const diffMs = now.getTime() - lastUpdate.getTime();

  const hoursPassed = diffMs / (1000 * 60 * 60);

  if (hoursPassed >= 24) {
    await createNewTodaysKiller(current.character_id);
  }
}

async function createNewTodaysKiller(previousId?: number) {
  const [killers]: any = await pool.query(
    `
    SELECT id
    FROM characters
    WHERE role = 'killer'
    ${previousId ? "AND id != ?" : ""}
    ORDER BY RAND()
    LIMIT 1
  `,
    previousId ? [previousId] : [],
  );

  const killerId = killers[0].id;

  const [existing]: any = await pool.query(`
    SELECT id
    FROM todays_killer
    LIMIT 1
  `);

  if (existing.length) {
    await pool.query(
      `
      UPDATE todays_killer
      SET
        character_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [killerId, existing[0].id],
    );
  } else {
    await pool.query(
      `
      INSERT INTO todays_killer
      (character_id)
      VALUES (?)
    `,
      [killerId],
    );
  }

  console.log("Nowy killer dnia:", killerId);
}

(async () => {
  await updateTodaysKiller();
})();



app.listen(5000, () => {
  console.log("Server działa na http://localhost:5000");
});
