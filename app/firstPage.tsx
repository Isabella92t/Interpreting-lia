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

import { SafeAreaView } from "react-native-safe-area-context";

import { LanguagePicker } from "@/components/language-picker";
import { useUiLanguage } from "@/context/ui-language-context";

const languages = [
  { label: "Svenska", value: "sv", flag: "🇸🇪" },
  { label: "Español", value: "es", flag: "🇪🇸" },
  { label: "English", value: "en", flag: "🇬🇧" },
];

/** Liten diskret symbol: två deltagare och en tolk med namnbricka. */
function InterpreterLogo() {
  return (
    <View
      style={styles.logo}
      accessibilityLabel="TolkAppen – tre personer och tolk med namnbricka"
    >
      <View style={[styles.logoPerson, styles.logoSideLeft]}>
        <View style={styles.logoSideHead} />
        <View style={styles.logoSideBody} />
      </View>
      <View style={[styles.logoPerson, styles.logoSideRight]}>
        <View style={styles.logoSideHead} />
        <View style={styles.logoSideBody} />
      </View>
      <View style={styles.logoCenter}>
        <View style={styles.logoCenterHead} />
        <View style={styles.logoCenterBody} />
        <View style={styles.logoStrapLeft} />
        <View style={styles.logoStrapRight} />
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText} numberOfLines={1}>
            TolkAppen
          </Text>
          <View style={styles.logoBadgeTail} />
        </View>
      </View>
    </View>
  );
}

export default function FirstPage() {
  const router = useRouter();
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* HEADER. Första sidan är startsidan, så den har ingen
          tillbaka-knapp. Bara jordgloben, uppe till höger. */}
      <View style={styles.header}>
        <LanguagePicker />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <InterpreterLogo />
        <Text style={styles.title}>{t("chooseLanguages")}</Text>

        {/* FRÅN */}
        <Text style={styles.label}>{t("from")}</Text>

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
              {from?.label || t("chooseLanguage")}
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
        <Text style={styles.label}>{t("to")}</Text>

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
              {to?.label || t("chooseLanguage")}
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

          
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Kompakt logotyp – placerad ovanför språkvalen, inte en stor illustration.
  logo: {
    width: 106,
    height: 90,
    alignSelf: "center",
    marginBottom: 34,
    position: "relative",
    transform: [{ scale: 1.6 }],
  },
  logoPerson: {
    position: "absolute",
    top: 12,
    width: 38,
    height: 55,
    alignItems: "center",
  },
  logoSideLeft: { left: 2 },
  logoSideRight: { right: 2 },
  logoSideHead: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: "#91B7DA",
  },
  logoSideBody: {
    width: 35,
    height: 29,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#91B7DA",
    marginTop: 3,
  },
  logoCenter: {
    position: "absolute",
    top: 0,
    left: 29,
    width: 48,
    height: 70,
    alignItems: "center",
  },
  logoCenterHead: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#234C7A",
    zIndex: 2,
  },
  logoCenterBody: {
    position: "absolute",
    top: 27,
    width: 48,
    height: 41,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: "#234C7A",
  },
  logoStrapLeft: {
    position: "absolute",
    top: 28,
    left: 16,
    width: 3,
    height: 24,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-28deg" }],
    zIndex: 3,
  },
  logoStrapRight: {
    position: "absolute",
    top: 28,
    right: 16,
    width: 3,
    height: 24,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "28deg" }],
    zIndex: 3,
  },
  logoBadge: {
    position: "absolute",
    top: 43,
    width: 53,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 4,
  },
  logoBadgeText: { fontSize: 8, fontWeight: "700", color: "#234C7A" },
  logoBadgeTail: {
    position: "absolute",
    bottom: -3,
    left: 10,
    width: 7,
    height: 7,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },

  container: {
    flex: 1,
    backgroundColor: "#F8FAFD",
    paddingHorizontal: 24,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  // Headern ligger i vanligt flöde, inte absolut. Då trycker
  // SafeAreaView ner den under telefonens statusrad, så att
  // tillbaka-knappen alltid går att trycka på.
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 16,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    width: "88%",
    maxWidth: 360,
    alignSelf: "center",
    paddingBottom: 24,
  },

  title: {
    fontSize: 21,
    fontWeight: "500",
    color: "#243B53",
    textAlign: "left",
    marginBottom: 22,
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
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
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
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  flag: {
    fontSize: 20,
  },

  languageName: {
    fontSize: 15,
    fontWeight: "500",
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
    height: 48,
    borderRadius: 11,
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "68%",
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
