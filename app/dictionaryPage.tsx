import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

type Translation = {
  word_id: number;
  text_from: string;
  text_to: string;
};

export default function DictionaryPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { t } = useUiLanguage();

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

    const fromLanguage = languageNames[selectedFrom];
    const toLanguage = languageNames[selectedTo];

    if (!fromLanguage || !toLanguage) {
      return;
    }

    let result: Translation[];

    if (category) {
      result = await db.getAllAsync<Translation>(
        `
        SELECT DISTINCT
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
        ORDER BY LOWER(text_from) ASC
        `,
        fromLanguage,
        toLanguage,
        category,
      );
    } else {
      result = await db.getAllAsync<Translation>(
        `
        SELECT DISTINCT
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
        ORDER BY LOWER(text_from) ASC
        `,
        fromLanguage,
        toLanguage,
      );
    }

    setTranslations(result);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() =>
          router.dismissTo({ pathname: "/secondPage", params: { from, to } })
        }
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{category ? category : t("dictionary")}</Text>

      <Text style={styles.subtitle}>
        {languageNames[String(from ?? "").toLowerCase()]} →{" "}
        {languageNames[String(to ?? "").toLowerCase()]} · {translations.length}{" "}
        {t("words")}
      </Text>

      <FlatList
        data={translations}
        keyExtractor={(item) => String(item.word_id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.word}>{item.text_from}</Text>

            <Text style={styles.translation}>{item.text_to}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={<Text style={styles.empty}>{t("noWordsYet")}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: 4,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },

  listContent: {
    paddingBottom: 24,
  },

  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  word: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  translation: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 3,
  },

  empty: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 24,
  },
});
