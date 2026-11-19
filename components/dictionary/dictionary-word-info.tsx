import { styles } from "@/components/dictionary/dictionary-styles";
import type { Translation } from "@/components/dictionary/dictionary-types";
import { FontAwesome } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type InfoLocation = "results" | "list";

type SelectedInformation = {
  wordId: number;
  location: InfoLocation;
} | null;

type WordInfoPopupProps = {
  item: Translation;
  location: InfoLocation;
  selectedInformation: SelectedInformation;
};

export function WordInfoPopup({
  item,
  location,
  selectedInformation,
}: WordInfoPopupProps) {
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

type WordInfoButtonProps = {
  item: Translation;
  location: InfoLocation;
  selectedInformation: SelectedInformation;
  onSelectInformation: (
    updater: (current: SelectedInformation) => SelectedInformation,
  ) => void;
  ui: (key: string) => string;
};

export function WordInfoButton({
  item,
  location,
  selectedInformation,
  onSelectInformation,
  ui,
}: WordInfoButtonProps) {
  if (!item.information?.trim()) return null;

  return (
    <TouchableOpacity
      style={styles.infoButton}
      onPressIn={(event) => event.stopPropagation()}
      onPress={() =>
        onSelectInformation((current) =>
          current?.wordId === item.word_id && current.location === location
            ? null
            : { wordId: item.word_id, location },
        )
      }
      accessibilityRole="button"
      accessibilityLabel={`${ui("Visa information om")} ${item.text_from}`}
      hitSlop={6}
    >
      <FontAwesome name="info-circle" size={15} color="#285F9D" />
    </TouchableOpacity>
  );
}
