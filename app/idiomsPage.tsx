import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Idiom = {
  idiom_id: number;
  text_from: string;
  text_to: string;
};

export default function IdiomsPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { from, to } = useLocalSearchParams<{
    from?: string;
    to?: string;
  }>();

  const [idioms, setIdioms] = useState<Idiom[]>([]);

  useEffect(() => {
    loadIdioms();
  }, [from, to]);

  async function loadIdioms() {
    const selectedFrom = String(from ?? "").toLowerCase();
    const selectedTo = String(to ?? "").toLowerCase();

    const languageNames: Record<string, string> = {
      sv: "Svenska",
      en: "English",
      es: "Español",
    };

    const fromLanguage = languageNames[selectedFrom];
    const toLanguage = languageNames[selectedTo];

    if (!fromLanguage || !toLanguage) {
      return;
    }

    const result = await db.getAllAsync<Idiom>(
      `
      SELECT
        from_translation.idiom_id,
        from_translation.text AS text_from,
        to_translation.text AS text_to
      FROM idiom_translations AS from_translation
      INNER JOIN idiom_translations AS to_translation
        ON from_translation.idiom_id = to_translation.idiom_id
      INNER JOIN languages AS from_language
        ON from_translation.language_id = from_language.id
      INNER JOIN languages AS to_language
        ON to_translation.language_id = to_language.id
      WHERE from_language.name = ?
        AND to_language.name = ?
      ORDER BY LOWER(text_from) ASC
      `,
      fromLanguage,
      toLanguage,
    );

    setIdioms(result);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Idiomer</Text>

      <FlatList
        data={idioms}
        keyExtractor={(item) => String(item.idiom_id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.text}>{item.text_from}</Text>

            <Text style={styles.text}>{item.text_to}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
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
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },

  listContent: {
    paddingBottom: 24,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 8,
    width: "75%",
    alignSelf: "center",
  },

  text: {
    fontSize: 16,
    color: "#111827",
  },
});