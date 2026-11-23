import { useId } from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";

import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";

// Använd den här istället för TextInput i hela appen.
//
// Problemet: iPhonens tangentbord har ingen knapp som stänger det.
// I ett fält med flera rader (multiline) gör Retur bara en ny rad,
// så då går tangentbordet inte att stänga alls.
//
// Lösningen: på iPhone visas en rad med knappen "Klar" ovanför
// tangentbordet. Knappen stänger tangentbordet.
// Android har redan en egen knapp för det, så där visas ingen rad.
export function AppTextInput(props: TextInputProps) {
  const { t } = useUiLanguage();

  // Varje fält behöver ett eget id. iPhone kopplar raden med "Klar"
  // till det fält som har samma id.
  const id = useId();

  if (Platform.OS !== "ios") {
    return <TextInput {...props} />;
  }

  return (
    <>
      <TextInput {...props} inputAccessoryViewID={id} />

      <InputAccessoryView nativeID={id}>
        <View style={styles.bar}>
          <TouchableOpacity
            onPress={Keyboard.dismiss}
            hitSlop={10}
            accessibilityRole="button"
          >
            <Text style={styles.doneText}>{t("done")}</Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  doneText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.primary,
  },
});
