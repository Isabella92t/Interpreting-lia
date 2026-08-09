import type { SQLiteDatabase } from "expo-sqlite";

export async function createTables(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS languages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      svenska TEXT NOT NULL UNIQUE,
      engelska TEXT NOT NULL,
      spanska TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS word_tags (
      word_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (word_id, tag_id),
      FOREIGN KEY (word_id) REFERENCES words(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    );
  `);
}
