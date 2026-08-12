import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Translation = {
  word_id: number;
  text_from: string;
  text_to: string;
};

export default function DictionaryPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { from, to, category } = useLocalSearchParams<{
    from?: string;
    to?: string;
    category?: string;
  }>();

  const [translations, setTranslations] = useState<Translation[]>([]);

  useEffect(() => {
    loadTranslations();
  }, [from, to, category]);

  async function loadTranslations() {
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

    let result: Translation[];

    if (category) {
      result = await db.getAllAsync<Translation>(
        `
        SELECT
          from_translation.text AS text_from,
          to_translation.text AS text_to,
          from_translation.word_id
        FROM translations AS from_translation
        INNER JOIN translations AS to_translation
          ON from_translation.word_id = to_translation.word_id
        INNER JOIN languages AS from_language
          ON from_translation.language_id = from_language.id
        INNER JOIN languages AS to_language
          ON to_translation.language_id = to_language.id
        INNER JOIN word_tags
          ON from_translation.word_id = word_tags.word_id
        INNER JOIN tags
          ON word_tags.tag_id = tags.id
        WHERE from_language.name = ?
          AND to_language.name = ?
          AND tags.name = ?
        ORDER BY text_from ASC
        `,
        fromLanguage,
        toLanguage,
        category,
      );
    } else {
      result = await db.getAllAsync<Translation>(
        `
        SELECT
          from_translation.text AS text_from,
          to_translation.text AS text_to,
          from_translation.word_id
        FROM translations AS from_translation
        INNER JOIN translations AS to_translation
          ON from_translation.word_id = to_translation.word_id
        INNER JOIN languages AS from_language
          ON from_translation.language_id = from_language.id
        INNER JOIN languages AS to_language
          ON to_translation.language_id = to_language.id
        WHERE from_language.name = ?
          AND to_language.name = ?
        ORDER BY text_from ASC
        `,
        fromLanguage,
        toLanguage,
      );
    }

    setTranslations(result);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{category ? category : "Dictionary"}</Text>

      {translations.map((translation) => (
        <View key={translation.word_id} style={styles.row}>
          <Text style={styles.text}>{translation.text_from}</Text>

          <Text style={styles.text}>{translation.text_to}</Text>
        </View>
      ))}
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
