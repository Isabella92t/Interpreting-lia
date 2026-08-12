import type { SQLiteDatabase } from "expo-sqlite";

export async function seedDatabase(db: SQLiteDatabase) {
  // Språk
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

  // Kategorier
  await db.runAsync("INSERT OR IGNORE INTO tags (name) VALUES (?)", "Juridik");

  await db.runAsync("INSERT OR IGNORE INTO tags (name) VALUES (?)", "Samhälle");

  // Ord
  await db.runAsync("INSERT OR IGNORE INTO words (name) VALUES (?)", "avtal");

  await db.runAsync("INSERT OR IGNORE INTO words (name) VALUES (?)", "domstol");

  await db.runAsync("INSERT OR IGNORE INTO words (name) VALUES (?)", "lag");

  await db.runAsync(
    "INSERT OR IGNORE INTO words (name) VALUES (?)",
    "medborgarskap",
  );

  await db.runAsync(
    "INSERT OR IGNORE INTO words (name) VALUES (?)",
    "uppehållstillstånd",
  );

  // Hämta ID för ord
  const avtal = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM words WHERE name = ?",
    "avtal",
  );

  const domstol = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM words WHERE name = ?",
    "domstol",
  );

  const lag = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM words WHERE name = ?",
    "lag",
  );

  const medborgarskap = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM words WHERE name = ?",
    "medborgarskap",
  );

  const uppehallstillstand = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM words WHERE name = ?",
    "uppehållstillstånd",
  );

  // Hämta ID för språk
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

  // Översättningar för avtal
  if (avtal && svenska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      avtal.id,
      svenska.id,
      "avtal",
    );
  }

  if (avtal && engelska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      avtal.id,
      engelska.id,
      "agreement",
    );
  }

  if (avtal && spanska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      avtal.id,
      spanska.id,
      "contrato",
    );
  }

  // Översättningar för domstol
  if (domstol && svenska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      domstol.id,
      svenska.id,
      "domstol",
    );
  }

  if (domstol && engelska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      domstol.id,
      engelska.id,
      "court",
    );
  }

  if (domstol && spanska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      domstol.id,
      spanska.id,
      "tribunal",
    );
  }

  // Översättningar för lag
  if (lag && svenska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      lag.id,
      svenska.id,
      "lag",
    );
  }

  if (lag && engelska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      lag.id,
      engelska.id,
      "law",
    );
  }

  if (lag && spanska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      lag.id,
      spanska.id,
      "ley",
    );
  }

  // Översättningar för medborgarskap
  if (medborgarskap && svenska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      medborgarskap.id,
      svenska.id,
      "medborgarskap",
    );
  }

  if (medborgarskap && engelska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      medborgarskap.id,
      engelska.id,
      "citizenship",
    );
  }

  if (medborgarskap && spanska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      medborgarskap.id,
      spanska.id,
      "ciudadanía",
    );
  }

  // Översättningar för uppehållstillstånd
  if (uppehallstillstand && svenska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      uppehallstillstand.id,
      svenska.id,
      "uppehållstillstånd",
    );
  }

  if (uppehallstillstand && engelska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      uppehallstillstand.id,
      engelska.id,
      "residence permit",
    );
  }

  if (uppehallstillstand && spanska) {
    await db.runAsync(
      "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
      uppehallstillstand.id,
      spanska.id,
      "permiso de residencia",
    );
  }

  // Hämta kategori-ID
  const juridik = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM tags WHERE name = ?",
    "Juridik",
  );

  const samhälle = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM tags WHERE name = ?",
    "Samhälle",
  );

  // Koppla ord till kategorier
  if (avtal && juridik) {
    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      avtal.id,
      juridik.id,
    );
  }

  if (avtal && samhälle) {
    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      avtal.id,
      samhälle.id,
    );
  }

  if (domstol && juridik) {
    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      domstol.id,
      juridik.id,
    );
  }

  if (lag && juridik) {
    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      lag.id,
      juridik.id,
    );
  }

  if (medborgarskap && samhälle) {
    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      medborgarskap.id,
      samhälle.id,
    );
  }

  if (uppehallstillstand && samhälle) {
    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      uppehallstillstand.id,
      samhälle.id,
    );
  }
}
