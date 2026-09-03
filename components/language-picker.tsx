import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { uiLanguages } from "@/constants/translations";
import { useUiLanguage } from "@/context/ui-language-context";

// Jordglob-knappen som byter sprak i hela appen.
// Ligger uppe till hoger pa sidan den anvands.
export function LanguagePicker() {
  const { language, setLanguage, t } = useUiLanguage();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity style={styles.globe} onPress={() => setIsOpen(true)}>
        <FontAwesome name="globe" size={22} color="#111827" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.background}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>{t("appLanguage")}</Text>

            {uiLanguages.map((item) => {
              const isSelected = item.code === language;

              return (
                <TouchableOpacity
                  key={item.code}
                  style={styles.option}
                  onPress={() => {
                    setLanguage(item.code);
                    setIsOpen(false);
                  }}
                >
                  <Text
                    style={isSelected ? styles.optionSelected : styles.optionText}
                  >
                    {item.label}
                  </Text>

                  {isSelected && (
                    <FontAwesome name="check" size={14} color="#111827" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  globe: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  background: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 80,
    paddingRight: 24,
  },

  menu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 6,
    minWidth: 180,
  },

  menuTitle: {
    fontSize: 12,
    color: "#6b7280",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  optionText: {
    fontSize: 15,
    color: "#111827",
  },

  optionSelected: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
});
