import { BackButton } from "@/components/back-button";
import { importCategoryName as getCategoryName } from "@/components/dictionary/dictionary-category-helpers";
import {
  MAX_RESULTS,
  getDictionarySearchResults,
} from "@/components/dictionary/dictionary-search";
import { styles } from "@/components/dictionary/dictionary-styles";
import { pageText } from "@/components/dictionary/dictionary-translations";
import type {
  Translation,
  WordCategory,
} from "@/components/dictionary/dictionary-types";
import {
  WordInfoButton,
  WordInfoPopup,
} from "@/components/dictionary/dictionary-word-info";
import { DictionaryWordRow } from "@/components/dictionary/dictionary-word-row";
import { EditWordModal } from "@/components/dictionary/edit-word-modal";
import { ImportCategoryModal } from "@/components/dictionary/import-category-modal";
import { LanguagePicker } from "@/components/language-picker";
import { SearchBar } from "@/components/search-bar";
import { AddWordModal } from "@/components/second-page/add-word-modal";
import { useUiLanguage } from "@/context/ui-language-context";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const EDIT_PENCILS_KEY = "tolkappen:showEditPencils";

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

/** Liten diskret symbol: två deltagare och en tolk med namnbricka. */

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
    return getCategoryName(item, language);
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
  const {
    normalizedSearch,
    hasEnoughLetters,
    searchResults,
    filteredTranslations,
  } = getDictionarySearchResults(translations, searchText);

  function renderInfoPopup(item: Translation, location: "results" | "list") {
    return (
      <WordInfoPopup
        item={item}
        location={location}
        selectedInformation={selectedInformation}
      />
    );
  }

  function renderInfoButton(item: Translation, location: "results" | "list") {
    return (
      <WordInfoButton
        item={item}
        location={location}
        selectedInformation={selectedInformation}
        onSelectInformation={setSelectedInformation}
        ui={ui}
      />
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
                          displayMode === "side"
                            ? styles.sideColumn
                            : { flex: 0 },
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

            <DictionaryWordRow
              item={item}
              displayMode={displayMode}
              showEditPencils={showEditPencils}
              ui={ui}
              onEditWord={openEditWord}
              renderInfoButton={renderInfoButton}
              renderInfoPopup={renderInfoPopup}
            />
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

      <ImportCategoryModal
        visible={showCategoryImport}
        importBusy={importBusy}
        importStep={importStep}
        importSources={importSources}
        importSource={importSource}
        importWords={importWords}
        importSelectedIds={importSelectedIds}
        importError={importError}
        ui={ui}
        importCategoryName={importCategoryName}
        onClose={() => setShowCategoryImport(false)}
        onSelectSource={(item) => {
          void selectImportSource(item);
        }}
        onImportWords={(wordIds) => {
          void importCategoryWords(wordIds);
        }}
        onChooseWords={() => setImportStep("words")}
        onToggleWord={(wordId) =>
          setImportSelectedIds((current) =>
            current.includes(wordId)
              ? current.filter((id) => id !== wordId)
              : [...current, wordId],
          )
        }
        onBack={() =>
          setImportStep(importStep === "words" ? "mode" : "categories")
        }
      />

      <AddWordModal
        visible={showAddWord}
        from={String(from ?? "")}
        to={String(to ?? "")}
        word={newWord}
        translation={newTranslation}
        thirdTranslation={newThirdTranslation}
        information={newInformation}
        categories={wordCategories
          .filter((item) => item.name !== "Övrigt")
          .map((item) => ({
            key: String(item.id),
            name: importCategoryName(item),
          }))}
        selectedCategories={selectedCategoryIds.map(String)}
        error={addError}
        saving={addingWord}
        onWordChange={(value) => {
          setNewWord(value);
          setAddError("");
        }}
        onTranslationChange={(value) => {
          setNewTranslation(value);
          setAddError("");
        }}
        onThirdTranslationChange={(value) => {
          setNewThirdTranslation(value);
          setAddError("");
        }}
        onInformationChange={(value) => {
          setNewInformation(value);
          setAddError("");
        }}
        onToggleCategory={(key) => {
          const id = Number(key);
          setSelectedCategoryIds((current) =>
            current.includes(id)
              ? current.filter((item) => item !== id)
              : [...current, id],
          );
          setAddError("");
        }}
        onSave={addWord}
        onClose={closeAddWord}
      />

      <EditWordModal
        visible={editingWord !== null}
        fromLanguage={languageNames[String(from ?? "").toLowerCase()]}
        toLanguage={languageNames[String(to ?? "").toLowerCase()]}
        language={language}
        editTextFrom={editTextFrom}
        editTextTo={editTextTo}
        editInformation={editInformation}
        editError={editError}
        editCategories={editCategories}
        editCategoryIds={editCategoryIds}
        showEditCategories={showEditCategories}
        loadingEditCategories={loadingEditCategories}
        savingEdit={savingEdit}
        deletingWord={deletingWord}
        ui={ui}
        t={t}
        onClose={closeEditWord}
        onEditTextFromChange={(value) => {
          setEditTextFrom(value);
          setEditError("");
        }}
        onEditTextToChange={(value) => {
          setEditTextTo(value);
          setEditError("");
        }}
        onEditInformationChange={(value) => {
          setEditInformation(value);
          setEditError("");
        }}
        onToggleCategories={() => setShowEditCategories((current) => !current)}
        onToggleCategory={(id) =>
          setEditCategoryIds((current) =>
            current.includes(id)
              ? current.filter((item) => item !== id)
              : [...current, id],
          )
        }
        onCategoriesDone={() => setShowEditCategories(false)}
        onDelete={confirmDeleteWord}
        onSave={saveEditedWord}
      />
    </SafeAreaView>
  );
}
