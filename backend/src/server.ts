import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import { scrapeSurvivorsAndSaveToDatabase } from "./scrapers/characters";
import { scrapeKillersAndSaveToDatabase } from "./scrapers/killers";

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
    "SELECT * FROM characters WHERE role = 'killer'",
  );

  return res.json({ killers: rows });
});

app.listen(5000, () => {
  console.log("Server działa na http://localhost:5000");
});
