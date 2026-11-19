import { styles } from "@/components/dictionary/dictionary-styles";
import { FontAwesome } from "@expo/vector-icons";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

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

type ImportCategoryModalProps = {
  visible: boolean;
  importBusy: boolean;
  importStep: "categories" | "mode" | "words";
  importSources: WordCategory[];
  importSource: WordCategory | null;
  importWords: Translation[];
  importSelectedIds: number[];
  importError: string;

  ui: (key: string) => string;
  importCategoryName: (item: WordCategory) => string;

  onClose: () => void;
  onSelectSource: (item: WordCategory) => void;
  onImportWords: (wordIds: number[]) => void;
  onChooseWords: () => void;
  onToggleWord: (wordId: number) => void;
  onBack: () => void;
};

export function ImportCategoryModal({
  visible,
  importBusy,
  importStep,
  importSources,
  importSource,
  importWords,
  importSelectedIds,
  importError,
  ui,
  importCategoryName,
  onClose,
  onSelectSource,
  onImportWords,
  onChooseWords,
  onToggleWord,
  onBack,
}: ImportCategoryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!importBusy) onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <TouchableOpacity
            onPress={() => {
              if (!importBusy) onClose();
            }}
            style={styles.closeModalButton}
            disabled={importBusy}
          >
            <Text style={styles.closeModalText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.editTitle}>{ui("Importera från kategori")}</Text>

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
                      onPress={() => onSelectSource(item)}
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
                onPress={() =>
                  onImportWords(importWords.map((item) => item.word_id))
                }
              >
                <Text style={styles.addCategoryChoiceText}>
                  {ui("✓ Välj hela kategorin")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addCategoryChoice}
                disabled={importBusy || importWords.length === 0}
                onPress={onChooseWords}
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
                      onPress={() => onToggleWord(item.word_id)}
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
                onPress={() => onImportWords(importSelectedIds)}
              >
                <Text style={styles.addSaveButtonText}>
                  {ui("Importera valda")} ({importSelectedIds.length})
                </Text>
              </TouchableOpacity>
            </>
          )}

          {!!importError && <Text style={styles.editError}>{importError}</Text>}

          {importStep !== "categories" && (
            <TouchableOpacity
              style={styles.importBackButton}
              disabled={importBusy}
              onPress={onBack}
            >
              <Text style={styles.editCategoryToggleText}>
                {ui("‹ Tillbaka")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
