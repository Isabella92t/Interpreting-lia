import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";

import { AppTextInput } from "@/components/app-text-input";
import { WORD_LANGUAGES, languageNames } from "@/constants/languages";
import { useUiLanguage } from "@/context/ui-language-context";

type Props = {
  fromCode: string;
  toCode: string;
  // Texten i varje fält, med språkkoden som nyckel.
  // Till exempel { sv: "domstol", es: "tribunal" }.
  texts: Record<string, string>;
  onChangeText: (code: string, text: string) => void;
  labelStyle: StyleProp<TextStyle>;
  inputStyle: StyleProp<TextStyle>;
  multiline?: boolean;
};

// Fälten för språken när man lägger till ett ord eller idiom.
//
// De två språken man översätter mellan visas alltid.
// Under dem finns en "+"-knapp för varje annat språk.
// Ett språk man har lagt till kan tas bort med krysset.
export function LanguageFields({
  fromCode,
  toCode,
  texts,
  onChangeText,
  labelStyle,
  inputStyle,
  multiline = false,
}: Props) {
  const { t } = useUiLanguage();

  // Språken man har lagt till med "+"-knappen.
  const [addedCodes, setAddedCodes] = useState<string[]>([]);

  const shownCodes = [fromCode, toCode, ...addedCodes];

  const otherLanguages = WORD_LANGUAGES.filter(
    (language) => !shownCodes.includes(language.code),
  );

  function addLanguage(code: string) {
    setAddedCodes([...addedCodes, code]);
  }

  function removeLanguage(code: string) {
    setAddedCodes(addedCodes.filter((addedCode) => addedCode !== code));
    // Texten i fältet ska inte sparas när fältet är borta.
    onChangeText(code, "");
  }

  return (
    <>
      {shownCodes.map((code) => (
        <View key={code}>
          <View style={styles.labelRow}>
            <Text style={labelStyle}>{languageNames[code] ?? code}</Text>

            {addedCodes.includes(code) && (
              <TouchableOpacity
                onPress={() => removeLanguage(code)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`${t("removeLanguage")} ${languageNames[code]}`}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <AppTextInput
            style={inputStyle}
            value={texts[code] ?? ""}
            onChangeText={(text) => onChangeText(code, text)}
            multiline={multiline}
            textAlignVertical={multiline ? "top" : undefined}
          />
        </View>
      ))}

      {otherLanguages.length > 0 && (
        <View style={styles.addRow}>
          {otherLanguages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={styles.addButton}
              onPress={() => addLanguage(language.code)}
              accessibilityRole="button"
              accessibilityLabel={`${t("addLanguage")} ${language.name}`}
            >
              <Text style={styles.addButtonText}>+ {language.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  removeText: {
    fontSize: 16,
    color: "#64748B",
    paddingHorizontal: 4,
  },

  addRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },

  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EAF3FA",
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#285F9D",
  },
});
