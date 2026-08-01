import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const languages = [
  { label: "Svenska", value: "sv" },
  { label: "Español", value: "es" },
  { label: "English", value: "en" },
];

export default function FirstPage() {
  const router = useRouter();
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [fromLanguage, setFromLanguage] = useState<string | null>(null);
  const [toLanguage, setToLanguage] = useState<string | null>(null);

  const canContinue = Boolean(fromLanguage && toLanguage);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose languages</Text>

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
            : "FROM"}
        </Text>
      </TouchableOpacity>

      {fromOpen && (
        <ScrollView style={styles.list}>
          {languages.map((language) => (
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
            : "TO"}
        </Text>
      </TouchableOpacity>

      {toOpen && (
        <ScrollView style={styles.list}>
          {languages.map((language) => (
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

      <TouchableOpacity
        disabled={!canContinue}
        onPress={() => {
          if (!canContinue) return;
          router.push({
            pathname: "/secondPage",
            params: {
              from: fromLanguage,
              to: toLanguage,
            },
          });
        }}
        style={[
          styles.continueButton,
          canContinue
            ? styles.continueButtonActive
            : styles.continueButtonDisabled,
        ]}
      />
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
