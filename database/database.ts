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

  // Lägg till selected_date om databasen redan finns.
  // Detta påverkar inte kalenderfunktionen.
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

  const engelska = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM languages WHERE name = ?",
    "English",
  );

  const spanska = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM languages WHERE name = ?",
    "Español",
  );

  if (!svenska || !engelska || !spanska) {
    throw new Error("Ett eller flera språk saknas i languages-tabellen.");
  }

  // --------------------------------------------------
  // Kontrollera om tags-tabellen finns
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

        -- Detta är fortfarande det interna svenska namnet.
        -- Vi behåller det för att inte bryta befintliga
        -- kopplingar till word_tags och dictionaryPage.
        name TEXT NOT NULL,

        -- Alla tre översättningar är frivilliga i databasen.
        name_sv TEXT,
        name_en TEXT,
        name_es TEXT,

        from_language_id INTEGER NOT NULL,
        to_language_id INTEGER NOT NULL,

        UNIQUE (name, from_language_id, to_language_id),

        FOREIGN KEY (from_language_id)
          REFERENCES languages(id),

        FOREIGN KEY (to_language_id)
          REFERENCES languages(id)
      );

      CREATE TABLE word_tags (
        word_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,

        PRIMARY KEY (word_id, tag_id),

        FOREIGN KEY (word_id)
          REFERENCES words(id),

        FOREIGN KEY (tag_id)
          REFERENCES tags(id)
      );
    `);
  } else {
    // --------------------------------------------------
    // Kontrollera vilka kolumner tags har
    // --------------------------------------------------

    const columns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(tags)",
    );

    const hasLanguageColumns =
      columns.some((column) => column.name === "from_language_id") &&
      columns.some((column) => column.name === "to_language_id");

    // --------------------------------------------------
    // Gamla tags utan språkpar
    // --------------------------------------------------

    if (!hasLanguageColumns) {
      await db.execAsync(`
        CREATE TABLE tags_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,

          name_sv TEXT,
          name_en TEXT,
          name_es TEXT,

          from_language_id INTEGER NOT NULL,
          to_language_id INTEGER NOT NULL,

          UNIQUE (
            name,
            from_language_id,
            to_language_id
          ),

          FOREIGN KEY (from_language_id)
            REFERENCES languages(id),

          FOREIGN KEY (to_language_id)
            REFERENCES languages(id)
        );
      `);

      await db.runAsync(
        `
        INSERT INTO tags_new (
          id,
          name,
          name_sv,
          name_en,
          name_es,
          from_language_id,
          to_language_id
        )
        SELECT
          id,
          name,
          name,
          name,
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

          FOREIGN KEY (word_id)
            REFERENCES words(id),

          FOREIGN KEY (tag_id)
            REFERENCES tags_new(id)
        );

        INSERT INTO word_tags_new (word_id, tag_id)
        SELECT word_id, tag_id
        FROM word_tags;

        DROP TABLE word_tags;
        DROP TABLE tags;

        ALTER TABLE tags_new RENAME TO tags;
        ALTER TABLE word_tags_new RENAME TO word_tags;
      `);
    } else {
      // --------------------------------------------------
      // tags har redan språkpar.
      // Lägg till översättningskolumner om de saknas.
      // --------------------------------------------------

      const updatedColumns = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(tags)",
      );

      const hasNameSv = updatedColumns.some(
        (column) => column.name === "name_sv",
      );

      const hasNameEn = updatedColumns.some(
        (column) => column.name === "name_en",
      );

      const hasNameEs = updatedColumns.some(
        (column) => column.name === "name_es",
      );

      if (!hasNameSv) {
        await db.runAsync("ALTER TABLE tags ADD COLUMN name_sv TEXT");
      }

      if (!hasNameEn) {
        await db.runAsync("ALTER TABLE tags ADD COLUMN name_en TEXT");
      }

      if (!hasNameEs) {
        await db.runAsync("ALTER TABLE tags ADD COLUMN name_es TEXT");
      }
    }
  }

  // --------------------------------------------------
  // Se till att gamla kategorier får svenska namn
  // --------------------------------------------------

  await db.runAsync(
    `
    UPDATE tags
    SET name_sv = name
    WHERE name_sv IS NULL
       OR name_sv = ''
    `,
  );

  // --------------------------------------------------
  // Översättningar för de gamla kategorierna
  // --------------------------------------------------

  await db.runAsync(
    `
    UPDATE tags
    SET
      name_en = 'Law',
      name_es = 'Derecho'
    WHERE name = 'Juridik'
    `,
  );

  await db.runAsync(
    `
    UPDATE tags
    SET
      name_en = 'Social Studies',
      name_es = 'Ciencias Sociales'
    WHERE name = 'Samhällskunskap'
    `,
  );

  await db.runAsync(
    `
    UPDATE tags
    SET
      name_en = 'Migration',
      name_es = 'Migración'
    WHERE name = 'Migration'
    `,
  );

  await db.runAsync(
    `
    UPDATE tags
    SET
      name_en = 'Healthcare',
      name_es = 'Salud'
    WHERE name = 'Sjukvård'
    `,
  );

  // Gamla kategorier som saknar engelsk/spansk
  // översättning får svenska som fallback.
  await db.runAsync(
    `
    UPDATE tags
    SET name_en = name_sv
    WHERE name_en IS NULL
       OR name_en = ''
    `,
  );

  await db.runAsync(
    `
    UPDATE tags
    SET name_es = name_sv
    WHERE name_es IS NULL
       OR name_es = ''
    `,
  );

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

  // --------------------------------------------------
  // Standardkategori för ord utan vald kategori
  // --------------------------------------------------

  await db.runAsync(
    `
    INSERT OR IGNORE INTO tags (
      name,
      name_sv,
      name_en,
      name_es,
      from_language_id,
      to_language_id
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    "Övrigt",
    "Övrigt",
    "Other",
    "Otros",
    svenska.id,
    spanska.id,
  );
}
