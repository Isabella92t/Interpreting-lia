import { colors } from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { LanguagePicker } from "@/components/language-picker";
import { useAuth } from "@/context/auth-context";
import { useUiLanguage } from "@/context/ui-language-context";

const languages = [
  { label: "Svenska", value: "sv", flag: "🇸🇪" },
  { label: "Español", value: "es", flag: "🇪🇸" },
  { label: "English", value: "en", flag: "🇬🇧" },
];

export default function FirstPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useUiLanguage();

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const [fromLanguage, setFromLanguage] = useState<string | null>(null);
  const [toLanguage, setToLanguage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const canContinue = Boolean(fromLanguage && toLanguage);

  /*
   * FRÅN:
   *
   * Om inget är valt under TILL:
   * → visa alla 3 språk.
   *
   * Om TILL redan är valt:
   * → ta bort det språket.
   */
  const fromLanguages = languages.filter(
    (language) => language.value !== toLanguage,
  );

  /*
   * TILL:
   *
   * Om inget är valt under FRÅN:
   * → visa alla 3 språk.
   *
   * Om FRÅN redan är valt:
   * → ta bort det språket.
   */
  const toLanguages = languages.filter(
    (language) => language.value !== fromLanguage,
  );

  function getLanguage(value: string | null) {
    if (!value) {
      return null;
    }

    return languages.find((language) => language.value === value);
  }

  function swapLanguages() {
    if (!fromLanguage && !toLanguage) {
      return;
    }

    const currentFrom = fromLanguage;

    setFromLanguage(toLanguage);
    setToLanguage(currentFrom);

    setFromOpen(false);
    setToOpen(false);
  }

  async function continueToApp() {
    if (!fromLanguage || !toLanguage) {
      return;
    }

    try {
      await AsyncStorage.setItem("fromLanguage", fromLanguage);

      await AsyncStorage.setItem("toLanguage", toLanguage);

      router.push({
        pathname: "/secondPage",
        params: {
          from: fromLanguage,
          to: toLanguage,
        },
      });
    } catch (error) {
      console.log("Kunde inte spara språk:", error);
    }
  }

  const from = getLanguage(fromLanguage);
  const to = getLanguage(toLanguage);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            signOut();
            router.replace("/login");
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <LanguagePicker />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <Text style={styles.title}>{t("chooseLanguages")}</Text>

        {/* FRÅN */}
        <Text style={styles.label}>FRÅN</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setFromOpen((value) => !value);
            setToOpen(false);
          }}
          style={[styles.languageCard, fromOpen && styles.languageCardActive]}
        >
          <View style={styles.languageLeft}>
            <View style={styles.flagContainer}>
              <Text style={styles.flag}>{from?.flag || "🌍"}</Text>
            </View>

            <Text
              style={[
                styles.languageName,
                !fromLanguage && styles.placeholderText,
              ]}
            >
              {from?.label || "Välj språk"}
            </Text>
          </View>

          <Text style={[styles.chevron, fromOpen && styles.chevronOpen]}>
            ›
          </Text>
        </TouchableOpacity>

        {/* FRÅN DROPDOWN */}
        {fromOpen && (
          <View style={styles.dropdown}>
            {fromLanguages.map((language, index) => (
              <TouchableOpacity
                key={language.value}
                activeOpacity={0.7}
                onPress={() => {
                  setFromLanguage(language.value);
                  setFromOpen(false);
                }}
                style={[
                  styles.item,
                  index === fromLanguages.length - 1 && styles.lastItem,
                ]}
              >
                <Text style={styles.itemFlag}>{language.flag}</Text>

                <Text style={styles.itemText}>{language.label}</Text>

                {fromLanguage === language.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* SWAP */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={swapLanguages}
          disabled={!fromLanguage && !toLanguage}
          style={[
            styles.swapButton,
            !fromLanguage && !toLanguage && styles.swapButtonDisabled,
          ]}
        >
          <Text style={styles.swapButtonText}>⇅</Text>
        </TouchableOpacity>

        {/* TILL */}
        <Text style={styles.label}>TILL</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setToOpen((value) => !value);
            setFromOpen(false);
          }}
          style={[styles.languageCard, toOpen && styles.languageCardActive]}
        >
          <View style={styles.languageLeft}>
            <View style={styles.flagContainer}>
              <Text style={styles.flag}>{to?.flag || "🌍"}</Text>
            </View>

            <Text
              style={[
                styles.languageName,
                !toLanguage && styles.placeholderText,
              ]}
            >
              {to?.label || "Välj språk"}
            </Text>
          </View>

          <Text style={[styles.chevron, toOpen && styles.chevronOpen]}>›</Text>
        </TouchableOpacity>

        {/* TILL DROPDOWN */}
        {toOpen && (
          <View style={styles.dropdown}>
            {toLanguages.map((language, index) => (
              <TouchableOpacity
                key={language.value}
                activeOpacity={0.7}
                onPress={() => {
                  setToLanguage(language.value);
                  setToOpen(false);
                }}
                style={[
                  styles.item,
                  index === toLanguages.length - 1 && styles.lastItem,
                ]}
              >
                <Text style={styles.itemFlag}>{language.flag}</Text>

                <Text style={styles.itemText}>{language.label}</Text>

                {toLanguage === language.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CONTINUE */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!canContinue}
          onPress={continueToApp}
          style={[
            styles.continueButton,
            canContinue
              ? styles.continueButtonActive
              : styles.continueButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.continueButtonText,
              canContinue
                ? styles.continueButtonTextActive
                : styles.continueButtonTextDisabled,
            ]}
          >
            {t("continue")}
          </Text>

          {canContinue && <Text style={styles.continueArrow}>→</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    position: "absolute",
    top: 52,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  backButtonText: {
    fontSize: 21,
    fontWeight: "500",
    color: colors.text,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 35,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 34,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },

  languageCard: {
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  languageCardActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },

  languageLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  flagContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  flag: {
    fontSize: 25,
  },

  languageName: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },

  placeholderText: {
    color: colors.textSecondary,
    fontWeight: "500",
  },

  chevron: {
    fontSize: 29,
    lineHeight: 30,
    color: colors.textSecondary,
    fontWeight: "300",
  },

  chevronOpen: {
    color: colors.primary,
  },

  dropdown: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  item: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  lastItem: {
    borderBottomWidth: 0,
  },

  itemFlag: {
    fontSize: 22,
    width: 40,
  },

  itemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
  },

  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "700",
  },

  swapButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 10,
  },

  swapButtonDisabled: {
    opacity: 0.5,
  },

  swapButtonText: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: "600",
  },

  continueButton: {
    height: 54,
    borderRadius: 16,
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "78%",
  },

  continueButtonDisabled: {
    backgroundColor: colors.disabled,
  },

  continueButtonActive: {
    backgroundColor: colors.primary,
  },

  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  continueButtonTextActive: {
    color: colors.surface,
  },

  continueButtonTextDisabled: {
    color: colors.textSecondary,
  },

  continueArrow: {
    color: colors.surface,
    fontSize: 19,
    marginLeft: 8,
    fontWeight: "600",
  },
});
