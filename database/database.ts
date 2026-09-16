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

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      selected_date TEXT
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

  // Lägg till selected_date om databasen redan finns
  try {
    await db.runAsync("ALTER TABLE notes ADD COLUMN selected_date TEXT");
  } catch {
    // Kolumnen finns redan.
  }

  // --------------------------------------------------
  // Språk
  // --------------------------------------------------

  await db.runAsync(
    "INSERT OR IGNORE INTO languages (name) VALUES (?)",
    "Svenska",
  );

  await db.runAsync(
    "INSERT OR IGNORE INTO languages (name) VALUES (?)",
    "English",
  );

  await db.runAsync(
    "INSERT OR IGNORE INTO languages (name) VALUES (?)",
    "Español",
  );

  const svenska = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM languages WHERE name = ?",
    "Svenska",
  );

  const spanska = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM languages WHERE name = ?",
    "Español",
  );

  if (!svenska || !spanska) {
    throw new Error("Svenska eller Spanska saknas i languages-tabellen.");
  }

  // --------------------------------------------------
  // Kontrollera om gamla tags-tabellen finns
  // --------------------------------------------------

  const tagsTable = await db.getFirstAsync<{ name: string }>(
    `
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name = 'tags'
    `,
  );

  // --------------------------------------------------
  // Om tags inte finns: skapa den nya versionen
  // --------------------------------------------------

  if (!tagsTable) {
    await db.execAsync(`
      CREATE TABLE tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        from_language_id INTEGER NOT NULL,
        to_language_id INTEGER NOT NULL,
        UNIQUE (name, from_language_id, to_language_id),
        FOREIGN KEY (from_language_id) REFERENCES languages(id),
        FOREIGN KEY (to_language_id) REFERENCES languages(id)
      );

      CREATE TABLE word_tags (
        word_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (word_id, tag_id),
        FOREIGN KEY (word_id) REFERENCES words(id),
        FOREIGN KEY (tag_id) REFERENCES tags(id)
      );
    `);
  } else {
    // --------------------------------------------------
    // Kontrollera om tags redan är migrerad
    // --------------------------------------------------

    const columns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(tags)",
    );

    const hasLanguageColumns =
      columns.some((column) => column.name === "from_language_id") &&
      columns.some((column) => column.name === "to_language_id");

    // --------------------------------------------------
    // Migrera gamla tags till språkpar
    // --------------------------------------------------

    if (!hasLanguageColumns) {
      await db.execAsync(`
        CREATE TABLE tags_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          from_language_id INTEGER NOT NULL,
          to_language_id INTEGER NOT NULL,
          UNIQUE (name, from_language_id, to_language_id),
          FOREIGN KEY (from_language_id) REFERENCES languages(id),
          FOREIGN KEY (to_language_id) REFERENCES languages(id)
        );
      `);

      await db.runAsync(
        `
        INSERT INTO tags_new (
          id,
          name,
          from_language_id,
          to_language_id
        )
        SELECT
          id,
          name,
          ?,
          ?
        FROM tags;
        `,
        svenska.id,
        spanska.id,
      );

      await db.execAsync(`
        CREATE TABLE word_tags_new (
          word_id INTEGER NOT NULL,
          tag_id INTEGER NOT NULL,
          PRIMARY KEY (word_id, tag_id),
          FOREIGN KEY (word_id) REFERENCES words(id),
          FOREIGN KEY (tag_id) REFERENCES tags_new(id)
        );

        INSERT INTO word_tags_new (word_id, tag_id)
        SELECT word_id, tag_id
        FROM word_tags;

        DROP TABLE word_tags;
        DROP TABLE tags;

        ALTER TABLE tags_new RENAME TO tags;
        ALTER TABLE word_tags_new RENAME TO word_tags;
      `);
    }
  }

  // --------------------------------------------------
  // Ta bort gamla "Samhälle"
  // --------------------------------------------------

  await db.runAsync(`
    DELETE FROM word_tags
    WHERE tag_id IN (
      SELECT id
      FROM tags
      WHERE name = 'Samhälle'
    );
  `);

  await db.runAsync(`
    DELETE FROM tags
    WHERE name = 'Samhälle';
  `);
}
