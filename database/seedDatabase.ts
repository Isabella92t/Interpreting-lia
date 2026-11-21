import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

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

  if (!svenska || !engelska || !spanska) {
    throw new Error("Ett eller flera språk saknas i languages-tabellen.");
  }

  // =========================
  // Kategorier
  // Svenska / English / Español
  // Dessa hör till Svenska → Spanska
  // =========================

  const categories = [
    {
      sv: "Juridik",
      en: "Law",
      es: "Derecho",
    },
    {
      sv: "Samhällskunskap",
      en: "Social Studies",
      es: "Ciencias Sociales",
    },
    {
      sv: "Migration",
      en: "Migration",
      es: "Migración",
    },
    {
      sv: "Sjukvård",
      en: "Healthcare",
      es: "Salud",
    },
  ];

  for (const category of categories) {
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
      category.sv,
      category.sv,
      category.en,
      category.es,
      svenska.id,
      spanska.id,
    );

    // Om kategorin redan fanns från tidigare version,
    // se till att översättningarna är korrekta.
    await db.runAsync(
      `
      UPDATE tags
      SET
        name = ?,
        name_sv = ?,
        name_en = ?,
        name_es = ?
      WHERE id = (
        SELECT id
        FROM tags
        WHERE name = ?
          AND from_language_id = ?
          AND to_language_id = ?
        LIMIT 1
      )
      `,
      category.sv,
      category.sv,
      category.en,
      category.es,
      category.sv,
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
      category.sv,
      svenska.id,
      spanska.id,
    );

    if (tag) {
      tagIds[category.sv] = tag.id;
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

  // expo-file-system finns inte pa webben. Dar laser vi filen
  // med fetch istallet, som webblasaren har inbyggt.
  const csvText =
    Platform.OS === "web"
      ? await (await fetch(fileUri)).text()
      : await FileSystem.readAsStringAsync(fileUri, {
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
    ["Add fuel to the fire", "Hälla bensin på elden", "Echar leña al fuego"],
    [
      "Kill two birds with one stone",
      "Slå två flugor i en smäll",
      "Matar dos pájaros de un tiro",
    ],
    [
      "The last straw",
      "Droppen som fick bägaren att rinna över",
      "La gota que rebalsó el vaso",
    ],
    [
      "Easier said than done",
      "Lättare sagt än gjort",
      "Más fácil decirlo que hacerlo",
    ],
    ["Hit the nail on the head", "Slå huvudet på spiken", "Dar en el clavo"],
    [
      "Tar everyone with the same brush",
      "Dra alla över en kam",
      "Meter a todos en el mismo saco",
    ],
    ["Throw in the towel", "Kasta in handduken", "Tirar la toalla"],
  ];

  // Registrera att den nya idiomlistan bara ska införas en gång.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS seed_migrations (
      key TEXT PRIMARY KEY
    )
  `);

  await db.withExclusiveTransactionAsync(async (tx) => {
    const migrationKey = "idioms_seven_v1";

    const alreadyUpdated = await tx.getFirstAsync<{ key: string }>(
      "SELECT key FROM seed_migrations WHERE key = ?",
      migrationKey,
    );

    if (alreadyUpdated) return;

    // Ta bort enbart gamla idiom och deras översättningar.
    await tx.runAsync("DELETE FROM idiom_translations");
    await tx.runAsync("DELETE FROM idioms");

    for (const [en, sv, es] of idioms) {
      const inserted = await tx.runAsync(
        "INSERT INTO idioms (name) VALUES (?)",
        en,
      );

      const idiomId = inserted.lastInsertRowId;

      for (const [languageId, translation] of [
        [engelska.id, en],
        [svenska.id, sv],
        [spanska.id, es],
      ] as [number, string][]) {
        await tx.runAsync(
          `INSERT INTO idiom_translations
           (idiom_id, language_id, text)
           VALUES (?, ?, ?)`,
          idiomId,
          languageId,
          translation,
        );
      }
    }

    await tx.runAsync(
      "INSERT INTO seed_migrations (key) VALUES (?)",
      migrationKey,
    );
  });
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
