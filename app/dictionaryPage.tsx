
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { SearchBar } from "@/components/search-bar";
import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";
import { useEffect, useState } from "react";
import {
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
  if (normalizedQuery.includes(" ")) return normalizedText.includes(normalizedQuery);
  return normalizedText.split(/[\s/,()!?;:]+/).some((word) => word.startsWith(normalizedQuery));
}

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

type Translation = {
  word_id: number;
  text_from: string;
  text_to: string;
  information: string | null;
};

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
  const [searchText, setSearchText] = useState("");
  const [selectedInformation, setSelectedInformation] = useState<{ wordId: number; location: "results" | "list" } | null>(null);

  const [editingWord, setEditingWord] = useState<Translation | null>(null);
  const [editTextFrom, setEditTextFrom] = useState("");
  const [editTextTo, setEditTextTo] = useState("");
  const [editInformation, setEditInformation] = useState("");

  useEffect(() => {
    loadTranslations();
  }, [from, to, category]);

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

  function openEditWord(item: Translation) {
    setEditingWord(item);
    setEditTextFrom(item.text_from);
    setEditTextTo(item.text_to);
    setEditInformation(item.information ?? "");
  }

  function closeEditWord() {
    setEditingWord(null);
    setEditTextFrom("");
    setEditTextTo("");
    setEditInformation("");
  }

  async function saveEditedWord() {
    if (!editingWord) return;

    const selectedFrom = String(from ?? "").toLowerCase();
    const selectedTo = String(to ?? "").toLowerCase();

    const fromLanguage = languageNames[selectedFrom];
    const toLanguage = languageNames[selectedTo];

    if (!fromLanguage || !toLanguage) {
      return;
    }

    const fromLanguageRow = await db.getFirstAsync<{ id: number }>(
      `
      SELECT id
      FROM languages
      WHERE name = ?
      `,
      fromLanguage,
    );

    const toLanguageRow = await db.getFirstAsync<{ id: number }>(
      `
      SELECT id
      FROM languages
      WHERE name = ?
      `,
      toLanguage,
    );

    if (!fromLanguageRow || !toLanguageRow) {
      return;
    }

    if (!editTextFrom.trim() || !editTextTo.trim()) {
      return;
    }

    await db.runAsync(
      `
      UPDATE translations
      SET text = ?
      WHERE word_id = ?
        AND language_id = ?
      `,
      editTextFrom.trim(),
      editingWord.word_id,
      fromLanguageRow.id,
    );

    await db.runAsync(
      `
      UPDATE translations
      SET text = ?
      WHERE word_id = ?
        AND language_id = ?
      `,
      editTextTo.trim(),
      editingWord.word_id,
      toLanguageRow.id,
    );

    await db.runAsync(
      `UPDATE words SET information = ? WHERE id = ?`,
      editInformation.trim() || null,
      editingWord.word_id,
    );

    closeEditWord();

    await loadTranslations();
  }

  async function deleteWord() {
    if (!editingWord) return;

    const wordId = editingWord.word_id;

    try {
      await db.runAsync(
        `
        DELETE FROM word_tags
        WHERE word_id = ?
        `,
        wordId,
      );

      await db.runAsync(
        `
        DELETE FROM translations
        WHERE word_id = ?
        `,
        wordId,
      );

      await db.runAsync(
        `
        DELETE FROM words
        WHERE id = ?
        `,
        wordId,
      );

      setEditingWord(null);
      setEditTextFrom("");
      setEditTextTo("");
      setEditInformation("");

      await loadTranslations();
    } catch (error) {
      console.error("Failed to delete word:", error);
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
          const fromMatches = startsWithSearch(item.text_from, normalizedSearch);
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
    if (selectedInformation?.wordId !== item.word_id || selectedInformation.location !== location) {
      return null;
    }

    return (
      <View style={styles.inlineInfoPopup} onTouchEnd={(event) => event.stopPropagation()}>
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
        <FontAwesome name="info-circle" size={15} color="#2563EB" />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]} onTouchEnd={() => { if (selectedInformation) setSelectedInformation(null); }}>
      <BackButton
        onPress={() =>
          router.dismissTo({
            pathname: "/secondPage",
            params: { from, to },
          })
        }
      />

      <Text style={styles.title}>{category ? category : t("dictionary")}</Text>

      <Text style={styles.subtitle}>
        {languageNames[String(from ?? "").toLowerCase()]} →{" "}
        {languageNames[String(to ?? "").toLowerCase()]} ·{" "}
        {filteredTranslations.length} {t("words")}
      </Text>

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
                    <View style={styles.searchResultText}>
                      <Text style={styles.word}>{item.text_from}</Text>
                      <Text style={styles.translation}>{item.text_to}</Text>
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
        data={hasEnoughLetters ? searchResults.slice(MAX_RESULTS) : filteredTranslations}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => String(item.word_id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.wordRow}>
              <Text style={styles.word}>{item.text_from}</Text>
              {renderInfoButton(item, "list")}

              <TouchableOpacity
                onPress={() => openEditWord(item)}
                style={styles.editButton}
                hitSlop={6}
              >
                <FontAwesome name="pencil" size={12} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <Text style={styles.translation}>{item.text_to}</Text>
            {renderInfoPopup(item, "list")}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          !hasEnoughLetters && !searchText.trim()
            ? <Text style={styles.empty}>{t("noWordsYet")}</Text>
            : null
        }
      />

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
              onChangeText={setEditTextFrom}
              style={styles.editInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.editLabel}>
              {languageNames[String(to ?? "").toLowerCase()]}
            </Text>

            <TextInput
              value={editTextTo}
              onChangeText={setEditTextTo}
              style={styles.editInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.editLabel}>Information (valfritt)</Text>

            <TextInput
              value={editInformation}
              onChangeText={setEditInformation}
              style={[styles.editInput, styles.editInformationInput]}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
              autoCorrect={false}
              placeholder="Lägg till information om ordet..."
              placeholderTextColor="#94A3B8"
            />

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
                onPress={deleteWord}
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
                style={{
                  backgroundColor: "#e0e7ff",
                  borderRadius: 10,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: "#4338ca",
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 22,
    paddingTop: 16,
  },

  search: {
    marginBottom: 16,
  },





  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 12,
    color: "#6b7280",
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
    borderColor: "#E2E8F0",
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
    backgroundColor: "#F8FAFC",
    borderColor: "#BFDBFE",
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
    color: "#64748B",
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
    color: "#111827",
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
    color: "#6b7280",
    marginTop: 3,
  },

  empty: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 24,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  editModal: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
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
    color: "#6b7280",
    lineHeight: 30,
  },

  editTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 18,
    paddingRight: 35,
  },

  editLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },

  editInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#111827",
    marginBottom: 14,
  },

  editInformationInput: {
    height: 90,
    paddingTop: 10,
    paddingBottom: 10,
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
