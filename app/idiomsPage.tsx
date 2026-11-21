import { styles as idiomsStyles } from "@/components/idioms/idioms-styles";
import { IDIOM_UI as idiomUiTranslations } from "@/components/idioms/idioms-translations";
import type { Idiom } from "@/components/idioms/idioms-types";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { LanguagePicker } from "@/components/language-picker";
import { SearchBar } from "@/components/search-bar";
import { useUiLanguage } from "@/context/ui-language-context";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’‘`´]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Diskret vattenstämpel – tre personer, placerad bakom innehållet.
function InterpreterWatermark() {
  return (
    <View
      pointerEvents="none"
      style={styles.watermark}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.person, styles.personLeft]}>
        <View style={[styles.personHead, { backgroundColor: "#A8CBE7" }]} />
        <View style={[styles.personBody, { backgroundColor: "#A8CBE7" }]} />
      </View>
      <View style={[styles.person, styles.personCenter]}>
        <View style={[styles.personHead, { backgroundColor: "#285F9D" }]} />
        <View style={[styles.personBody, { backgroundColor: "#285F9D" }]} />
        <View style={styles.badgeCord} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>TolkAppen</Text>
        </View>
      </View>
      <View style={[styles.person, styles.personRight]}>
        <View style={[styles.personHead, { backgroundColor: "#A8CBE7" }]} />
        <View style={[styles.personBody, { backgroundColor: "#A8CBE7" }]} />
      </View>
    </View>
  );
}

export default function IdiomsPage() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { t, language } = useUiLanguage();
  const ui =
    idiomUiTranslations[
      language === "en" || language === "es" ? language : "sv"
    ];

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
  const [newThirdTranslation, setNewThirdTranslation] = useState("");
  const [newInfo, setNewInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Redigera idiom
  const [editingIdiom, setEditingIdiom] = useState<Idiom | null>(null);
  const [editIdiomText, setEditIdiomText] = useState("");
  const [editTranslationText, setEditTranslationText] = useState("");
  const [editThirdTranslation, setEditThirdTranslation] = useState("");
  const [editInfo, setEditInfo] = useState("");
  const [showInfo, setShowInfo] = useState<string | null>(null);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingIdiom, setDeletingIdiom] = useState(false);

  const fromLanguage = languageNames[String(from ?? "").toLowerCase()];

  const toLanguage = languageNames[String(to ?? "").toLowerCase()];
  const thirdLanguage = Object.values(languageNames).find(
    (name) => name !== fromLanguage && name !== toLanguage,
  );

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

  // Säkerställ att äldre databaser också kan lagra frivillig idiominformation.
  const ensureIdiomInfoColumn = useCallback(async () => {
    const columns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(idioms)",
    );
    if (!columns.some((column) => column.name === "info")) {
      await db.execAsync("ALTER TABLE idioms ADD COLUMN info TEXT");
    }
  }, [db]);

  const loadIdioms = useCallback(async () => {
    if (!fromLanguage || !toLanguage) return;

    try {
      await ensureIdiomInfoColumn();
      const result = await db.getAllAsync<Idiom>(
        `
        SELECT
          from_translation.idiom_id,
          from_translation.text AS text_from,
          to_translation.text AS text_to,
          idioms.info AS info
        FROM idiom_translations AS from_translation
        INNER JOIN idioms ON idioms.id = from_translation.idiom_id
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
  }, [db, fromLanguage, toLanguage, ensureIdiomInfoColumn]);

  useFocusEffect(
    useCallback(() => {
      void loadIdioms();
    }, [loadIdioms]),
  );
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

    if (!fromRow || !toRow || !thirdLanguage) return null;

    const thirdRow = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM languages WHERE name = ?",
      thirdLanguage,
    );
    if (!thirdRow) return null;

    return {
      fromId: fromRow.id,
      toId: toRow.id,
      thirdId: thirdRow.id,
    };
  }

  // LÄGG TILL IDIOM

  function closeAddIdiom() {
    if (saving) return;

    setNewIdiom("");
    setNewTranslation("");
    setNewThirdTranslation("");
    setNewInfo("");
    setFormError("");
    setShowAddIdiom(false);
  }

  async function addIdiom() {
    if (saving) return;

    const idiomText = newIdiom.trim();
    const translationText = newTranslation.trim();
    const thirdText = newThirdTranslation.trim();
    const infoText = newInfo.trim();

    if (!idiomText || !translationText) {
      setFormError(ui.required);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await ensureIdiomInfoColumn();
      const languages = await getLanguageIds();

      if (!languages) {
        setFormError(ui.languagesMissing);
        return;
      }

      const existing = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM idioms WHERE LOWER(name) = LOWER(?)",
        idiomText,
      );

      if (existing) {
        setFormError(ui.duplicate);
        return;
      }

      await db.withExclusiveTransactionAsync(async (txn) => {
        const inserted = await txn.runAsync(
          "INSERT INTO idioms (name, info) VALUES (?, ?)",
          idiomText,
          infoText || null,
        );

        const idiomId = inserted.lastInsertRowId;

        await txn.runAsync(
          `INSERT INTO idiom_translations
           (idiom_id, language_id, text)
           VALUES (?, ?, ?)`,
          idiomId,
          languages.fromId,
          idiomText,
        );

        await txn.runAsync(
          `INSERT INTO idiom_translations
           (idiom_id, language_id, text)
           VALUES (?, ?, ?)`,
          idiomId,
          languages.toId,
          translationText,
        );
        if (thirdText) {
          await txn.runAsync(
            "INSERT INTO idiom_translations (idiom_id, language_id, text) VALUES (?, ?, ?)",
            idiomId,
            languages.thirdId,
            thirdText,
          );
        }
      });

      setNewIdiom("");
      setNewTranslation("");
      setNewThirdTranslation("");
      setNewInfo("");
      setShowAddIdiom(false);

      await loadIdioms();
    } catch (error) {
      console.error("Kunde inte spara idiom:", error);
      setFormError(ui.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  // REDIGERA IDIOM

  async function openEditIdiom(item: Idiom) {
    setEditingIdiom(item);
    setEditIdiomText(item.text_from);
    setEditTranslationText(item.text_to);
    setEditThirdTranslation("");
    setEditInfo(item.info ?? "");
    try {
      const languages = await getLanguageIds();
      if (!languages) return;
      const third = await db.getFirstAsync<{ text: string }>(
        "SELECT text FROM idiom_translations WHERE idiom_id = ? AND language_id = ?",
        item.idiom_id,
        languages.thirdId,
      );
      setEditThirdTranslation(third?.text ?? "");
    } catch (error) {
      console.error("Kunde inte läsa tredje språket:", error);
      setEditError(ui.loadThirdFailed);
    }
  }

  function closeEditIdiom() {
    if (savingEdit || deletingIdiom) return;

    setEditingIdiom(null);
    setEditIdiomText("");
    setEditTranslationText("");
    setEditThirdTranslation("");
    setEditInfo("");
    setEditError("");
  }

  async function saveEditedIdiom() {
    if (!editingIdiom || savingEdit || deletingIdiom) return;

    const idiomText = editIdiomText.trim();
    const translationText = editTranslationText.trim();
    const thirdText = editThirdTranslation.trim();
    const infoText = editInfo.trim();

    if (!idiomText || !translationText) {
      setEditError(ui.required);
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      await ensureIdiomInfoColumn();
      const languages = await getLanguageIds();

      if (!languages) {
        setEditError(ui.languagesMissing);
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
        setEditError(ui.duplicate);
        return;
      }

      // Namnet i idioms-tabellen uppdateras också,
      // så att databasen hålls konsekvent.
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync(
          `
          UPDATE idioms
          SET name = ?, info = ?
          WHERE id = ?
          `,
          idiomText,
          infoText || null,
          editingIdiom.idiom_id,
        );

        await txn.runAsync(
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

        await txn.runAsync(
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
        await txn.runAsync(
          "DELETE FROM idiom_translations WHERE idiom_id = ? AND language_id = ?",
          editingIdiom.idiom_id,
          languages.thirdId,
        );
        if (thirdText) {
          await txn.runAsync(
            "INSERT INTO idiom_translations (idiom_id, language_id, text) VALUES (?, ?, ?)",
            editingIdiom.idiom_id,
            languages.thirdId,
            thirdText,
          );
        }
      });

      setEditingIdiom(null);
      setEditIdiomText("");
      setEditTranslationText("");
      setEditThirdTranslation("");
      setEditError("");

      await loadIdioms();
    } catch (error) {
      console.error("Kunde inte redigera idiom:", error);
      setEditError(ui.editFailed);
    } finally {
      setSavingEdit(false);
    }
  }

  // RADERA IDIOM

  function confirmDeleteIdiom() {
    if (!editingIdiom || savingEdit || deletingIdiom) return;

    Alert.alert(
      ui.deleteTitle,
      `${ui.deleteMessage} ”${editingIdiom.text_from}”?`,
      [
        {
          text: ui.cancel,
          style: "cancel",
        },
        {
          text: ui.delete,
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
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync(
          "DELETE FROM idiom_translations WHERE idiom_id = ?",
          idiomId,
        );

        await txn.runAsync("DELETE FROM idioms WHERE id = ?", idiomId);
      });

      setEditingIdiom(null);
      setEditIdiomText("");
      setEditTranslationText("");
      setEditError("");

      await loadIdioms();
    } catch (error) {
      console.error("Kunde inte radera idiom:", error);
      setEditError(ui.deleteFailed);
    } finally {
      setDeletingIdiom(false);
    }
  }

  // SÖKNING

 const searchText = normalizeSearchText(search);

const visibleIdioms = idioms.filter(
  (item) =>
    normalizeSearchText(item.text_from).includes(searchText) ||
    normalizeSearchText(item.text_to).includes(searchText),
);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <InterpreterWatermark />
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
            displayMode === "stacked" ? ui.showSide : ui.showStacked
          }
        >
          <FontAwesome
            name={displayMode === "stacked" ? "columns" : "bars"}
            size={14}
            color="#71859B"
          />
          <Text style={styles.displayModeLabel}>
            {displayMode === "stacked" ? ui.side : ui.stacked}
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

            {!!item.info?.trim() && (
              <TouchableOpacity
                onPress={() => setShowInfo(item.info)}
                style={styles.infoButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${ui.showInfo} ${item.text_from}`}
              >
                <FontAwesome name="info-circle" size={15} color="#285F9D" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => openEditIdiom(item)}
              style={styles.editButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`${ui.editItem} ${item.text_from}`}
            >
              <FontAwesome name="pencil" size={13} color="#8194A9" />
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
        accessibilityLabel={ui.addIdiom}
      >
        <Text style={styles.addIdiomPlus}>+</Text>
      </TouchableOpacity>

      {/* Visa sparad information för idiomet. */}
      <Modal
        visible={showInfo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(null)}
      >
        <View style={[styles.modalBackground, styles.infoModalBackground]}>
          <View style={styles.categoryModal}>
            <Text style={styles.modalTitle}>{ui.info}</Text>
            <Text style={styles.infoText}>{showInfo}</Text>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowInfo(null)}
              accessibilityRole="button"
              accessibilityLabel={ui.closeInfo}
            >
              <Text style={styles.modalCancelText}>{ui.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              <Text style={styles.modalTitle}>{ui.addIdiom}</Text>

              <Text style={styles.addFieldLabel}>{fromLanguage ?? from}</Text>
              <TextInput
                style={[styles.input, styles.idiomInput]}
                value={newIdiom}
                onChangeText={(value) => {
                  setNewIdiom(value);
                  setFormError("");
                }}
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />

              <Text style={styles.addFieldLabel}>{toLanguage ?? to}</Text>

              <TextInput
                style={[styles.input, styles.idiomInput]}
                value={newTranslation}
                onChangeText={(value) => {
                  setNewTranslation(value);
                  setFormError("");
                }}
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />

              <Text style={styles.addFieldLabel}>
                {thirdLanguage} ({ui.optional})
              </Text>
              <TextInput
                style={[styles.input, styles.idiomInput]}
                value={newThirdTranslation}
                onChangeText={setNewThirdTranslation}
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />

              <Text style={styles.addFieldLabel}>{ui.optionalInfo}</Text>

              <TextInput
                style={[styles.input, styles.idiomInput]}
                value={newInfo}
                onChangeText={setNewInfo}
                multiline
                textAlignVertical="top"
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
                  {saving ? ui.saving : ui.add}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeAddIdiom}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>{ui.cancel}</Text>
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
                accessibilityLabel={ui.close}
              >
                <Text style={styles.closeModalText}>×</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>{ui.editIdiom}</Text>

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
                placeholder={ui.idiomPlaceholder}
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
                placeholder={ui.translationPlaceholder}
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />

              <Text style={styles.addFieldLabel}>
                {thirdLanguage} ({ui.optional})
              </Text>
              <TextInput
                style={[styles.input, styles.idiomInput]}
                value={editThirdTranslation}
                onChangeText={setEditThirdTranslation}
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />

              <TextInput
                style={[styles.input, styles.idiomInput]}
                placeholder={ui.infoOptional}
                placeholderTextColor="#94A3B8"
                value={editInfo}
                onChangeText={setEditInfo}
                multiline
                textAlignVertical="top"
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
                    {savingEdit ? ui.saving : t("save")}
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

const styles = idiomsStyles;
