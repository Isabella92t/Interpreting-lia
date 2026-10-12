import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";

// Samma tillbaka-knapp på alla sidor.
// hitSlop gör ytan man kan trycka på större än själva cirkeln,
// så att knappen är lätt att träffa med fingret.
export function BackButton({ onPress }: { onPress: () => void }) {
  const { t } = useUiLanguage();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={t("back")}
    >
      <Text style={styles.arrow}>←</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  arrow: {
    fontSize: 21,
    color: "#334155",
  },
});
