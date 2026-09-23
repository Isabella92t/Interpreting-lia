
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

type Translation = {
  word_id: number;
  text_from: string;
  text_to: string;
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
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [editingWord, setEditingWord] = useState<Translation | null>(null);
  const [editTextFrom, setEditTextFrom] = useState("");
  const [editTextTo, setEditTextTo] = useState("");

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
          from_translation.word_id
        FROM translations AS from_translation
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
          from_translation.word_id
        FROM translations AS from_translation
        INNER JOIN translations AS to_translation
          ON from_translation.word_id = to_translation.word_id
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
  }

  function closeEditWord() {
    setEditingWord(null);
    setEditTextFrom("");
    setEditTextTo("");
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

    setEditingWord(null);

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

      await loadTranslations();
    } catch (error) {
      console.error("Failed to delete word:", error);
    }
  }

  const filteredTranslations = translations
    .filter((item) => {
      const search = searchText.trim().toLowerCase();

      return (
        item.text_from.toLowerCase().includes(search) ||
        item.text_to.toLowerCase().includes(search)
      );
    })
    .sort((a, b) =>
      a.text_from.localeCompare(b.text_from, "sv", {
        sensitivity: "base",
      }),
    );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() =>
            router.dismissTo({
              pathname: "/secondPage",
              params: { from, to },
            })
          }
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSearchVisible((visible) => !visible);

            if (searchVisible) {
              setSearchText("");
            }
          }}
          style={styles.searchButton}
        >
          <FontAwesome name="search" size={28} color="#111827" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{category ? category : t("dictionary")}</Text>

      <Text style={styles.subtitle}>
        {languageNames[String(from ?? "").toLowerCase()]} →{" "}
        {languageNames[String(to ?? "").toLowerCase()]} ·{" "}
        {filteredTranslations.length} {t("words")}
      </Text>

      {searchVisible && (
        <View style={styles.searchContainer}>
          <FontAwesome
            name="search"
            size={18}
            color="#6b7280"
            style={styles.searchIcon}
          />

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Sök ord..."
            placeholderTextColor="#9ca3af"
            autoFocus
            style={styles.searchInput}
          />

          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Text style={styles.clearButton}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={filteredTranslations}
        keyExtractor={(item) => String(item.word_id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.wordRow}>
              <Text style={styles.word}>{item.text_from}</Text>

              <TouchableOpacity
                onPress={() => openEditWord(item)}
                style={styles.editButton}
                hitSlop={6}
              >
                <FontAwesome name="pencil" size={12} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <Text style={styles.translation}>{item.text_to}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={<Text style={styles.empty}>{t("noWordsYet")}</Text>}
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
                  Radera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveEditedWord}
                style={{
                  backgroundColor: "#6366f1",
                  borderRadius: 10,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Spara
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },

  backButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },

  searchButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
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

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  searchIcon: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },

  clearButton: {
    fontSize: 26,
    color: "#6b7280",
    paddingLeft: 8,
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
  },

  word: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  editButton: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
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
