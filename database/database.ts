import type { SQLiteDatabase } from "expo-sqlite";

export async function createTables(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS languages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER NOT NULL,
      language_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      UNIQUE (word_id, language_id),
      FOREIGN KEY (word_id) REFERENCES words(id),
      FOREIGN KEY (language_id) REFERENCES languages(id)
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

    CREATE TABLE IF NOT EXISTS idioms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS idiom_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idiom_id INTEGER NOT NULL,
      language_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      UNIQUE (idiom_id, language_id),
      FOREIGN KEY (idiom_id) REFERENCES idioms(id),
      FOREIGN KEY (language_id) REFERENCES languages(id)
    );
  `);
}