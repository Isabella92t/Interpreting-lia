import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { LanguagePicker } from "@/components/language-picker";
import { SearchBar } from "@/components/search-bar";
import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";
import { useEffect, useState } from "react";
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
    <View style={styles.logo} accessibilityLabel="TolkAppen – tre personer och tolk med namnbricka">
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
          <Text style={styles.logoBadgeText} numberOfLines={1}>TolkAppen</Text>
          <View style={styles.logoBadgeTail} />
        </View>
      </View>
    </View>
  );
}

export default function DictionaryPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { t } = useUiLanguage();

  const { from, to, category } = useLocalSearchParams<{
    from?: string;
    to?: string;
    category?: string;
  }>();

  const [translations, setTranslations] = useState<Translation[]>([]);
  const [displayMode, setDisplayMode] = useState<"stacked" | "side">("stacked");
  const [displayReady, setDisplayReady] = useState(false);
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
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingWord, setDeletingWord] = useState(false);

  const [showAddWord, setShowAddWord] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [newInformation, setNewInformation] = useState("");
  const [wordCategories, setWordCategories] = useState<WordCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [addError, setAddError] = useState("");
  const [addingWord, setAddingWord] = useState(false);

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

  async function openAddWord() {
    setNewWord("");
    setNewTranslation("");
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
      setAddError("Kunde inte hämta kategorierna.");
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
      setAddError("Fyll i både ord och översättning.");
      return;
    }
    setAddingWord(true);
    setAddError("");
    try {
      const fromName = languageNames[String(from ?? "").toLowerCase()];
      const toName = languageNames[String(to ?? "").toLowerCase()];
      if (!fromName || !toName) {
        setAddError("Språken kunde inte hittas.");
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
      if (!fromRow || !toRow) {
        setAddError("Språken kunde inte hittas.");
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
      setAddError("Kunde inte lägga till ordet. Försök igen.");
    } finally {
      setAddingWord(false);
    }
  }

  function openEditWord(item: Translation) {
    setEditError("");
    setEditingWord(item);
    setEditTextFrom(item.text_from);
    setEditTextTo(item.text_to);
    setEditInformation(item.information ?? "");
  }

  function closeEditWord() {
    setEditingWord(null);
    setEditError("");
    setEditTextFrom("");
    setEditTextTo("");
    setEditInformation("");
  }

  async function saveEditedWord() {
    if (!editingWord || savingEdit || deletingWord) return;
    const fromLanguage = languageNames[String(from ?? "").toLowerCase()];
    const toLanguage = languageNames[String(to ?? "").toLowerCase()];
    if (!fromLanguage || !toLanguage) {
      setEditError("Språken kunde inte hittas.");
      return;
    }
    if (!editTextFrom.trim() || !editTextTo.trim()) {
      setEditError("Fyll i både ord och översättning.");
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
        setEditError("Språken kunde inte hittas.");
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
      });
      closeEditWord();
      await loadTranslations();
    } catch (error) {
      console.error("Failed to save word:", error);
      setEditError("Kunde inte spara ändringarna. Försök igen.");
    } finally {
      setSavingEdit(false);
    }
  }

  function confirmDeleteWord() {
    if (!editingWord || savingEdit || deletingWord) return;
    Alert.alert(
      "Radera ord?",
      `Vill du verkligen radera ”${editingWord.text_from}”?`,
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Radera",
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
      closeEditWord();
      await loadTranslations();
    } catch (error) {
      console.error("Failed to delete word:", error);
      setEditError("Kunde inte radera ordet. Försök igen.");
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
        onTouchEnd={(event) => event.stopPropagation()}
        onPress={() =>
          setSelectedInformation((current) =>
            current?.wordId === item.word_id && current.location === location
              ? null
              : { wordId: item.word_id, location },
          )
        }
        accessibilityRole="button"
        accessibilityLabel={`Visa information om ${item.text_from}`}
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
      <View pointerEvents="none" accessible={false} style={styles.watermarkLayer}>
        <View style={styles.watermarkScale}><InterpreterLogo /></View>
      </View>
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
      <Text style={styles.title}>{category ? category : t("dictionary")}</Text>

      <Text style={styles.subtitle}>
        {languageNames[String(from ?? "").toLowerCase()]} →{" "}
        {languageNames[String(to ?? "").toLowerCase()]} ·{" "}
        {filteredTranslations.length} {t("words")}
      </Text>

      <View style={styles.displayModeBar}>
        <TouchableOpacity
          style={styles.displayModeButton}
          onPress={() => {
            void toggleDisplayMode();
          }}
          disabled={!displayReady}
          accessibilityRole="button"
          accessibilityLabel={
            displayMode === "stacked"
              ? "Visa ord bredvid varandra"
              : "Visa ord under varandra"
          }
        >
          <FontAwesome
            name={displayMode === "stacked" ? "columns" : "bars"}
            size={14}
            color="#71859B"
          />
          <Text style={styles.displayModeLabel}>
            {displayMode === "stacked" ? "Bredvid varandra" : "Under varandra"}
          </Text>
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
                    {renderInfoButton(item, "results")}
                    <TouchableOpacity
                      onPress={() => openEditWord(item)}
                      style={styles.editButton}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Redigera ${item.text_from}`}
                    >
                      <FontAwesome name="pencil" size={12} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  {renderInfoPopup(item, "results")}
                </View>
              ))}
              {searchResults.length > MAX_RESULTS && (
                <Text style={styles.moreResults}>
                  + {searchResults.length - MAX_RESULTS} fler träffar
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
        renderItem={({ item }) => (
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
                {renderInfoButton(item, "list")}
                <TouchableOpacity
                  onPress={() => openEditWord(item)}
                  style={styles.editButton}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Redigera ${item.text_from}`}
                >
                  <FontAwesome name="pencil" size={12} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.wordRow}>
                  <Text style={styles.word}>{item.text_from}</Text>
                  {renderInfoButton(item, "list")}
                  <TouchableOpacity
                    onPress={() => openEditWord(item)}
                    style={styles.editButton}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Redigera ${item.text_from}`}
                  >
                    <FontAwesome name="pencil" size={12} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.translation}>{item.text_to}</Text>
              </>
            )}
            {renderInfoPopup(item, "list")}
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

      <TouchableOpacity
        style={styles.addWordPlusButton}
        onPress={() => {
          void openAddWord();
        }}
        accessibilityRole="button"
        accessibilityLabel="Lägg till ord"
        activeOpacity={0.8}
      >
        <Text style={styles.addWordPlusText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddWord}
        transparent
        animationType="fade"
        onRequestClose={closeAddWord}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <TouchableOpacity
              onPress={closeAddWord}
              style={styles.closeModalButton}
            >
              <Text style={styles.closeModalText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.editTitle}>Lägg till ord</Text>
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
            <Text style={styles.editLabel}>Information (valfritt)</Text>
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
            <Text style={styles.editLabel}>Kategori (valfritt)</Text>
            <ScrollView
              style={styles.addCategoriesScroll}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {wordCategories
                .filter((item) => item.name !== "Övrigt")
                .map((item) => {
                  const selected = selectedCategoryIds.includes(item.id);
                  const code = String(from ?? "").toLowerCase();
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

            <Text style={styles.editTitle}>Redigera ord</Text>

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

            <Text style={styles.editLabel}>Information (valfritt)</Text>

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
                disabled={savingEdit || deletingWord}
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
  watermarkLayer: { position: "absolute", top: "27%", left: 0, right: 0, height: 240, alignItems: "center", justifyContent: "center", opacity: 0.055 },
  watermarkScale: { width: 106, height: 83, transform: [{ scale: 2.8 }], alignItems: "center", justifyContent: "center" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  logo: {
    width: 106,
    height: 90,
    alignSelf: "center",
    marginBottom: 34,
    position: "relative",
    transform: [{ scale: 1.6 }],
  },
  logoPerson: { position: "absolute", top: 12, width: 38, height: 55, alignItems: "center" },
  logoSideLeft: { left: 2 },
  logoSideRight: { right: 2 },
  logoSideHead: { width: 21, height: 21, borderRadius: 11, backgroundColor: "#91B7DA" },
  logoSideBody: { width: 35, height: 29, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#91B7DA", marginTop: 3 },
  logoCenter: { position: "absolute", top: 0, left: 29, width: 48, height: 70, alignItems: "center" },
  logoCenterHead: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#234C7A", zIndex: 2 },
  logoCenterBody: { position: "absolute", top: 27, width: 48, height: 41, borderTopLeftRadius: 23, borderTopRightRadius: 23, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, backgroundColor: "#234C7A" },
  logoStrapLeft: { position: "absolute", top: 28, left: 16, width: 3, height: 24, backgroundColor: "#FFFFFF", transform: [{ rotate: "-28deg" }], zIndex: 3 },
  logoStrapRight: { position: "absolute", top: 28, right: 16, width: 3, height: 24, backgroundColor: "#FFFFFF", transform: [{ rotate: "28deg" }], zIndex: 3 },
  logoBadge: { position: "absolute", top: 43, width: 53, height: 19, borderRadius: 10, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", zIndex: 4 },
  logoBadgeText: { fontSize: 8, fontWeight: "700", color: "#234C7A" },
  logoBadgeTail: { position: "absolute", bottom: -3, left: 10, width: 7, height: 7, backgroundColor: "#FFFFFF", transform: [{ rotate: "45deg" }] },

  container: {
    flex: 1,
    backgroundColor: "#F5F9FD",
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
    flex: 1,
    paddingRight: 0,
  },
  sideColumnTranslation: {
    flex: 1,
    marginTop: 0,
    paddingRight: 4,
  },

  title: {
    fontSize: 21,
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 22,
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
    paddingBottom: 24,
  },

  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  word: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#203B59",
    paddingRight: 8,
  },

  editButton: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },

  translation: {
    fontSize: 14,
    color: "#71859B",
    marginTop: 3,
  },

  empty: {
    fontSize: 14,
    color: "#71859B",
    textAlign: "center",
    paddingVertical: 24,
  },

  addWordPlusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignSelf: "flex-end",
    marginBottom: 16,
    marginRight: 2,
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
