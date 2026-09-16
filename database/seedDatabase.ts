import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import type { SQLiteDatabase } from "expo-sqlite";

// =========================
// Enkel CSV-parser
// Klarar även text inom "citattecken"
// =========================

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ";" && !insideQuotes) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        i++;
      }

      row.push(value.trim());

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }

      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  // Sista raden
  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());

    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

// =========================
// Seed database
// =========================

export async function seedDatabase(db: SQLiteDatabase) {
  console.log("🌱 Startar seed...");

  // =========================
  // Språk
  // =========================

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

  // =========================
  // Hämta språk-ID
  // =========================

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

  if (!svenska || !spanska) {
    throw new Error("Svenska eller Spanska saknas i languages-tabellen.");
  }

  // =========================
  // Kategorier
  // Dessa hör till Svenska → Spanska
  // =========================

  const categories = ["Juridik", "Samhällskunskap", "Migration", "Sjukvård"];

  for (const category of categories) {
    await db.runAsync(
      `
      INSERT OR IGNORE INTO tags (
        name,
        from_language_id,
        to_language_id
      )
      VALUES (?, ?, ?)
      `,
      category,
      svenska.id,
      spanska.id,
    );
  }

  // =========================
  // Hämta kategori-ID:n
  // =========================

  const tagIds: Record<string, number> = {};

  for (const category of categories) {
    const tag = await db.getFirstAsync<{ id: number }>(
      `
      SELECT id
      FROM tags
      WHERE name = ?
        AND from_language_id = ?
        AND to_language_id = ?
      `,
      category,
      svenska.id,
      spanska.id,
    );

    if (tag) {
      tagIds[category] = tag.id;
    }
  }

  // =========================
  // Läs CSV från assets
  // =========================

  const asset = Asset.fromModule(require("../assets/minaordtillapp.csv"));

  await asset.downloadAsync();

  const fileUri = asset.localUri ?? asset.uri;

  if (!fileUri) {
    throw new Error("Kunde inte hitta minaordtillapp.csv");
  }

  const csvText = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // =========================
  // Läs CSV-rader
  // =========================

  const rows = parseCSV(csvText);

  if (rows.length === 0) {
    throw new Error("minaordtillapp.csv verkar vara tom.");
  }

  // =========================
  // Läs rubriker
  // =========================

  const header = rows[0].map((item) =>
    item
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase(),
  );

  console.log("📄 CSV-rubriker:", header);

  const svenskaIndex = header.indexOf("svenska");
  const spanskaIndex = header.indexOf("spanska");
  const kategoriIndex = header.indexOf("kategori");

  if (svenskaIndex === -1 || spanskaIndex === -1 || kategoriIndex === -1) {
    throw new Error("CSV måste ha kolumnerna: Svenska, Spanska, Kategori");
  }

  // =========================
  // Importera alla ord
  // =========================

  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const sv = row[svenskaIndex]?.trim();
    const es = row[spanskaIndex]?.trim();
    const category = row[kategoriIndex]?.trim();

    // Hoppa över tomma/felaktiga rader
    if (!sv || !es || !category) {
      skipped++;
      continue;
    }

    // Kontrollera att kategorin finns
    const tagId = tagIds[category];

    if (!tagId) {
      console.warn(`⚠️ Hoppar över "${sv}" – okänd kategori: "${category}"`);
      skipped++;
      continue;
    }

    // =========================
    // Lägg in svenska ordet
    // =========================

    await db.runAsync("INSERT OR IGNORE INTO words (name) VALUES (?)", sv);

    // Hämta word-ID
    const word = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM words WHERE name = ?",
      sv,
    );

    if (!word) {
      skipped++;
      continue;
    }

    // =========================
    // Svenska
    // =========================

    await db.runAsync(
      `INSERT OR IGNORE INTO translations
       (word_id, language_id, text)
       VALUES (?, ?, ?)`,
      word.id,
      svenska.id,
      sv,
    );

    // =========================
    // Spanska
    // =========================

    await db.runAsync(
      `INSERT OR IGNORE INTO translations
       (word_id, language_id, text)
       VALUES (?, ?, ?)`,
      word.id,
      spanska.id,
      es,
    );

    // =========================
    // Koppla ordet till kategori
    // =========================

    await db.runAsync(
      `INSERT OR IGNORE INTO word_tags
       (word_id, tag_id)
       VALUES (?, ?)`,
      word.id,
      tagId,
    );

    imported++;
  }

  // =========================
  // Idiomer
  // =========================

  const idioms = [
    ["Break the ice", "Bryta isen", "Romper el hielo"],
    ["Piece of cake", "Enkelt som en plätt", "Pan comido"],
    ["Hit the nail on the head", "Slå huvudet på spiken", "Dar en el clavo"],
    [
      "It's raining cats and dogs",
      "Det regnar väldigt mycket",
      "Llueve a cántaros",
    ],
    ["Under the weather", "Känna sig hängig", "Sentirse indispuesto"],
  ];

  for (const [en, sv, es] of idioms) {
    await db.runAsync("INSERT OR IGNORE INTO idioms (name) VALUES (?)", en);

    const idiom = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM idioms WHERE name = ?",
      en,
    );

    if (!idiom) continue;

    if (engelska) {
      await db.runAsync(
        `INSERT OR IGNORE INTO idiom_translations
         (idiom_id, language_id, text)
         VALUES (?, ?, ?)`,
        idiom.id,
        engelska.id,
        en,
      );
    }

    await db.runAsync(
      `INSERT OR IGNORE INTO idiom_translations
       (idiom_id, language_id, text)
       VALUES (?, ?, ?)`,
      idiom.id,
      svenska.id,
      sv,
    );

    await db.runAsync(
      `INSERT OR IGNORE INTO idiom_translations
       (idiom_id, language_id, text)
       VALUES (?, ?, ?)`,
      idiom.id,
      spanska.id,
      es,
    );
  }

  // =========================
  // Kontroll
  // =========================

  const totalWords = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM words",
  );

  const totalTranslations = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM translations",
  );

  console.log("📚 Totalt antal ord:", totalWords?.count);
  console.log("🌍 Totalt antal översättningar:", totalTranslations?.count);
  console.log("📥 Importerade från CSV:", imported);
  console.log("⚠️ Hoppade över:", skipped);
  console.log("🌱 SEED KLAR");
}
