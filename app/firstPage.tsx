import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { LanguagePicker } from "@/components/language-picker";
import { useAuth } from "@/context/auth-context";
import { useUiLanguage } from "@/context/ui-language-context";

const languages = [
  { label: "Svenska", value: "sv" },
  { label: "Español", value: "es" },
  { label: "English", value: "en" },
];

export default function FirstPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useUiLanguage();

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const [fromLanguage, setFromLanguage] = useState<string | null>(null);
  const [toLanguage, setToLanguage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  // Läs sparade språk varje gång FirstPage visas
  useFocusEffect(
    useCallback(() => {
      async function loadSavedLanguages() {
        try {
          const savedFrom = await AsyncStorage.getItem("fromLanguage");
          const savedTo = await AsyncStorage.getItem("toLanguage");

          if (savedFrom) {
            setFromLanguage(savedFrom);
          }

          if (savedTo) {
            setToLanguage(savedTo);
          }
        } catch (error) {
          console.log("Kunde inte läsa sparade språk:", error);
        } finally {
          setLoading(false);
        }
      }

      loadSavedLanguages();
    }, []),
  );

  const canContinue = Boolean(fromLanguage && toLanguage);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      <Text style={styles.title}>{t("chooseLanguages")}</Text>

      {/* FROM */}
      <TouchableOpacity
        onPress={() => {
          setFromOpen(!fromOpen);
          setToOpen(false);
        }}
        style={styles.box}
      >
        <Text style={styles.boxText}>
          {fromLanguage
            ? languages.find((l) => l.value === fromLanguage)?.label
            : t("from")}
        </Text>
      </TouchableOpacity>

      {fromOpen && (
        <ScrollView style={styles.list}>
          {languages
            .filter((language) => language.value !== toLanguage)
            .map((language) => (
              <TouchableOpacity
                key={language.value}
                onPress={() => {
                  setFromLanguage(language.value);
                  setFromOpen(false);
                }}
                style={styles.item}
              >
                <Text>{language.label}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}

      {/* TO */}
      <TouchableOpacity
        onPress={() => {
          setToOpen(!toOpen);
          setFromOpen(false);
        }}
        style={styles.box}
      >
        <Text style={styles.boxText}>
          {toLanguage
            ? languages.find((l) => l.value === toLanguage)?.label
            : t("to")}
        </Text>
      </TouchableOpacity>

      {toOpen && (
        <ScrollView style={styles.list}>
          {languages
            .filter((language) => language.value !== fromLanguage)
            .map((language) => (
              <TouchableOpacity
                key={language.value}
                onPress={() => {
                  setToLanguage(language.value);
                  setToOpen(false);
                }}
                style={styles.item}
              >
                <Text>{language.label}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}

      {/* CONTINUE */}
      <TouchableOpacity
        disabled={!canContinue}
        onPress={continueToApp}
        style={[
          styles.continueButton,
          canContinue
            ? styles.continueButtonActive
            : styles.continueButtonDisabled,
        ]}
      >
        <Text>{t("continue")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
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
  },

  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },

  backButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },

  title: {
    fontSize: 26,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },

  box: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    marginBottom: 16,
  },

  boxText: {
    fontSize: 16,
    textAlign: "center",
  },

  list: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
  },

  item: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  continueButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    alignSelf: "center",
    width: "72%",
    minHeight: 48,
  },

  continueButtonDisabled: {
    backgroundColor: "#d1d5db",
  },

  continueButtonActive: {
    backgroundColor: "#22c55e",
  },
});
