import { styles } from "@/components/dictionary/dictionary-styles";
import type { Translation } from "@/components/dictionary/dictionary-types";
import { FontAwesome } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type InfoLocation = "results" | "list";

// Varje öppen informationsruta har en egen nyckel, till exempel "list:12".
// Samma ord kan visas både bland sökresultaten och i listan,
// därför ingår platsen i nyckeln.
export function informationKey(item: Translation, location: InfoLocation) {
  return `${location}:${item.word_id}`;
}

type WordInfoPopupProps = {
  item: Translation;
  location: InfoLocation;
  openInformation: string[];
};

export function WordInfoPopup({
  item,
  location,
  openInformation,
}: WordInfoPopupProps) {
  if (!openInformation.includes(informationKey(item, location))) {
    return null;
  }

  return (
    <View style={styles.inlineInfoPopup}>
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
  openInformation: string[];
  onToggleInformation: (key: string) => void;
  ui: (key: string) => string;
};

// Knappen visar eller döljer informationen för just det här ordet.
// Flera ord kan ha informationen öppen samtidigt.
export function WordInfoButton({
  item,
  location,
  openInformation,
  onToggleInformation,
  ui,
}: WordInfoButtonProps) {
  if (!item.information?.trim()) return null;

  const key = informationKey(item, location);

  return (
    <TouchableOpacity
      style={styles.infoButton}
      onPress={() => onToggleInformation(key)}
      accessibilityRole="button"
      accessibilityLabel={`${ui("Visa information om")} ${item.text_from}`}
      accessibilityState={{ expanded: openInformation.includes(key) }}
      hitSlop={6}
    >
      <FontAwesome name="info-circle" size={15} color="#285F9D" />
    </TouchableOpacity>
  );
}
