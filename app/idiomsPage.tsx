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
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Idiom = {
  idiom_id: number;
  text_from: string;
  text_to: string;
};

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

export default function IdiomsPage() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { t } = useUiLanguage();

  const { from, to } = useLocalSearchParams<{
    from?: string;
    to?: string;
  }>();

  const [idioms, setIdioms] = useState<Idiom[]>([]);
  const [search, setSearch] = useState("");
  const [displayMode, setDisplayMode] = useState<"stacked" | "side">("stacked");
  const [displayReady, setDisplayReady] = useState(false);
  const displayKey = `idioms:${String(from ?? "").toLowerCase()}:${String(to ?? "").toLowerCase()}`;

  // Lägg till idiom
  const [showAddIdiom, setShowAddIdiom] = useState(false);
  const [newIdiom, setNewIdiom] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Redigera idiom
  const [editingIdiom, setEditingIdiom] = useState<Idiom | null>(null);
  const [editIdiomText, setEditIdiomText] = useState("");
  const [editTranslationText, setEditTranslationText] = useState("");
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingIdiom, setDeletingIdiom] = useState(false);

  const fromLanguage = languageNames[String(from ?? "").toLowerCase()];

  const toLanguage = languageNames[String(to ?? "").toLowerCase()];

  useEffect(() => {
    loadIdioms();
  }, [from, to]);

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

  async function loadIdioms() {
    if (!fromLanguage || !toLanguage) return;

    try {
      const result = await db.getAllAsync<Idiom>(
        `
        SELECT
          from_translation.idiom_id,
          from_translation.text AS text_from,
          to_translation.text AS text_to
        FROM idiom_translations AS from_translation
        INNER JOIN idiom_translations AS to_translation
          ON from_translation.idiom_id = to_translation.idiom_id
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

      setIdioms(result);
    } catch (error) {
      console.error("Kunde inte läsa idiom:", error);
    }
  }

  async function getLanguageIds() {
    if (!fromLanguage || !toLanguage || fromLanguage === toLanguage) {
      return null;
    }

    const fromRow = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM languages WHERE name = ?",
      fromLanguage,
    );

    const toRow = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM languages WHERE name = ?",
      toLanguage,
    );

    if (!fromRow || !toRow) return null;

    return {
      fromId: fromRow.id,
      toId: toRow.id,
    };
  }

  // LÄGG TILL IDIOM

  function closeAddIdiom() {
    if (saving) return;

    setNewIdiom("");
    setNewTranslation("");
    setFormError("");
    setShowAddIdiom(false);
  }

  async function addIdiom() {
    if (saving) return;

    const idiomText = newIdiom.trim();
    const translationText = newTranslation.trim();

    if (!idiomText || !translationText) {
      setFormError("Fyll i idiomet och översättningen.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const languages = await getLanguageIds();

      if (!languages) {
        setFormError("Språken kunde inte hittas.");
        return;
      }

      const existing = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM idioms WHERE LOWER(name) = LOWER(?)",
        idiomText,
      );

      if (existing) {
        setFormError("Det här idiomet finns redan.");
        return;
      }

      await db.withTransactionAsync(async () => {
        const inserted = await db.runAsync(
          "INSERT INTO idioms (name) VALUES (?)",
          idiomText,
        );

        const idiomId = inserted.lastInsertRowId;

        await db.runAsync(
          `INSERT INTO idiom_translations
           (idiom_id, language_id, text)
           VALUES (?, ?, ?)`,
          idiomId,
          languages.fromId,
          idiomText,
        );

        await db.runAsync(
          `INSERT INTO idiom_translations
           (idiom_id, language_id, text)
           VALUES (?, ?, ?)`,
          idiomId,
          languages.toId,
          translationText,
        );
      });

      setNewIdiom("");
      setNewTranslation("");
      setShowAddIdiom(false);

      await loadIdioms();
    } catch (error) {
      console.error("Kunde inte spara idiom:", error);
      setFormError("Kunde inte spara idiomet. Försök igen.");
    } finally {
      setSaving(false);
    }
  }

  // REDIGERA IDIOM

  function openEditIdiom(item: Idiom) {
    setEditingIdiom(item);
    setEditIdiomText(item.text_from);
    setEditTranslationText(item.text_to);
    setEditError("");
  }

  function closeEditIdiom() {
    if (savingEdit || deletingIdiom) return;

    setEditingIdiom(null);
    setEditIdiomText("");
    setEditTranslationText("");
    setEditError("");
  }

  async function saveEditedIdiom() {
    if (!editingIdiom || savingEdit || deletingIdiom) return;

    const idiomText = editIdiomText.trim();
    const translationText = editTranslationText.trim();

    if (!idiomText || !translationText) {
      setEditError("Fyll i idiomet och översättningen.");
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      const languages = await getLanguageIds();

      if (!languages) {
        setEditError("Språken kunde inte hittas.");
        return;
      }

      const existing = await db.getFirstAsync<{ id: number }>(
        `
        SELECT id
        FROM idioms
        WHERE LOWER(name) = LOWER(?)
          AND id != ?
        `,
        idiomText,
        editingIdiom.idiom_id,
      );

      if (existing) {
        setEditError("Det här idiomet finns redan.");
        return;
      }

      // Namnet i idioms-tabellen uppdateras också,
      // så att databasen hålls konsekvent.
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          UPDATE idioms
          SET name = ?
          WHERE id = ?
          `,
          idiomText,
          editingIdiom.idiom_id,
        );

        await db.runAsync(
          `
          UPDATE idiom_translations
          SET text = ?
          WHERE idiom_id = ?
            AND language_id = ?
          `,
          idiomText,
          editingIdiom.idiom_id,
          languages.fromId,
        );

        await db.runAsync(
          `
          UPDATE idiom_translations
          SET text = ?
          WHERE idiom_id = ?
            AND language_id = ?
          `,
          translationText,
          editingIdiom.idiom_id,
          languages.toId,
        );
      });

      setEditingIdiom(null);
      setEditIdiomText("");
      setEditTranslationText("");
      setEditError("");

      await loadIdioms();
    } catch (error) {
      console.error("Kunde inte redigera idiom:", error);
      setEditError("Kunde inte spara ändringarna. Försök igen.");
    } finally {
      setSavingEdit(false);
    }
  }

  // RADERA IDIOM

  function confirmDeleteIdiom() {
    if (!editingIdiom || savingEdit || deletingIdiom) return;

    Alert.alert(
      "Radera idiom?",
      `Vill du verkligen radera ”${editingIdiom.text_from}”?`,
      [
        {
          text: "Avbryt",
          style: "cancel",
        },
        {
          text: "Radera",
          style: "destructive",
          onPress: () => {
            void deleteIdiom();
          },
        },
      ],
    );
  }

  async function deleteIdiom() {
    if (!editingIdiom || savingEdit || deletingIdiom) return;

    const idiomId = editingIdiom.idiom_id;

    setDeletingIdiom(true);
    setEditError("");

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "DELETE FROM idiom_translations WHERE idiom_id = ?",
          idiomId,
        );

        await db.runAsync("DELETE FROM idioms WHERE id = ?", idiomId);
      });

      setEditingIdiom(null);
      setEditIdiomText("");
      setEditTranslationText("");
      setEditError("");

      await loadIdioms();
    } catch (error) {
      console.error("Kunde inte radera idiom:", error);
      setEditError("Kunde inte radera idiomet. Försök igen.");
    } finally {
      setDeletingIdiom(false);
    }
  }

  // SÖKNING

  const searchText = search.trim().toLowerCase();

  const visibleIdioms = idioms.filter(
    (item) =>
      item.text_from.toLowerCase().includes(searchText) ||
      item.text_to.toLowerCase().includes(searchText),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <BackButton
        onPress={() =>
          router.dismissTo({
            pathname: "/secondPage",
            params: { from, to },
          })
        }
      />

      <Text style={styles.title}>{t("idioms")}</Text>

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
              ? "Visa idiom bredvid varandra"
              : "Visa idiom under varandra"
          }
        >
          <FontAwesome
            name={displayMode === "stacked" ? "columns" : "bars"}
            size={14}
            color="#64748B"
          />
          <Text style={styles.displayModeLabel}>
            {displayMode === "stacked" ? "Bredvid varandra" : "Under varandra"}
          </Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {/* LUFTIGARE LISTA MED REDIGERINGSKNAPP */}

      <FlatList
        data={visibleIdioms}
        keyExtractor={(item) => String(item.idiom_id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View
              style={[
                styles.idiomContent,
                displayMode === "side" && styles.idiomContentSide,
              ]}
            >
              <Text
                style={[
                  styles.idiomText,
                  displayMode === "side" && styles.idiomTextSide,
                ]}
              >
                {item.text_from}
              </Text>

              <Text
                style={[
                  styles.translationText,
                  displayMode === "side" && styles.translationTextSide,
                ]}
              >
                {item.text_to}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => openEditIdiom(item)}
              style={styles.editButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Redigera ${item.text_from}`}
            >
              <FontAwesome name="pencil" size={13} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      />

      {/* SAMMA RUNDA PLUSKNAPP */}

      <TouchableOpacity
        style={styles.addIdiomButton}
        onPress={() => {
          setFormError("");
          setShowAddIdiom(true);
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Lägg till idiom"
      >
        <Text style={styles.addIdiomPlus}>+</Text>
      </TouchableOpacity>

      {/* LÄGG TILL IDIOM */}

      <Modal
        visible={showAddIdiom}
        transparent
        animationType="fade"
        onRequestClose={closeAddIdiom}
      >
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.categoryModal}>
              <Text style={styles.modalTitle}>Lägg till idiom</Text>

              <View style={styles.modalLanguagePair}>
                <Text style={styles.modalLanguageText}>
                  {fromLanguage ?? from}
                </Text>

                <Text style={styles.modalLanguageArrow}>→</Text>

                <Text style={styles.modalLanguageText}>{toLanguage ?? to}</Text>
              </View>

              <TextInput
                style={[styles.input, styles.idiomInput]}
                placeholder="Skriv idiomet eller uttrycket..."
                placeholderTextColor="#94A3B8"
                value={newIdiom}
                onChangeText={(value) => {
                  setNewIdiom(value);
                  setFormError("");
                }}
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />

              <TextInput
                style={[styles.input, styles.idiomInput]}
                placeholder="Skriv översättningen..."
                placeholderTextColor="#94A3B8"
                value={newTranslation}
                onChangeText={(value) => {
                  setNewTranslation(value);
                  setFormError("");
                }}
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />

              {!!formError && <Text style={styles.formError}>{formError}</Text>}

              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  saving && styles.disabledButton,
                ]}
                onPress={addIdiom}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {saving ? "Sparar..." : "Lägg till"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeAddIdiom}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Avbryt</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* REDIGERA IDIOM */}

      <Modal
        visible={editingIdiom !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEditIdiom}
      >
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.categoryModal}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={closeEditIdiom}
                disabled={savingEdit || deletingIdiom}
                accessibilityLabel="Stäng"
              >
                <Text style={styles.closeModalText}>×</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Redigera idiom</Text>

              <View style={styles.modalLanguagePair}>
                <Text style={styles.modalLanguageText}>
                  {fromLanguage ?? from}
                </Text>

                <Text style={styles.modalLanguageArrow}>→</Text>

                <Text style={styles.modalLanguageText}>{toLanguage ?? to}</Text>
              </View>

              <TextInput
                style={[styles.input, styles.idiomInput]}
                value={editIdiomText}
                onChangeText={(value) => {
                  setEditIdiomText(value);
                  setEditError("");
                }}
                placeholder="Idiom eller uttryck..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />

              <TextInput
                style={[styles.input, styles.idiomInput]}
                value={editTranslationText}
                onChangeText={(value) => {
                  setEditTranslationText(value);
                  setEditError("");
                }}
                placeholder="Översättning..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />

              {!!editError && <Text style={styles.formError}>{editError}</Text>}

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={confirmDeleteIdiom}
                  disabled={savingEdit || deletingIdiom}
                >
                  <Text style={styles.deleteButtonText}>{t("delete")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    (savingEdit || deletingIdiom) && styles.disabledButton,
                  ]}
                  onPress={saveEditedIdiom}
                  disabled={savingEdit || deletingIdiom}
                >
                  <Text style={styles.saveButtonText}>
                    {savingEdit ? "Sparar..." : t("save")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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

  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
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
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 10,
  },
  displayModeLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  idiomContentSide: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  idiomTextSide: {
    flex: 1,
    marginBottom: 0,
  },
  translationTextSide: {
    flex: 1,
    marginTop: 0,
  },

  // LUFTIGARE IDIOMLISTA

  listContent: {
    paddingBottom: 30,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 18,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF3",
  },

  idiomContent: {
    flex: 1,
    paddingRight: 12,
  },

  idiomText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 24,
    marginBottom: 9,
  },

  translationText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 22,
  },

  editButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  // PLUSKNAPP

  addIdiomButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignSelf: "flex-end",
    marginBottom: 12,
    marginRight: 2,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  addIdiomPlus: {
    fontSize: 21,
    lineHeight: 23,
    color: "#2563EB",
    fontWeight: "500",
  },

  // MODALER

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.30)",
  },

  modalScroll: {
    flex: 1,
  },

  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  categoryModal: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 22,
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 18,
    paddingRight: 25,
  },

  closeModalButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  closeModalText: {
    fontSize: 28,
    lineHeight: 30,
    color: "#6B7280",
  },

  modalLanguagePair: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  modalLanguageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  modalLanguageArrow: {
    color: "#94A3B8",
    marginHorizontal: 8,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: "#0F172A",
    marginTop: 5,
    fontSize: 15,
  },

  idiomInput: {
    minHeight: 90,
    marginBottom: 10,
  },

  modalPrimaryButton: {
    width: 160,
    height: 46,
    alignSelf: "center",
    borderRadius: 12,
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  formError: {
    color: "#9A5B22",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },

  modalPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  modalCancelButton: {
    width: 160,
    height: 46,
    alignSelf: "center",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  modalCancelText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "600",
  },

  // REDIGERING OCH RADERING

  editActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  deleteButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  deleteButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },

  saveButton: {
    backgroundColor: "#E0E7FF",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  saveButtonText: {
    color: "#4338CA",
    fontSize: 14,
    fontWeight: "600",
  },
});
