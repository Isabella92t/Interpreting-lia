import * as SQLite from "expo-sqlite";

// Öppna (eller skapa) databasen
export const db = await SQLite.openDatabaseAsync("words.db");

export async function createTables() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      svenska TEXT NOT NULL,
      engelska TEXT NOT NULL,
      spanska TEXT NOT NULL
    );
  `);
}
