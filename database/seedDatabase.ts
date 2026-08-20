import type { SQLiteDatabase } from "expo-sqlite";

export async function seedDatabase(db: SQLiteDatabase) {
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
  // Kategorier
  // =========================

  await db.runAsync(
    "INSERT OR IGNORE INTO tags (name) VALUES (?)",
    "Juridik",
  );

  await db.runAsync(
    "INSERT OR IGNORE INTO tags (name) VALUES (?)",
    "Samhälle",
  );

  await db.runAsync(
    "INSERT OR IGNORE INTO tags (name) VALUES (?)",
    "Migration",
  );

  await db.runAsync(
    "INSERT OR IGNORE INTO tags (name) VALUES (?)",
    "Sjukvård",
  );

  // =========================
  // Ord
  // =========================

  const words = [
    // Befintliga ord
    "avtal",
    "domstol",
    "lag",
    "medborgarskap",
    "uppehållstillstånd",
    "asyl",
    "migrationsrätt",
    "navelsträng",
    "moderkaka",

    // Juridik
    "advokat",
    "dom",
    "vittne",
    "bevis",
    "rättegång",
    "domare",
    "åtal",
    "kontrakt",

    // Samhälle
    "kommun",
    "myndighet",
    "skatt",
    "arbete",
    "personnummer",
    "regering",
    "arbetsgivare",
    "arbetslöshet",

    // Migration
    "flykting",
    "visum",
    "gräns",
    "integration",
    "utvisning",
    "ansökan",
    "medborgare",
    "permanent uppehållstillstånd",

    // Sjukvård
    "läkare",
    "sjuksköterska",
    "patient",
    "medicin",
    "behandling",
    "diagnos",
    "symptom",
    "vårdcentral",
  ];

  for (const word of words) {
    await db.runAsync(
      "INSERT OR IGNORE INTO words (name) VALUES (?)",
      word,
    );
  }

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

  // =========================
  // Översättningar
  // =========================

  const translations = [
    // Befintliga
    ["avtal", "avtal", "agreement", "contrato"],
    ["domstol", "domstol", "court", "tribunal"],
    ["lag", "lag", "law", "ley"],
    ["medborgarskap", "medborgarskap", "citizenship", "ciudadanía"],
    [
      "uppehållstillstånd",
      "uppehållstillstånd",
      "residence permit",
      "permiso de residencia",
    ],
    ["asyl", "asyl", "asylum", "asilo"],
    [
      "migrationsrätt",
      "migrationsrätt",
      "migration law",
      "derecho de migración",
    ],
    [
      "navelsträng",
      "navelsträng",
      "umbilical cord",
      "cordón umbilical",
    ],
    ["moderkaka", "moderkaka", "placenta", "placenta"],

    // Juridik
    ["advokat", "advokat", "lawyer", "abogado"],
    ["dom", "dom", "judgment", "sentencia"],
    ["vittne", "vittne", "witness", "testigo"],
    ["bevis", "bevis", "evidence", "evidencia"],
    ["rättegång", "rättegång", "trial", "juicio"],
    ["domare", "domare", "judge", "juez"],
    ["åtal", "åtal", "prosecution", "acusación"],
    ["kontrakt", "kontrakt", "contract", "contrato"],

    // Samhälle
    ["kommun", "kommun", "municipality", "municipio"],
    ["myndighet", "myndighet", "authority", "autoridad"],
    ["skatt", "skatt", "tax", "impuesto"],
    ["arbete", "arbete", "work", "trabajo"],
    [
      "personnummer",
      "personnummer",
      "personal identity number",
      "número de identificación personal",
    ],
    ["regering", "regering", "government", "gobierno"],
    ["arbetsgivare", "arbetsgivare", "employer", "empleador"],
    ["arbetslöshet", "arbetslöshet", "unemployment", "desempleo"],

    // Migration
    ["flykting", "flykting", "refugee", "refugiado"],
    ["visum", "visum", "visa", "visado"],
    ["gräns", "gräns", "border", "frontera"],
    ["integration", "integration", "integration", "integración"],
    ["utvisning", "utvisning", "deportation", "expulsión"],
    ["ansökan", "ansökan", "application", "solicitud"],
    ["medborgare", "medborgare", "citizen", "ciudadano"],
    [
      "permanent uppehållstillstånd",
      "permanent uppehållstillstånd",
      "permanent residence permit",
      "permiso de residencia permanente",
    ],

    // Sjukvård
    ["läkare", "läkare", "doctor", "médico"],
    ["sjuksköterska", "sjuksköterska", "nurse", "enfermero"],
    ["patient", "patient", "patient", "paciente"],
    ["medicin", "medicin", "medicine", "medicamento"],
    ["behandling", "behandling", "treatment", "tratamiento"],
    ["diagnos", "diagnos", "diagnosis", "diagnóstico"],
    ["symptom", "symptom", "symptom", "síntoma"],
    ["vårdcentral", "vårdcentral", "health centre", "centro de salud"],
  ];

  for (const [wordName, sv, en, es] of translations) {
    const word = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM words WHERE name = ?",
      wordName,
    );

    if (!word) continue;

    if (svenska) {
      await db.runAsync(
        "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
        word.id,
        svenska.id,
        sv,
      );
    }

    if (engelska) {
      await db.runAsync(
        "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
        word.id,
        engelska.id,
        en,
      );
    }

    if (spanska) {
      await db.runAsync(
        "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
        word.id,
        spanska.id,
        es,
      );
    }
  }

  // =========================
  // Hämta kategori-ID
  // =========================

  const juridik = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM tags WHERE name = ?",
    "Juridik",
  );

  const samhälle = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM tags WHERE name = ?",
    "Samhälle",
  );

  const migration = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM tags WHERE name = ?",
    "Migration",
  );

  const sjukvård = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM tags WHERE name = ?",
    "Sjukvård",
  );

  // =========================
  // Hjälpfunktion för tags
  // =========================

  async function addTag(
    wordName: string,
    tagId: number | undefined,
  ) {
    if (!tagId) return;

    const word = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM words WHERE name = ?",
      wordName,
    );

    if (!word) return;

    await db.runAsync(
      "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
      word.id,
      tagId,
    );
  }

  // =========================
  // Juridik
  // =========================

  await addTag("avtal", juridik?.id);
  await addTag("domstol", juridik?.id);
  await addTag("lag", juridik?.id);
  await addTag("advokat", juridik?.id);
  await addTag("dom", juridik?.id);
  await addTag("vittne", juridik?.id);
  await addTag("bevis", juridik?.id);
  await addTag("rättegång", juridik?.id);
  await addTag("domare", juridik?.id);
  await addTag("åtal", juridik?.id);
  await addTag("kontrakt", juridik?.id);

  // =========================
  // Samhälle
  // =========================

  await addTag("avtal", samhälle?.id);
  await addTag("medborgarskap", samhälle?.id);
  await addTag("uppehållstillstånd", samhälle?.id);
  await addTag("kommun", samhälle?.id);
  await addTag("myndighet", samhälle?.id);
  await addTag("skatt", samhälle?.id);
  await addTag("arbete", samhälle?.id);
  await addTag("personnummer", samhälle?.id);
  await addTag("regering", samhälle?.id);
  await addTag("arbetsgivare", samhälle?.id);
  await addTag("arbetslöshet", samhälle?.id);

  // =========================
  // Migration
  // =========================

  await addTag("asyl", migration?.id);
  await addTag("migrationsrätt", migration?.id);
  await addTag("uppehållstillstånd", migration?.id);
  await addTag("flykting", migration?.id);
  await addTag("visum", migration?.id);
  await addTag("gräns", migration?.id);
  await addTag("integration", migration?.id);
  await addTag("utvisning", migration?.id);
  await addTag("ansökan", migration?.id);
  await addTag("medborgare", migration?.id);
  await addTag(
    "permanent uppehållstillstånd",
    migration?.id,
  );

  // =========================
  // Sjukvård
  // =========================

  await addTag("navelsträng", sjukvård?.id);
  await addTag("moderkaka", sjukvård?.id);
  await addTag("läkare", sjukvård?.id);
  await addTag("sjuksköterska", sjukvård?.id);
  await addTag("patient", sjukvård?.id);
  await addTag("medicin", sjukvård?.id);
  await addTag("behandling", sjukvård?.id);
  await addTag("diagnos", sjukvård?.id);
  await addTag("symptom", sjukvård?.id);
  await addTag("vårdcentral", sjukvård?.id);

  // =========================
  // Idiomer
  // =========================

  const idioms = [
    ["Break the ice", "Bryta isen", "Romper el hielo"],
    ["Piece of cake", "Enkelt som en plätt", "Pan comido"],
    [
      "Hit the nail on the head",
      "Slå huvudet på spiken",
      "Dar en el clavo",
    ],
    [
      "It's raining cats and dogs",
      "Det regnar väldigt mycket",
      "Llueve a cántaros",
    ],
    [
      "Under the weather",
      "Känna sig hängig",
      "Sentirse indispuesto",
    ],
  ];

  for (const [en, sv, es] of idioms) {
    await db.runAsync(
      "INSERT OR IGNORE INTO idioms (name) VALUES (?)",
      en,
    );

    const idiom = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM idioms WHERE name = ?",
      en,
    );

    if (!idiom) continue;

    if (engelska) {
      await db.runAsync(
        "INSERT OR IGNORE INTO idiom_translations (idiom_id, language_id, text) VALUES (?, ?, ?)",
        idiom.id,
        engelska.id,
        en,
      );
    }

    if (svenska) {
      await db.runAsync(
        "INSERT OR IGNORE INTO idiom_translations (idiom_id, language_id, text) VALUES (?, ?, ?)",
        idiom.id,
        svenska.id,
        sv,
      );
    }

    if (spanska) {
      await db.runAsync(
        "INSERT OR IGNORE INTO idiom_translations (idiom_id, language_id, text) VALUES (?, ?, ?)",
        idiom.id,
        spanska.id,
        es,
      );
    }
  }
}