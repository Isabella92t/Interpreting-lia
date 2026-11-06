import { FontAwesome } from "@expo/vector-icons";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";

import { colors } from "@/constants/colors";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  style?: ViewStyle;
};

// Samma sökruta på alla sidor.
export function SearchBar({ value, onChangeText, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <FontAwesome name="search" size={16} color="#94A3B8" />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel="Sök"
        // Telefonen ska inte rätta eller ändra orden man söker på.
        // Annars kan till exempel ett spanskt ord bytas mot ett
        // engelskt, och då hittar sökningen ingenting.
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        returnKeyType="search"
      />

      {/* Krysset tömmer sökrutan. */}
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={10}>
          <FontAwesome name="times-circle" size={16} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },

  input: {
    flex: 1,
    height: "100%",
    marginLeft: 11,
    fontSize: 16,
    color: colors.text,
  },
});
