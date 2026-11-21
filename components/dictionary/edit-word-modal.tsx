import { styles } from "@/components/dictionary/dictionary-styles";
import { useUiLanguage } from "@/context/ui-language-context";
import { FontAwesome } from "@expo/vector-icons";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type WordCategory = {
  id: number;
  name: string;
  name_sv: string | null;
  name_en: string | null;
  name_es: string | null;
};

type EditWordModalProps = {
  visible: boolean;

  fromLanguage: string;
  toLanguage: string;
  language: string;

  editTextFrom: string;
  editTextTo: string;
  editInformation: string;
  editError: string;

  editCategories: WordCategory[];
  editCategoryIds: number[];
  showEditCategories: boolean;
  loadingEditCategories: boolean;

  savingEdit: boolean;
  deletingWord: boolean;

  ui: (key: string) => string;
  t: ReturnType<typeof useUiLanguage>["t"];

  onClose: () => void;
  onEditTextFromChange: (value: string) => void;
  onEditTextToChange: (value: string) => void;
  onEditInformationChange: (value: string) => void;
  onToggleCategories: () => void;
  onToggleCategory: (id: number) => void;
  onCategoriesDone: () => void;
  onDelete: () => void;
  onSave: () => void;
};

export function EditWordModal({
  visible,
  fromLanguage,
  toLanguage,
  language,
  editTextFrom,
  editTextTo,
  editInformation,
  editError,
  editCategories,
  editCategoryIds,
  showEditCategories,
  loadingEditCategories,
  savingEdit,
  deletingWord,
  ui,
  t,
  onClose,
  onEditTextFromChange,
  onEditTextToChange,
  onEditInformationChange,
  onToggleCategories,
  onToggleCategory,
  onCategoriesDone,
  onDelete,
  onSave,
}: EditWordModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          {/* STÄNG */}
          <TouchableOpacity onPress={onClose} style={styles.closeModalButton}>
            <Text style={styles.closeModalText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.editTitle}>{ui("Redigera ord")}</Text>

          {/* FÖRSTA SPRÅKET */}
          <Text style={styles.editLabel}>{fromLanguage}</Text>

          <TextInput
            value={editTextFrom}
            onChangeText={onEditTextFromChange}
            style={styles.editInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* ANDRA SPRÅKET */}
          <Text style={styles.editLabel}>{toLanguage}</Text>

          <TextInput
            value={editTextTo}
            onChangeText={onEditTextToChange}
            style={styles.editInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* INFORMATION */}
          <Text style={styles.editLabel}>{ui("Information (valfritt)")}</Text>

          <TextInput
            value={editInformation}
            onChangeText={onEditInformationChange}
            style={[styles.editInput, styles.editInformationInput]}
            multiline
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect={false}
          />

          {/* KATEGORIER */}
          <TouchableOpacity
            style={styles.editCategoryToggle}
            onPress={onToggleCategories}
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
                      onPress={() => onToggleCategory(item.id)}
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
                onPress={onCategoriesDone}
              >
                <Text style={styles.editCategoryToggleText}>{ui("Klar")}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* FELMEDDELANDE */}
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
              onPress={onDelete}
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
              onPress={onSave}
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
  );
}
