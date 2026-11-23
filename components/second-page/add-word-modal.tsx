import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppTextInput } from "@/components/app-text-input";
import { useUiLanguage } from "@/context/ui-language-context";
import { languageNames, pageTexts } from "./second-page-helpers";
import { styles } from "./second-page-styles";

type CategoryOption = {
  key: string;
  name: string;
};

type AddWordModalProps = {
  visible: boolean;
  from?: string;
  to?: string;
  word: string;
  translation: string;
  thirdTranslation: string;
  information: string;
  categories: CategoryOption[];
  selectedCategories: string[];
  error: string;
  saving: boolean;
  onWordChange: (value: string) => void;
  onTranslationChange: (value: string) => void;
  onThirdTranslationChange: (value: string) => void;
  onInformationChange: (value: string) => void;
  onToggleCategory: (key: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function AddWordModal({
  visible,
  from,
  to,
  word,
  translation,
  thirdTranslation,
  information,
  categories,
  selectedCategories,
  error,
  saving,
  onWordChange,
  onTranslationChange,
  onThirdTranslationChange,
  onInformationChange,
  onToggleCategory,
  onSave,
  onClose,
}: AddWordModalProps) {
  const { t, language } = useUiLanguage();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const texts =
    pageTexts[String(language).toLowerCase() as keyof typeof pageTexts] ??
    pageTexts.sv;

  const fromCode = String(from ?? "").toLowerCase();
  const toCode = String(to ?? "").toLowerCase();

  const thirdCode =
    ["sv", "en", "es"].find((code) => code !== fromCode && code !== toCode) ??
    "en";

  function close() {
    if (saving) return;
    setShowCategoryPicker(false);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.modalBackground}>
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.categoryModal}>
            <Text style={styles.modalTitle}>{t("addWord")}</Text>

            <Text style={styles.languageLabel}>
              {languageNames[fromCode] ?? from}
            </Text>
            <AppTextInput
              style={styles.input}
              value={word}
              onChangeText={onWordChange}
            />

            <Text style={styles.languageLabel}>
              {languageNames[toCode] ?? to}
            </Text>
            <AppTextInput
              style={styles.input}
              value={translation}
              onChangeText={onTranslationChange}
            />

            <Text style={styles.languageLabel}>{languageNames[thirdCode]}</Text>
            <AppTextInput
              style={styles.input}
              value={thirdTranslation}
              onChangeText={onThirdTranslationChange}
            />

            <Text style={styles.informationLabel}>
              {texts.optionalInformation}
            </Text>
            <AppTextInput
              style={[styles.input, styles.informationInput]}
              value={information}
              onChangeText={onInformationChange}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.categoryTitle}>{t("category")}</Text>
            <Text style={styles.optionalText}>{t("categoryOptional")}</Text>

            <TouchableOpacity
              style={styles.categoryPickerButton}
              onPress={() => setShowCategoryPicker((current) => !current)}
              accessibilityRole="button"
              accessibilityState={{
                expanded: showCategoryPicker,
              }}
            >
              <Text style={styles.categoryPickerButtonText}>
                {texts.chooseCategory}
                {selectedCategories.length > 0
                  ? ` (${selectedCategories.length})`
                  : ""}
              </Text>

              <FontAwesome
                name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                size={14}
                color="#285F9D"
              />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.categoryPickerPanel}>
                <ScrollView
                  style={styles.categoryPickerScroll}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {categories.map((category) => {
                    const checked = selectedCategories.includes(category.key);

                    return (
                      <TouchableOpacity
                        key={category.key}
                        style={
                          checked ? styles.selectedCategory : styles.category
                        }
                        onPress={() => onToggleCategory(category.key)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked }}
                      >
                        <Text
                          style={
                            checked
                              ? styles.selectedCategoryText
                              : styles.categoryOptionText
                          }
                        >
                          {checked ? "✓  " : ""}
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={styles.categoryPickerDone}
                  onPress={() => setShowCategoryPicker(false)}
                >
                  <Text style={styles.categoryPickerDoneText}>
                    {texts.done}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!!error && <Text style={styles.formError}>{error}</Text>}

            <TouchableOpacity
              style={[
                styles.modalPrimaryButton,
                saving && styles.disabledButton,
              ]}
              onPress={onSave}
              disabled={saving}
            >
              <Text style={styles.modalPrimaryButtonText}>
                {saving ? texts.saving : t("add")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={close}
              disabled={saving}
            >
              <Text style={styles.modalCancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
