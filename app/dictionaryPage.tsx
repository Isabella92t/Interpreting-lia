import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { LanguagePicker } from "@/components/language-picker";
import { SearchBar } from "@/components/search-bar";
import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PAGE_TRANSLATIONS: Record<string, { en: string; es: string }> = {
  "Gå vidare och välj vilka ord som ska importeras": {
    en: "Continue to choose which words to import",
    es: "Continúa para elegir las palabras que quieres importar",
  },

  "Välj kategori": { en: "Choose category", es: "Elegir categoría" },
  "Importera från kategori": {
    en: "Import from category",
    es: "Importar desde una categoría",
  },
  "Välj vilken kategori du vill hämta ord från.": {
    en: "Choose a category to import words from.",
    es: "Elige una categoría de la que importar palabras.",
  },
  "Det finns inga andra kategorier att importera från.": {
    en: "There are no other categories to import from.",
    es: "No hay otras categorías desde las que importar.",
  },
  ord: { en: "words", es: "palabras" },
  "✓ Välj hela kategorin": {
    en: "✓ Select entire category",
    es: "✓ Seleccionar toda la categoría",
  },
  "☐ Välj vissa ord": {
    en: "☐ Select specific words",
    es: "☐ Seleccionar algunas palabras",
  },
  "Den här kategorin har inga ord.": {
    en: "This category has no words.",
    es: "Esta categoría no contiene palabras.",
  },
  "Markera orden du vill importera": {
    en: "Select the words you want to import",
    es: "Selecciona las palabras que quieres importar",
  },
  valda: { en: "selected", es: "seleccionadas" },
  "Importera valda": { en: "Import selected", es: "Importar seleccionadas" },
  "‹ Tillbaka": { en: "‹ Back", es: "‹ Volver" },
  "Import klart": { en: "Import complete", es: "Importación completada" },
  "Kunde inte hämta kategorierna.": {
    en: "Could not load the categories.",
    es: "No se pudieron cargar las categorías.",
  },
  "Kunde inte hämta importkategorierna.": {
    en: "Could not load import categories.",
    es: "No se pudieron cargar las categorías para importar.",
  },
  "Kunde inte läsa orden i kategorin.": {
    en: "Could not load the words in the category.",
    es: "No se pudieron cargar las palabras de la categoría.",
  },
  "Importen misslyckades. Försök igen.": {
    en: "Import failed. Please try again.",
    es: "La importación falló. Inténtalo de nuevo.",
  },
  "Vill du verkligen radera ordet?": {
    en: "Do you really want to delete this word?",
    es: "¿Seguro que quieres eliminar esta palabra?",
  },
  valfritt: { en: "optional", es: "opcional" },
  "Visa information om": {
    en: "Show information about",
    es: "Mostrar información sobre",
  },
  "Avsluta redigering": { en: "Finish editing", es: "Terminar edición" },
  "Aktivera redigering": { en: "Enable editing", es: "Activar edición" },
  "Växlar mellan kolumnvisning och visning under varandra": {
    en: "Switches between side-by-side and stacked views",
    es: "Alterna entre vista en columnas y vista vertical",
  },
  "Visa ord bredvid varandra": {
    en: "Show words side by side",
    es: "Mostrar palabras en columnas",
  },
  "Visa ord under varandra": {
    en: "Show words vertically",
    es: "Mostrar palabras en vertical",
  },
  "fler träffar": { en: "more results", es: "resultados más" },
  "Importera ord från en annan kategori": {
    en: "Import words from another category",
    es: "Importar palabras de otra categoría",
  },
  "Redigera ordet": { en: "Edit word", es: "Editar palabra" },
  Redigera: { en: "Edit", es: "Editar" },
  Klar: { en: "Done", es: "Listo" },
  Importera: { en: "Import", es: "Importar" },
  "Lägg till ord": { en: "Add word", es: "Añadir palabra" },
  "Redigera ord": { en: "Edit word", es: "Editar palabra" },
  "Information (valfritt)": {
    en: "Information (optional)",
    es: "Información (opcional)",
  },
  "Kategori (valfritt)": {
    en: "Category (optional)",
    es: "Categoría (opcional)",
  },
  Kategorier: { en: "Categories", es: "Categorías" },
  "Laddar...": { en: "Loading...", es: "Cargando..." },
  Övrigt: { en: "Other", es: "Otros" },
  "Radera ord?": { en: "Delete word?", es: "¿Eliminar palabra?" },
  Avbryt: { en: "Cancel", es: "Cancelar" },
  Radera: { en: "Delete", es: "Eliminar" },
  "Kunde inte lägga till ordet. Försök igen.": {
    en: "Could not add the word. Please try again.",
    es: "No se pudo añadir la palabra. Inténtalo de nuevo.",
  },
  "Kunde inte hämta kategorierna. Försök igen.": {
    en: "Could not load the categories. Please try again.",
    es: "No se pudieron cargar las categorías. Inténtalo de nuevo.",
  },
  "Fyll i både ord och översättning.": {
    en: "Enter both the word and its translation.",
    es: "Introduce la palabra y su traducción.",
  },
  "Språken kunde inte hittas.": {
    en: "The languages could not be found.",
    es: "No se encontraron los idiomas.",
  },
  "Kunde inte spara ändringarna. Försök igen.": {
    en: "Could not save changes. Please try again.",
    es: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
  },
  "Kunde inte radera ordet. Försök igen.": {
    en: "Could not delete the word. Please try again.",
    es: "No se pudo eliminar la palabra. Inténtalo de nuevo.",
  },
};

function pageText(key: string, language: string) {
  const entry = PAGE_TRANSLATIONS[key];
  return language === "en"
    ? (entry?.en ?? key)
    : language === "es"
      ? (entry?.es ?? key)
      : key;
}

const EDIT_PENCILS_KEY = "tolkappen:showEditPencils";
const MIN_SEARCH_LENGTH = 3;
const MAX_RESULTS = 3;

function startsWithSearch(text: string, query: string) {
  const normalizedText = text.toLowerCase().trim().replace(/\s+/g, " ");
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, " ");
  if (!normalizedQuery) return false;
  if (normalizedQuery.includes(" "))
    return normalizedText.includes(normalizedQuery);
  return normalizedText
    .split(/[\s/,()!?;:]+/)
    .some((word) => word.startsWith(normalizedQuery));
}

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

type WordCategory = {
  id: number;
  name: string;
  name_sv: string | null;
  name_en: string | null;
  name_es: string | null;
};

type Translation = {
  word_id: number;
  text_from: string;
  text_to: string;
  information: string | null;
};

/** Liten diskret symbol: två deltagare och en tolk med namnbricka. */
function InterpreterLogo() {
  return (
    <View
      style={styles.logo}
      accessibilityLabel="TolkAppen – tre personer och tolk med namnbricka"
    >
      <View style={[styles.logoPerson, styles.logoSideLeft]}>
        <View style={styles.logoSideHead} />
        <View style={styles.logoSideBody} />
      </View>
      <View style={[styles.logoPerson, styles.logoSideRight]}>
        <View style={styles.logoSideHead} />
        <View style={styles.logoSideBody} />
      </View>
      <View style={styles.logoCenter}>
        <View style={styles.logoCenterHead} />
        <View style={styles.logoCenterBody} />
        <View style={styles.logoStrapLeft} />
        <View style={styles.logoStrapRight} />
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText} numberOfLines={1}>
            TolkAppen
          </Text>
          <View style={styles.logoBadgeTail} />
        </View>
      </View>
    </View>
  );
}

export default function DictionaryPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { t, language } = useUiLanguage();
  const ui = (key: string) => pageText(key, language);

  const { from, to, category } = useLocalSearchParams<{
    from?: string;
    to?: string;
    category?: string;
  }>();

  // Det interna kategorinamnet används fortfarande i SQL-frågor.
  // Endast den synliga rubriken översätts.
  const [categoryTitle, setCategoryTitle] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!category) {
      setCategoryTitle(null);
      return;
    }

    // Visa det interna namnet tills den översatta rubriken har hämtats.
    setCategoryTitle(null);
    (async () => {
      try {
        const row = await db.getFirstAsync<WordCategory>(
          "SELECT id, name, name_sv, name_en, name_es FROM tags WHERE name = ?",
          category,
        );
        if (!active) return;
        const translatedName =
          language === "sv"
            ? row?.name_sv
            : language === "en"
              ? row?.name_en
              : row?.name_es;
        setCategoryTitle(
          translatedName?.trim() ||
            row?.name_en?.trim() ||
            row?.name_sv?.trim() ||
            row?.name?.trim() ||
            category,
        );
      } catch (error) {
        console.error("Kunde inte läsa kategorirubrik:", error);
        if (active) setCategoryTitle(category);
      }
    })();

    return () => {
      active = false;
    };
  }, [db, category, language]);

  const [translations, setTranslations] = useState<Translation[]>([]);
  const [displayMode, setDisplayMode] = useState<"stacked" | "side">("stacked");
  const [displayReady, setDisplayReady] = useState(false);
  const [showEditPencils, setShowEditPencils] = useState(false);
  // Gemensam inställning för alla sidor som använder samma lagringsnyckel.
  // Läs om inställningen när sidan får fokus efter navigering.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      AsyncStorage.getItem(EDIT_PENCILS_KEY)
        .then((value) => {
          if (active) setShowEditPencils(value === "true");
        })
        .catch((error) =>
          console.error("Kunde inte läsa redigeringsläge:", error),
        );
      return () => {
        active = false;
      };
    }, []),
  );

  async function toggleEditPencils() {
    const next = !showEditPencils;
    setShowEditPencils(next);
    try {
      await AsyncStorage.setItem(EDIT_PENCILS_KEY, String(next));
    } catch (error) {
      console.error("Kunde inte spara redigeringsläge:", error);
    }
  }

  const displayKey = `dictionary:${String(from ?? "").toLowerCase()}:${String(to ?? "").toLowerCase()}:${category ?? "__all__"}`;
  const [searchText, setSearchText] = useState("");
  const [selectedInformation, setSelectedInformation] = useState<{
    wordId: number;
    location: "results" | "list";
  } | null>(null);

  const [editingWord, setEditingWord] = useState<Translation | null>(null);
  const [editTextFrom, setEditTextFrom] = useState("");
  const [editTextTo, setEditTextTo] = useState("");
  const [editInformation, setEditInformation] = useState("");
  const [editError, setEditError] = useState("");
  const [editCategories, setEditCategories] = useState<WordCategory[]>([]);
  const [editCategoryIds, setEditCategoryIds] = useState<number[]>([]);
  const [showEditCategories, setShowEditCategories] = useState(false);
  const [loadingEditCategories, setLoadingEditCategories] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingWord, setDeletingWord] = useState(false);

  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [newThirdTranslation, setNewThirdTranslation] = useState("");
  const [newInformation, setNewInformation] = useState("");
  const [wordCategories, setWordCategories] = useState<WordCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [addError, setAddError] = useState("");
  const [addingWord, setAddingWord] = useState(false);

  // Importera befintliga ord till den öppna kategorin utan att kopiera orden.
  const [showCategoryImport, setShowCategoryImport] = useState(false);
  const [importSources, setImportSources] = useState<WordCategory[]>([]);
  const [importSource, setImportSource] = useState<WordCategory | null>(null);
  const [importWords, setImportWords] = useState<Translation[]>([]);
  const [importSelectedIds, setImportSelectedIds] = useState<number[]>([]);
  const [importStep, setImportStep] = useState<"categories" | "mode" | "words">(
    "categories",
  );
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState("");

  useEffect(() => {
    loadTranslations();
  }, [from, to, category]);

  useEffect(() => {
    let active = true;
    setDisplayReady(false);
    setDisplayMode("stacked");
    (async () => {
      try {
        await db.execAsync(`CREATE TABLE IF NOT EXISTS display_preferences (
          page_key TEXT PRIMARY KEY,
          display_mode TEXT NOT NULL
        )`);
        const row = await db.getFirstAsync<{ display_mode: string }>(
          "SELECT display_mode FROM display_preferences WHERE page_key = ?",
          displayKey,
        );
        if (active)
          setDisplayMode(row?.display_mode === "side" ? "side" : "stacked");
      } catch (error) {
        console.error("Kunde inte läsa visningsinställningen:", error);
      } finally {
        if (active) setDisplayReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [db, displayKey]);

  async function toggleDisplayMode() {
    if (!displayReady) return;
    const next = displayMode === "stacked" ? "side" : "stacked";
    setDisplayMode(next);
    try {
      await db.runAsync(
        "INSERT OR REPLACE INTO display_preferences (page_key, display_mode) VALUES (?, ?)",
        displayKey,
        next,
      );
    } catch (error) {
      console.error("Kunde inte spara visningsinställningen:", error);
    }
  }

  async function loadTranslations() {
    const selectedFrom = String(from ?? "").toLowerCase();
    const selectedTo = String(to ?? "").toLowerCase();

    const fromLanguage = languageNames[selectedFrom];
    const toLanguage = languageNames[selectedTo];

    if (!fromLanguage || !toLanguage) {
      return;
    }

    let result: Translation[];

    if (category) {
      result = await db.getAllAsync<Translation>(
        `
        SELECT DISTINCT
          from_translation.text AS text_from,
          to_translation.text AS text_to,
          from_translation.word_id,
          words.information AS information
        FROM translations AS from_translation
        INNER JOIN words ON words.id = from_translation.word_id
        INNER JOIN translations AS to_translation
          ON from_translation.word_id = to_translation.word_id
        INNER JOIN languages AS from_language
          ON from_translation.language_id = from_language.id
        INNER JOIN languages AS to_language
          ON to_translation.language_id = to_language.id
        INNER JOIN word_tags
          ON from_translation.word_id = word_tags.word_id
        INNER JOIN tags
          ON word_tags.tag_id = tags.id
        WHERE from_language.name = ?
          AND to_language.name = ?
          AND tags.name = ?
        ORDER BY LOWER(text_from) ASC
        `,
        fromLanguage,
        toLanguage,
        category,
      );
    } else {
      result = await db.getAllAsync<Translation>(
        `
        SELECT DISTINCT
          from_translation.text AS text_from,
          to_translation.text AS text_to,
          from_translation.word_id,
          words.information AS information
        FROM translations AS from_translation
        INNER JOIN words ON words.id = from_translation.word_id
        INNER JOIN translations AS to_translation
          ON to_translation.word_id = from_translation.word_id
        INNER JOIN languages AS from_language
          ON from_translation.language_id = from_language.id
        INNER JOIN languages AS to_language
          ON to_translation.language_id = to_language.id
        WHERE from_language.name = ?
          AND to_language.name = ?
        ORDER BY LOWER(text_from) ASC
        `,
        fromLanguage,
        toLanguage,
      );
    }

    setTranslations(result);
  }

  function importCategoryName(item: WordCategory) {
    const translated =
      language === "sv"
        ? item.name_sv
        : language === "en"
          ? item.name_en
          : item.name_es;
    return (
      translated?.trim() ||
      item.name_en?.trim() ||
      item.name_sv?.trim() ||
      item.name
    );
  }

  async function openCategoryImport() {
    if (!category) return;
    setImportSource(null);
    setImportWords([]);
    setImportSelectedIds([]);
    setImportStep("categories");
    setImportError("");
    setShowCategoryImport(true);
    try {
      const rows = await db.getAllAsync<WordCategory>(
        "SELECT id, name, name_sv, name_en, name_es FROM tags WHERE name <> ? AND name <> 'Övrigt' ORDER BY LOWER(name)",
        category,
      );
      setImportSources(rows);
    } catch (error) {
      console.error("Kunde inte hämta importkategorier:", error);
      setImportError(ui("Kunde inte hämta kategorierna."));
    }
  }

  async function selectImportSource(source: WordCategory) {
    setImportSource(source);
    setImportWords([]);
    setImportSelectedIds([]);
    setImportError("");
    setImportBusy(true);
    try {
      const fromName = languageNames[String(from ?? "").toLowerCase()];
      const toName = languageNames[String(to ?? "").toLowerCase()];
      const rows = await db.getAllAsync<Translation>(
        `SELECT DISTINCT w.id AS word_id,
          COALESCE(tf.text, w.name) AS text_from,
          COALESCE(tt.text, '') AS text_to,
          w.information AS information
         FROM words w
         INNER JOIN word_tags wt ON wt.word_id = w.id
         LEFT JOIN translations tf ON tf.word_id = w.id
           AND tf.language_id = (SELECT id FROM languages WHERE name = ?)
         LEFT JOIN translations tt ON tt.word_id = w.id
           AND tt.language_id = (SELECT id FROM languages WHERE name = ?)
         WHERE wt.tag_id = ?
         ORDER BY LOWER(text_from)`,
        fromName,
        toName,
        source.id,
      );
      setImportWords(rows);
      setImportStep("mode");
    } catch (error) {
      console.error("Kunde inte läsa ord för import:", error);
      setImportError(ui("Kunde inte läsa orden i kategorin."));
    } finally {
      setImportBusy(false);
    }
  }

  async function importCategoryWords(wordIds: number[]) {
    if (!category || !importSource || importBusy) return;
    setImportBusy(true);
    setImportError("");
    try {
      const destination = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM tags WHERE name = ?",
        category,
      );
      if (!destination) throw new Error("Målkategorin finns inte längre");
      const existing = await db.getAllAsync<{ word_id: number }>(
        "SELECT word_id FROM word_tags WHERE tag_id = ?",
        destination.id,
      );
      const existingIds = new Set(existing.map((row) => row.word_id));
      const idsToAdd = [...new Set(wordIds)].filter(
        (id) => !existingIds.has(id),
      );
      await db.withTransactionAsync(async () => {
        for (const wordId of idsToAdd) {
          await db.runAsync(
            "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
            wordId,
            destination.id,
          );
        }
      });
      setShowCategoryImport(false);
      await loadTranslations();
      Alert.alert(
        ui("Import klart"),
        language === "es"
          ? `${idsToAdd.length} palabras añadidas a la categoría.${wordIds.length - idsToAdd.length > 0 ? ` ${wordIds.length - idsToAdd.length} ya existían.` : ""}`
          : language === "en"
            ? `${idsToAdd.length} words added to the category.${wordIds.length - idsToAdd.length > 0 ? ` ${wordIds.length - idsToAdd.length} already existed.` : ""}`
            : `${idsToAdd.length} ord lades till i kategorin.${wordIds.length - idsToAdd.length > 0 ? ` ${wordIds.length - idsToAdd.length} fanns redan.` : ""}`,
      );
    } catch (error) {
      console.error("Kunde inte importera ord:", error);
      setImportError(ui("Importen misslyckades. Försök igen."));
    } finally {
      setImportBusy(false);
    }
  }

  async function openAddWord() {
    setNewWord("");
    setNewTranslation("");
    setNewThirdTranslation("");
    setNewInformation("");
    setAddError("");
    setSelectedCategoryIds([]);
    setShowAddWord(true);
    try {
      const result = await db.getAllAsync<WordCategory>(
        `SELECT id, name, name_sv, name_en, name_es
         FROM tags
         ORDER BY LOWER(name)`,
      );
      setWordCategories(result);
      const currentCategory = result.find((item) => item.name === category);
      if (currentCategory) setSelectedCategoryIds([currentCategory.id]);
    } catch (error) {
      console.error("Failed to load categories:", error);
      setAddError(ui("Kunde inte hämta kategorierna."));
    }
  }

  function closeAddWord() {
    if (addingWord) return;
    setShowAddWord(false);
    setAddError("");
  }

  async function addWord() {
    if (addingWord) return;
    if (!newWord.trim() || !newTranslation.trim()) {
      setAddError(ui("Fyll i både ord och översättning."));
      return;
    }
    setAddingWord(true);
    setAddError("");
    try {
      const fromCode = String(from ?? "").toLowerCase();
      const toCode = String(to ?? "").toLowerCase();
      const thirdCode = Object.keys(languageNames).find(
        (code) => code !== fromCode && code !== toCode,
      );
      const fromName = languageNames[fromCode];
      const toName = languageNames[toCode];
      if (!fromName || !toName || !thirdCode || fromCode === toCode) {
        setAddError(ui("Språken kunde inte hittas."));
        return;
      }
      const fromRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM languages WHERE name = ?",
        fromName,
      );
      const toRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM languages WHERE name = ?",
        toName,
      );
      const thirdRow = newThirdTranslation.trim()
        ? await db.getFirstAsync<{ id: number }>(
            "SELECT id FROM languages WHERE name = ?",
            languageNames[thirdCode],
          )
        : null;
      if (!fromRow || !toRow || (newThirdTranslation.trim() && !thirdRow)) {
        setAddError(ui("Språken kunde inte hittas."));
        return;
      }
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "INSERT OR IGNORE INTO words (name) VALUES (?)",
          newWord.trim(),
        );
        const wordRow = await db.getFirstAsync<{ id: number }>(
          "SELECT id FROM words WHERE name = ?",
          newWord.trim(),
        );
        if (!wordRow) throw new Error("Word could not be found after insert");
        await db.runAsync(
          "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
          wordRow.id,
          fromRow.id,
          newWord.trim(),
        );
        await db.runAsync(
          "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
          wordRow.id,
          toRow.id,
          newTranslation.trim(),
        );
        if (thirdRow && newThirdTranslation.trim()) {
          await db.runAsync(
            "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
            wordRow.id,
            thirdRow.id,
            newThirdTranslation.trim(),
          );
        }
        if (newInformation.trim()) {
          await db.runAsync(
            "UPDATE words SET information = ? WHERE id = ?",
            newInformation.trim(),
            wordRow.id,
          );
        }
        let ids = selectedCategoryIds;
        if (ids.length === 0) {
          const other = wordCategories.find((item) => item.name === "Övrigt");
          if (other) ids = [other.id];
        }
        for (const tagId of ids) {
          await db.runAsync(
            "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
            wordRow.id,
            tagId,
          );
        }
      });
      setShowAddWord(false);
      await loadTranslations();
    } catch (error) {
      console.error("Failed to add word:", error);
      setAddError(ui("Kunde inte lägga till ordet. Försök igen."));
    } finally {
      setAddingWord(false);
    }
  }

  async function openEditWord(item: Translation) {
    setEditError("");
    setEditTextFrom(item.text_from);
    setEditTextTo(item.text_to);
    setEditInformation(item.information ?? "");
    setShowEditCategories(false);
    setEditCategories([]);
    setEditCategoryIds([]);
    setLoadingEditCategories(true);
    setEditingWord(item);
    try {
      const [categories, assigned] = await Promise.all([
        db.getAllAsync<WordCategory>(
          "SELECT id, name, name_sv, name_en, name_es FROM tags ORDER BY LOWER(name)",
        ),
        db.getAllAsync<{ tag_id: number }>(
          "SELECT tag_id FROM word_tags WHERE word_id = ?",
          item.word_id,
        ),
      ]);
      setEditCategories(categories);
      setEditCategoryIds(assigned.map((row) => row.tag_id));
    } catch (error) {
      console.error("Kunde inte läsa ordets kategorier:", error);
      setEditError(ui("Kunde inte hämta kategorierna. Försök igen."));
    } finally {
      setLoadingEditCategories(false);
    }
  }

  function resetEditWord() {
    setEditingWord(null);
    setEditError("");
    setEditTextFrom("");
    setEditTextTo("");
    setEditInformation("");
    setEditCategories([]);
    setEditCategoryIds([]);
    setShowEditCategories(false);
  }

  function closeEditWord() {
    if (savingEdit || deletingWord) return;
    resetEditWord();
  }

  async function saveEditedWord() {
    if (!editingWord || savingEdit || deletingWord || loadingEditCategories)
      return;
    const fromLanguage = languageNames[String(from ?? "").toLowerCase()];
    const toLanguage = languageNames[String(to ?? "").toLowerCase()];
    if (!fromLanguage || !toLanguage) {
      setEditError(ui("Språken kunde inte hittas."));
      return;
    }
    if (!editTextFrom.trim() || !editTextTo.trim()) {
      setEditError(ui("Fyll i både ord och översättning."));
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      const fromLanguageRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM languages WHERE name = ?",
        fromLanguage,
      );
      const toLanguageRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM languages WHERE name = ?",
        toLanguage,
      );
      if (!fromLanguageRow || !toLanguageRow) {
        setEditError(ui("Språken kunde inte hittas."));
        return;
      }
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "UPDATE translations SET text = ? WHERE word_id = ? AND language_id = ?",
          editTextFrom.trim(),
          editingWord.word_id,
          fromLanguageRow.id,
        );
        await db.runAsync(
          "UPDATE translations SET text = ? WHERE word_id = ? AND language_id = ?",
          editTextTo.trim(),
          editingWord.word_id,
          toLanguageRow.id,
        );
        await db.runAsync(
          "UPDATE words SET information = ? WHERE id = ?",
          editInformation.trim() || null,
          editingWord.word_id,
        );
        // Uppdatera ordets kategorier i samma transaktion som övriga ändringar.
        await db.runAsync(
          "DELETE FROM word_tags WHERE word_id = ?",
          editingWord.word_id,
        );
        const otherCategory = editCategories.find(
          (item) => item.name === "Övrigt",
        );
        const chosenIds = editCategoryIds.filter(
          (id) => id !== otherCategory?.id,
        );
        const idsToSave =
          chosenIds.length > 0
            ? chosenIds
            : otherCategory
              ? [otherCategory.id]
              : [];
        for (const tagId of idsToSave) {
          await db.runAsync(
            "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
            editingWord.word_id,
            tagId,
          );
        }
      });
      resetEditWord();
      await loadTranslations();
    } catch (error) {
      console.error("Failed to save word:", error);
      setEditError(ui("Kunde inte spara ändringarna. Försök igen."));
    } finally {
      setSavingEdit(false);
    }
  }

  function confirmDeleteWord() {
    if (!editingWord || savingEdit || deletingWord) return;
    Alert.alert(
      ui("Radera ord?"),
      `${ui("Vill du verkligen radera ordet?")} ”${editingWord.text_from}”`,
      [
        { text: ui("Avbryt"), style: "cancel" },
        {
          text: ui("Radera"),
          style: "destructive",
          onPress: () => {
            void deleteWord();
          },
        },
      ],
    );
  }

  async function deleteWord() {
    if (!editingWord || savingEdit || deletingWord) return;
    const wordId = editingWord.word_id;
    setDeletingWord(true);
    setEditError("");
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync("DELETE FROM word_tags WHERE word_id = ?", wordId);
        await db.runAsync("DELETE FROM translations WHERE word_id = ?", wordId);
        await db.runAsync("DELETE FROM words WHERE id = ?", wordId);
      });
      resetEditWord();
      await loadTranslations();
    } catch (error) {
      console.error("Failed to delete word:", error);
      setEditError(ui("Kunde inte radera ordet. Försök igen."));
    } finally {
      setDeletingWord(false);
    }
  }

  const normalizedSearch = searchText.trim().toLowerCase();
  const hasEnoughLetters = normalizedSearch.length >= MIN_SEARCH_LENGTH;

  // Samma söklogik som på secondPage, även för sökning på översättningen.
  const searchResults = hasEnoughLetters
    ? translations
        .filter(
          (item) =>
            startsWithSearch(item.text_from, normalizedSearch) ||
            startsWithSearch(item.text_to, normalizedSearch),
        )
        .map((item) => {
          const fromMatches = startsWithSearch(
            item.text_from,
            normalizedSearch,
          );
          const toMatches = startsWithSearch(item.text_to, normalizedSearch);
          return toMatches && !fromMatches
            ? { ...item, text_from: item.text_to, text_to: item.text_from }
            : item;
        })
    : [];

  const filteredTranslations = hasEnoughLetters
    ? searchResults
    : translations
        .filter(() => normalizedSearch.length === 0)
        .sort((a, b) =>
          a.text_from.localeCompare(b.text_from, "sv", { sensitivity: "base" }),
        );

  function renderInfoPopup(item: Translation, location: "results" | "list") {
    if (
      selectedInformation?.wordId !== item.word_id ||
      selectedInformation.location !== location
    ) {
      return null;
    }

    return (
      <View
        style={styles.inlineInfoPopup}
        onTouchEnd={(event) => event.stopPropagation()}
      >
        <ScrollView
          style={styles.inlineInfoScroll}
          contentContainerStyle={styles.inlineInfoScrollContent}
          nestedScrollEnabled
        >
          <Text style={styles.informationBody}>{item.information}</Text>
        </ScrollView>
      </View>
    );
  }

  function renderInfoButton(item: Translation, location: "results" | "list") {
    if (!item.information?.trim()) return null;
    return (
      <TouchableOpacity
        style={styles.infoButton}
        onPressIn={(event) => event.stopPropagation()}
        onPress={() =>
          setSelectedInformation((current) =>
            current?.wordId === item.word_id && current.location === location
              ? null
              : { wordId: item.word_id, location },
          )
        }
        accessibilityRole="button"
        accessibilityLabel={`${ui("Visa information om")} ${item.text_from}`}
        hitSlop={6}
      >
        <FontAwesome name="info-circle" size={15} color="#285F9D" />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
      onTouchEnd={() => {
        if (selectedInformation) setSelectedInformation(null);
      }}
    >
      <View style={styles.topRow}>
        <BackButton
          onPress={() =>
            router.dismissTo({
              pathname: "/secondPage",
              params: { from, to },
            })
          }
        />

        <LanguagePicker />
      </View>
      <Text style={styles.title}>
        {category ? (categoryTitle ?? category) : t("dictionary")}
      </Text>

      <Text style={styles.subtitle}>
        {languageNames[String(from ?? "").toLowerCase()]} →{" "}
        {languageNames[String(to ?? "").toLowerCase()]} ·{" "}
        {filteredTranslations.length} {t("words")}
      </Text>

      <View style={styles.displayModeBar}>
        <TouchableOpacity
          style={[
            styles.displayModeButton,
            showEditPencils && styles.editModeActive,
          ]}
          onPress={() => {
            void toggleEditPencils();
          }}
          accessibilityRole="button"
          accessibilityLabel={
            showEditPencils
              ? ui("Avsluta redigering")
              : ui("Aktivera redigering")
          }
          accessibilityState={{ selected: showEditPencils }}
        >
          <FontAwesome name="pencil" size={13} color="#71859B" />
          <Text style={styles.displayModeLabel}>
            {showEditPencils ? ui("Klar") : ui("Redigera")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.displayModeButton}
          onPress={() => {
            void toggleDisplayMode();
          }}
          disabled={!displayReady}
          accessibilityHint={ui(
            "Växlar mellan kolumnvisning och visning under varandra",
          )}
          accessibilityRole="button"
          accessibilityLabel={
            displayMode === "stacked"
              ? ui("Visa ord bredvid varandra")
              : ui("Visa ord under varandra")
          }
        >
          <FontAwesome
            name={displayMode === "stacked" ? "columns" : "bars"}
            size={14}
            color="#71859B"
          />
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchText}
        onChangeText={(value) => {
          setSearchText(value);
          setSelectedInformation(null);
        }}
        style={styles.search}
      />

      {searchText.trim().length > 0 && !hasEnoughLetters && (
        <Text style={styles.searchHint}>{t("minThreeLetters")}</Text>
      )}

      {hasEnoughLetters && (
        <View style={styles.searchResults}>
          {searchResults.length === 0 ? (
            <Text style={styles.empty}>{t("noMatches")}</Text>
          ) : (
            <>
              {searchResults.slice(0, MAX_RESULTS).map((item) => (
                <View key={item.word_id}>
                  <View style={styles.searchResultRow}>
                    <View
                      style={[
                        styles.searchResultText,
                        displayMode === "side" && styles.sideTextRow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.word,
                          displayMode === "side" && styles.sideColumn,
                        ]}
                      >
                        {item.text_from}
                      </Text>
                      <Text
                        style={[
                          styles.translation,
                          displayMode === "side" &&
                            styles.sideColumnTranslation,
                        ]}
                      >
                        {item.text_to}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.rowActions,
                        !showEditPencils && styles.actionsWithoutPencil,
                      ]}
                    >
                      <View style={styles.infoSlot}>
                        {renderInfoButton(item, "results")}
                      </View>
                      {showEditPencils && (
                        <TouchableOpacity
                          onPress={() => openEditWord(item)}
                          style={styles.editButton}
                          hitSlop={6}
                          accessibilityRole="button"
                          accessibilityLabel={`${ui("Redigera ordet")} ${item.text_from}`}
                        >
                          <FontAwesome
                            name="pencil"
                            size={12}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  {renderInfoPopup(item, "results")}
                </View>
              ))}
              {searchResults.length > MAX_RESULTS && (
                <Text style={styles.moreResults}>
                  + {searchResults.length - MAX_RESULTS} {ui("fler träffar")}
                </Text>
              )}
            </>
          )}
        </View>
      )}

      <FlatList
        data={
          hasEnoughLetters
            ? searchResults.slice(MAX_RESULTS)
            : filteredTranslations
        }
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => String(item.word_id)}
        ListHeaderComponent={
          displayMode === "side" && filteredTranslations.length > 0 ? (
            <View style={styles.columnHeadings}>
              <Text style={styles.columnHeading}>
                {languageNames[String(from ?? "").toLowerCase()]}
              </Text>
              <Text style={styles.columnHeading}>
                {languageNames[String(to ?? "").toLowerCase()]}
              </Text>
              <View
                style={[
                  styles.columnActionsSpace,
                  !showEditPencils && styles.actionsWithoutPencil,
                ]}
              />
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View>
            {displayMode === "stacked" &&
              !hasEnoughLetters &&
              !normalizedSearch &&
              (index === 0 ||
                item.text_from.charAt(0).toLocaleUpperCase() !==
                  filteredTranslations[index - 1]?.text_from
                    .charAt(0)
                    .toLocaleUpperCase()) && (
                <Text style={styles.letterHeading}>
                  {item.text_from.charAt(0).toLocaleUpperCase()}
                </Text>
              )}
            <View style={styles.row}>
              {displayMode === "side" ? (
                <View style={styles.wordRow}>
                  <Text style={[styles.word, styles.sideColumn]}>
                    {item.text_from}
                  </Text>
                  <Text
                    style={[styles.translation, styles.sideColumnTranslation]}
                  >
                    {item.text_to}
                  </Text>
                  <View
                    style={[
                      styles.rowActions,
                      !showEditPencils && styles.actionsWithoutPencil,
                    ]}
                  >
                    <View style={styles.infoSlot}>
                      {renderInfoButton(item, "list")}
                    </View>
                    {showEditPencils && (
                      <TouchableOpacity
                        onPress={() => openEditWord(item)}
                        style={styles.editButton}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={`${ui("Redigera ordet")} ${item.text_from}`}
                      >
                        <FontAwesome name="pencil" size={12} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.wordRow}>
                    <Text style={styles.word}>{item.text_from}</Text>
                    <View
                      style={[
                        styles.rowActions,
                        !showEditPencils && styles.actionsWithoutPencil,
                      ]}
                    >
                      <View style={styles.infoSlot}>
                        {renderInfoButton(item, "list")}
                      </View>
                      {showEditPencils && (
                        <TouchableOpacity
                          onPress={() => openEditWord(item)}
                          style={styles.editButton}
                          hitSlop={6}
                          accessibilityRole="button"
                          accessibilityLabel={`${ui("Redigera ordet")} ${item.text_from}`}
                        >
                          <FontAwesome
                            name="pencil"
                            size={12}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={styles.translation}>{item.text_to}</Text>
                </>
              )}
              {renderInfoPopup(item, "list")}
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          !hasEnoughLetters && !searchText.trim() ? (
            <Text style={styles.empty}>{t("noWordsYet")}</Text>
          ) : null
        }
      />

      <View style={styles.categoryBottomActions}>
        {!!category && (
          <TouchableOpacity
            style={styles.importCategoryButton}
            onPress={() => {
              void openCategoryImport();
            }}
            accessibilityRole="button"
            accessibilityLabel={ui("Importera ord från en annan kategori")}
          >
            <FontAwesome name="download" size={14} color="#285F9D" />
            <Text style={styles.importCategoryButtonText}>
              {ui("Importera")}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.addWordPlusButton}
          onPress={() => {
            void openAddWord();
          }}
          accessibilityRole="button"
          accessibilityLabel={t("addWord")}
          activeOpacity={0.8}
        >
          <Text style={styles.addWordPlusText}>+</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCategoryImport}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!importBusy) setShowCategoryImport(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <TouchableOpacity
              onPress={() => {
                if (!importBusy) setShowCategoryImport(false);
              }}
              style={styles.closeModalButton}
              disabled={importBusy}
            >
              <Text style={styles.closeModalText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.editTitle}>
              {ui("Importera från kategori")}
            </Text>
            {importStep === "categories" && (
              <>
                <Text style={styles.importHint}>
                  {ui("Välj vilken kategori du vill hämta ord från.")}
                </Text>
                <View style={styles.importListFrame}>
                  <ScrollView
                    style={styles.importScroll}
                    contentContainerStyle={styles.importScrollContent}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    persistentScrollbar
                  >
                    {importSources.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.importCategoryRow,
                          index < importSources.length - 1 &&
                            styles.importCategoryDivider,
                        ]}
                        onPress={() => {
                          void selectImportSource(item);
                        }}
                        disabled={importBusy}
                        accessibilityRole="button"
                        accessibilityLabel={`${ui("Välj kategori")}: ${importCategoryName(item)}`}
                        accessibilityHint={ui(
                          "Gå vidare och välj vilka ord som ska importeras",
                        )}
                      >
                        <View style={styles.importCategoryLeft}>
                          <FontAwesome
                            name="folder-o"
                            size={16}
                            color="#7593B0"
                          />
                          <Text
                            style={styles.importCategoryName}
                            numberOfLines={2}
                          >
                            {importCategoryName(item)}
                          </Text>
                        </View>
                        <FontAwesome
                          name="chevron-right"
                          size={12}
                          color="#A0B0C1"
                        />
                      </TouchableOpacity>
                    ))}
                    {importSources.length === 0 && (
                      <Text style={styles.importEmpty}>
                        {ui(
                          "Det finns inga andra kategorier att importera från.",
                        )}
                      </Text>
                    )}
                  </ScrollView>
                </View>
              </>
            )}
            {importStep === "mode" && importSource && (
              <>
                <Text style={styles.importHint}>
                  {importCategoryName(importSource)} · {importWords.length}{" "}
                  {ui("ord")}
                </Text>
                <TouchableOpacity
                  style={styles.addCategoryChoice}
                  disabled={importBusy || importWords.length === 0}
                  onPress={() => {
                    void importCategoryWords(
                      importWords.map((item) => item.word_id),
                    );
                  }}
                >
                  <Text style={styles.addCategoryChoiceText}>
                    {ui("✓ Välj hela kategorin")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addCategoryChoice}
                  disabled={importBusy || importWords.length === 0}
                  onPress={() => setImportStep("words")}
                >
                  <Text style={styles.addCategoryChoiceText}>
                    {ui("☐ Välj vissa ord")}
                  </Text>
                </TouchableOpacity>
                {importWords.length === 0 && (
                  <Text style={styles.importHint}>
                    {ui("Den här kategorin har inga ord.")}
                  </Text>
                )}
              </>
            )}
            {importStep === "words" && (
              <>
                <Text style={styles.importHint}>
                  {ui("Markera orden du vill importera")} (
                  {importSelectedIds.length} {ui("valda")}).
                </Text>
                <ScrollView style={styles.importScroll} nestedScrollEnabled>
                  {importWords.map((item) => {
                    const checked = importSelectedIds.includes(item.word_id);
                    return (
                      <TouchableOpacity
                        key={item.word_id}
                        style={[
                          styles.addCategoryChoice,
                          checked && styles.addCategoryChoiceSelected,
                        ]}
                        onPress={() =>
                          setImportSelectedIds((current) =>
                            checked
                              ? current.filter((id) => id !== item.word_id)
                              : [...current, item.word_id],
                          )
                        }
                      >
                        <Text style={styles.addCategoryChoiceText}>
                          {checked ? "☑" : "☐"} {item.text_from}
                          {item.text_to ? ` – ${item.text_to}` : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={styles.addSaveButton}
                  disabled={importBusy || importSelectedIds.length === 0}
                  onPress={() => {
                    void importCategoryWords(importSelectedIds);
                  }}
                >
                  <Text style={styles.addSaveButtonText}>
                    {ui("Importera valda")} ({importSelectedIds.length})
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {!!importError && (
              <Text style={styles.editError}>{importError}</Text>
            )}
            {importStep !== "categories" && (
              <TouchableOpacity
                style={styles.importBackButton}
                disabled={importBusy}
                onPress={() =>
                  setImportStep(importStep === "words" ? "mode" : "categories")
                }
              >
                <Text style={styles.editCategoryToggleText}>
                  {ui("‹ Tillbaka")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddWord}
        transparent
        animationType="fade"
        onRequestClose={closeAddWord}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModal, styles.addWordModal]}>
            <TouchableOpacity
              onPress={closeAddWord}
              style={styles.closeModalButton}
            >
              <Text style={styles.closeModalText}>×</Text>
            </TouchableOpacity>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.addWordModalContent}
            >
              <Text style={styles.editTitle}>{ui("Lägg till ord")}</Text>
              <Text style={styles.editLabel}>
                {languageNames[String(from ?? "").toLowerCase()]}
              </Text>
              <TextInput
                style={styles.editInput}
                value={newWord}
                onChangeText={(value) => {
                  setNewWord(value);
                  setAddError("");
                }}
                autoCapitalize="none"
              />
              <Text style={styles.editLabel}>
                {languageNames[String(to ?? "").toLowerCase()]}
              </Text>
              <TextInput
                style={styles.editInput}
                value={newTranslation}
                onChangeText={(value) => {
                  setNewTranslation(value);
                  setAddError("");
                }}
                autoCapitalize="none"
              />
              <Text style={styles.editLabel}>
                {
                  languageNames[
                    Object.keys(languageNames).find(
                      (code) =>
                        code !== String(from ?? "").toLowerCase() &&
                        code !== String(to ?? "").toLowerCase(),
                    ) ?? "en"
                  ]
                }{" "}
                ({ui("valfritt")})
              </Text>
              <TextInput
                style={styles.editInput}
                value={newThirdTranslation}
                onChangeText={(value) => {
                  setNewThirdTranslation(value);
                  setAddError("");
                }}
                autoCapitalize="none"
              />
              <Text style={styles.editLabel}>
                {ui("Information (valfritt)")}
              </Text>
              <TextInput
                style={[styles.editInput, styles.editInformationInput]}
                value={newInformation}
                onChangeText={(value) => {
                  setNewInformation(value);
                  setAddError("");
                }}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.editLabel}>{ui("Kategori (valfritt)")}</Text>
              <ScrollView
                style={styles.addCategoriesScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {wordCategories
                  .filter((item) => item.name !== "Övrigt")
                  .map((item) => {
                    const selected = selectedCategoryIds.includes(item.id);
                    const code = language;
                    const name =
                      (code === "sv"
                        ? item.name_sv
                        : code === "en"
                          ? item.name_en
                          : item.name_es) || item.name;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.addCategoryChoice,
                          selected && styles.addCategoryChoiceSelected,
                        ]}
                        onPress={() => {
                          setSelectedCategoryIds((current) =>
                            selected
                              ? current.filter((id) => id !== item.id)
                              : [...current, item.id],
                          );
                          setAddError("");
                        }}
                      >
                        <Text style={styles.addCategoryChoiceText}>
                          {selected ? "✓  " : ""}
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
              {!!addError && <Text style={styles.editError}>{addError}</Text>}
              <TouchableOpacity
                style={styles.addSaveButton}
                onPress={() => {
                  void addWord();
                }}
                disabled={addingWord}
              >
                <Text style={styles.addSaveButtonText}>{t("add")}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* REDIGERA-MODAL */}
      <Modal
        visible={editingWord !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEditWord}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            {/* ENDA STÄNG-KNAPPEN */}
            <TouchableOpacity
              onPress={closeEditWord}
              style={styles.closeModalButton}
            >
              <Text style={styles.closeModalText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.editTitle}>{ui("Redigera ord")}</Text>

            <Text style={styles.editLabel}>
              {languageNames[String(from ?? "").toLowerCase()]}
            </Text>

            <TextInput
              value={editTextFrom}
              onChangeText={(value) => {
                setEditTextFrom(value);
                setEditError("");
              }}
              style={styles.editInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.editLabel}>
              {languageNames[String(to ?? "").toLowerCase()]}
            </Text>

            <TextInput
              value={editTextTo}
              onChangeText={(value) => {
                setEditTextTo(value);
                setEditError("");
              }}
              style={styles.editInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.editLabel}>{ui("Information (valfritt)")}</Text>

            <TextInput
              value={editInformation}
              onChangeText={(value) => {
                setEditInformation(value);
                setEditError("");
              }}
              style={[styles.editInput, styles.editInformationInput]}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={styles.editCategoryToggle}
              onPress={() => setShowEditCategories((current) => !current)}
              disabled={loadingEditCategories}
              accessibilityRole="button"
              accessibilityLabel={t("categories")}
            >
              <Text style={styles.editCategoryHeading}>{ui("Kategorier")}</Text>
              <View style={styles.editCategorySummary}>
                <Text style={styles.editCategoryToggleText}>
                  {loadingEditCategories
                    ? ui("Laddar...")
                    : (() => {
                        const otherId = editCategories.find(
                          (item) => item.name === "Övrigt",
                        )?.id;
                        const count = editCategoryIds.filter(
                          (id) => id !== otherId,
                        ).length;
                        return count === 0
                          ? ui("Övrigt")
                          : `${count} ${ui("valda")}`;
                      })()}
                </Text>
                <FontAwesome
                  name={showEditCategories ? "chevron-up" : "chevron-down"}
                  size={12}
                  color="#285F9D"
                />
              </View>
            </TouchableOpacity>
            {showEditCategories && (
              <ScrollView
                style={styles.editCategoriesScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {editCategories
                  .filter((item) => item.name !== "Övrigt")
                  .map((item) => {
                    const selected = editCategoryIds.includes(item.id);
                    const name =
                      (language === "sv"
                        ? item.name_sv
                        : language === "en"
                          ? item.name_en
                          : item.name_es
                      )?.trim() ||
                      item.name_en?.trim() ||
                      item.name_sv?.trim() ||
                      item.name;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.addCategoryChoice,
                          selected && styles.addCategoryChoiceSelected,
                        ]}
                        onPress={() =>
                          setEditCategoryIds((current) =>
                            current.includes(item.id)
                              ? current.filter((id) => id !== item.id)
                              : [...current, item.id],
                          )
                        }
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                      >
                        <Text style={styles.addCategoryChoiceText}>
                          {selected ? "☑  " : "☐  "}
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                <TouchableOpacity
                  style={styles.editCategoriesDone}
                  onPress={() => setShowEditCategories(false)}
                >
                  <Text style={styles.editCategoryToggleText}>
                    {ui("Klar")}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {!!editError && <Text style={styles.editError}>{editError}</Text>}

            {/* RADERA + SPARA */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginTop: 10,
              }}
            >
              <TouchableOpacity
                onPress={confirmDeleteWord}
                disabled={savingEdit || deletingWord}
                style={{
                  backgroundColor: "#fee2e2",
                  borderRadius: 10,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: "#dc2626",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {t("delete")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveEditedWord}
                disabled={
                  savingEdit ||
                  deletingWord ||
                  loadingEditCategories ||
                  !!editError
                }
                style={{
                  backgroundColor: "#e0e7ff",
                  borderRadius: 10,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: "#285F9D",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {t("save")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  letterHeading: {
    color: "#648EB5",
    fontSize: 17,
    fontWeight: "700",
    paddingTop: 14,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#C8D9E6",
  },
  columnHeadings: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#C8D9E6",
  },
  columnHeading: {
    flex: 1,
    fontSize: 12,
    color: "#648EB5",
    fontWeight: "700",
  },
  columnActionsSpace: { width: 70 },
  actionsWithoutPencil: { width: 34 },
  infoSlot: { width: 24, alignItems: "center", justifyContent: "center" },
  editModeActive: { backgroundColor: "#E7F2FC", borderColor: "#B9D6EB" },
  watermarkLayer: {
    position: "absolute",
    top: "27%",
    left: 0,
    right: 0,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.055,
  },
  watermarkScale: {
    width: 106,
    height: 83,
    transform: [{ scale: 2.8 }],
    alignItems: "center",
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logo: {
    width: 106,
    height: 90,
    alignSelf: "center",
    marginBottom: 34,
    position: "relative",
    transform: [{ scale: 1.6 }],
  },
  logoPerson: {
    position: "absolute",
    top: 12,
    width: 38,
    height: 55,
    alignItems: "center",
  },
  logoSideLeft: { left: 2 },
  logoSideRight: { right: 2 },
  logoSideHead: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: "#91B7DA",
  },
  logoSideBody: {
    width: 35,
    height: 29,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#91B7DA",
    marginTop: 3,
  },
  logoCenter: {
    position: "absolute",
    top: 0,
    left: 29,
    width: 48,
    height: 70,
    alignItems: "center",
  },
  logoCenterHead: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#234C7A",
    zIndex: 2,
  },
  logoCenterBody: {
    position: "absolute",
    top: 27,
    width: 48,
    height: 41,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: "#234C7A",
  },
  logoStrapLeft: {
    position: "absolute",
    top: 28,
    left: 16,
    width: 3,
    height: 24,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-28deg" }],
    zIndex: 3,
  },
  logoStrapRight: {
    position: "absolute",
    top: 28,
    right: 16,
    width: 3,
    height: 24,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "28deg" }],
    zIndex: 3,
  },
  logoBadge: {
    position: "absolute",
    top: 43,
    width: 53,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 4,
  },
  logoBadgeText: { fontSize: 8, fontWeight: "700", color: "#234C7A" },
  logoBadgeTail: {
    position: "absolute",
    bottom: -3,
    left: 10,
    width: 7,
    height: 7,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },

  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
    paddingHorizontal: 22,
    paddingTop: 16,
  },

  search: {
    marginBottom: 16,
  },

  displayModeBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  displayModeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#F7FAFD",
  },
  displayModeLabel: {
    fontSize: 11,
    color: "#71859B",
  },
  sideTextRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  sideColumn: {
    flex: 1.08,
    minWidth: 0,
    paddingRight: 14,
  },
  sideColumnTranslation: {
    flex: 0.92,
    minWidth: 0,
    marginTop: 0,
    paddingLeft: 8,
    paddingRight: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#203B59",
    marginBottom: 4,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 12,
    color: "#71859B",
    textAlign: "center",
    marginBottom: 20,
  },

  searchHint: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 10,
    marginLeft: 4,
  },

  searchResults: {
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    marginBottom: 12,
  },

  searchResultRow: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
  },

  searchResultText: {
    flex: 1,
  },

  moreResults: {
    fontSize: 12,
    color: "#94A3B8",
    padding: 12,
    textAlign: "center",
  },

  infoButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // Fast yta för info och redigering: textkolumnerna flyttas aldrig.
  rowActions: {
    width: 70,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },

  inlineInfoPopup: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F7FAFD",
    borderColor: "#C5DBEF",
    borderWidth: 1,
    borderRadius: 10,
  },

  inlineInfoScroll: {
    maxHeight: 130,
  },

  inlineInfoScrollContent: {
    paddingRight: 24,
  },

  informationBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "#71859B",
  },

  listContent: {
    paddingBottom: 76,
  },

  row: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#E5EBF0",
  },

  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  word: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#203B59",
    paddingRight: 8,
  },

  editButton: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 0,
  },

  translation: {
    fontSize: 14,
    lineHeight: 22,
    color: "#61758B",
    marginTop: 5,
  },

  empty: {
    fontSize: 14,
    color: "#71859B",
    textAlign: "center",
    paddingVertical: 24,
  },

  categoryBottomActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
    marginRight: 2,
  },
  importCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#E9F3FB",
    borderWidth: 1,
    borderColor: "#DCEBF7",
  },
  importCategoryButtonText: {
    color: "#285F9D",
    fontSize: 12,
    fontWeight: "600",
  },
  importHint: { color: "#71859B", fontSize: 13, marginBottom: 12 },
  importListFrame: {
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    marginBottom: 12,
  },
  importScroll: { maxHeight: 320 },
  importScrollContent: { paddingBottom: 8 },
  importCategoryRow: {
    minHeight: 51,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  importCategoryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  importCategoryLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  importCategoryName: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  importEmpty: {
    padding: 16,
    fontSize: 13,
    color: "#71859B",
  },
  importBackButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    marginTop: 8,
  },
  addWordPlusButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E9F3FB",
    borderWidth: 1,
    borderColor: "#DCEBF7",
    alignItems: "center",
    justifyContent: "center",
  },
  addWordPlusText: {
    fontSize: 26,
    lineHeight: 29,
    color: "#285F9D",
    fontWeight: "500",
  },
  addCategoriesScroll: { maxHeight: 135, marginBottom: 12 },
  editCategoryToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 10,
    marginBottom: 12,
  },
  editCategoryHeading: { color: "#203B59", fontSize: 13, fontWeight: "600" },
  editCategorySummary: { flexDirection: "row", alignItems: "center", gap: 10 },
  editCategoryToggleText: { color: "#285F9D", fontSize: 13, fontWeight: "600" },
  editCategoriesScroll: { maxHeight: 155, marginBottom: 12 },
  editCategoriesDone: { alignItems: "center", paddingVertical: 10 },
  addCategoryChoice: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    marginBottom: 6,
  },
  addCategoryChoiceSelected: {
    backgroundColor: "#E9F3FB",
    borderColor: "#C5DBEF",
  },
  addCategoryChoiceText: { color: "#334155", fontSize: 13 },
  addSaveButton: {
    backgroundColor: "#DCEBF7",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  addSaveButtonText: { color: "#285F9D", fontWeight: "600", fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  addWordModal: { maxHeight: "85%" },
  addWordModalContent: { paddingTop: 8, paddingBottom: 8 },
  editModal: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    position: "relative",
  },

  closeModalButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  closeModalText: {
    fontSize: 28,
    fontWeight: "400",
    color: "#71859B",
    lineHeight: 30,
  },

  editTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#203B59",
    marginBottom: 18,
    paddingRight: 35,
  },

  editLabel: {
    fontSize: 12,
    color: "#71859B",
    marginBottom: 5,
  },

  editInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#203B59",
    marginBottom: 14,
  },

  editInformationInput: {
    height: 90,
    paddingTop: 10,
    paddingBottom: 10,
  },

  editError: {
    color: "#9A5B22",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  deleteButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },

  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
