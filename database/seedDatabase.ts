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
  await db.runAsync(
    "INSERT OR IGNORE INTO words (svenska, engelska, spanska) VALUES (?, ?, ?)",
    "avtal",
    "agreement",
    "contrato",
  );

  await db.runAsync(
    "INSERT OR IGNORE INTO words (svenska, engelska, spanska) VALUES (?, ?, ?)",
    "domstol",
    "court",
    "tribunal",
  );

  await db.runAsync(
    "INSERT OR IGNORE INTO words (svenska, engelska, spanska) VALUES (?, ?, ?)",
    "lag",
    "law",
    "ley",
  );

  await db.runAsync(
    "INSERT OR IGNORE INTO words (svenska, engelska, spanska) VALUES (?, ?, ?)",
    "medborgarskap",
    "citizenship",
    "ciudadanía",
  );

  await db.runAsync(
    "INSERT OR IGNORE INTO words (svenska, engelska, spanska) VALUES (?, ?, ?)",
    "uppehållstillstånd",
    "residence permit",
    "permiso de residencia",
  );

  // Hämta ID för ord
  const avtal = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM words WHERE svenska = ?",
    "avtal",
  );

  const domstol = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM words WHERE svenska = ?",
    "domstol",
  );

  const lag = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM words WHERE svenska = ?",
    "lag",
  );

  const medborgarskap = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM words WHERE svenska = ?",
    "medborgarskap",
  );

  const uppehållstillstånd = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM words WHERE svenska = ?",
    "uppehållstillstånd",
  );

  // Hämta ID för kategorier
  const juridik = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM tags WHERE name = ?",
    "Juridik",
  );

  const samhälle = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM tags WHERE name = ?",
    "Samhälle",
  );

  // Avtal → Juridik + Samhälle
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

  // Domstol → Juridik
  if (domstol && juridik) {
    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      domstol.id,
      juridik.id,
    );
  }

  // Lag → Juridik
  if (lag && juridik) {
    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      lag.id,
      juridik.id,
    );
  }

  // Medborgarskap → Samhälle
  if (medborgarskap && samhälle) {
    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      medborgarskap.id,
      samhälle.id,
    );
  }

  // Uppehållstillstånd → Samhälle
  if (uppehållstillstånd && samhälle) {
    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      uppehållstillstånd.id,
      samhälle.id,
    );
  }
}
