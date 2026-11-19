import { styles } from "@/components/dictionary/dictionary-styles";
import type { Translation } from "@/components/dictionary/dictionary-types";
import { FontAwesome } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type DictionaryWordRowProps = {
  item: Translation;
  displayMode: "stacked" | "side";
  showEditPencils: boolean;
  ui: (key: string) => string;
  onEditWord: (item: Translation) => void;
  renderInfoButton: (item: Translation, location: "list") => ReactNode;
  renderInfoPopup: (item: Translation, location: "list") => ReactNode;
};

export function DictionaryWordRow({
  item,
  displayMode,
  showEditPencils,
  ui,
  onEditWord,
  renderInfoButton,
  renderInfoPopup,
}: DictionaryWordRowProps) {
  return (
    <View style={styles.row}>
      {displayMode === "side" ? (
        <View style={styles.wordRow}>
          <Text style={[styles.word, styles.sideColumn]}>{item.text_from}</Text>

          <Text style={[styles.translation, styles.sideColumnTranslation]}>
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
                onPress={() => onEditWord(item)}
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
                  onPress={() => onEditWord(item)}
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

          <Text style={styles.translation}>{item.text_to}</Text>
        </>
      )}

      {renderInfoPopup(item, "list")}
    </View>
  );
}
