import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { SearchBar } from "@/components/search-bar";
import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

type Idiom = {
  idiom_id: number;
  text_from: string;
  text_to: string;
};

export default function IdiomsPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { t } = useUiLanguage();

  const { from, to } = useLocalSearchParams<{
    from?: string;
    to?: string;
  }>();

  const [idioms, setIdioms] = useState<Idiom[]>([]);
  const [search, setSearch] = useState("");

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

  // Sökningen letar på båda språken, var som helst i uttrycket.
  const searchText = search.trim().toLowerCase();

  const visibleIdioms = idioms.filter(
    (item) =>
      item.text_from.toLowerCase().includes(searchText) ||
      item.text_to.toLowerCase().includes(searchText),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <BackButton
        onPress={() =>
          router.dismissTo({ pathname: "/secondPage", params: { from, to } })
        }
      />

      <Text style={styles.title}>{t("idioms")}</Text>

      <SearchBar value={search} onChangeText={setSearch} style={styles.search} />

      <FlatList
        data={visibleIdioms}
        keyExtractor={(item) => String(item.idiom_id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.text}>{item.text_from}</Text>

            <Text style={styles.text}>{item.text_to}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 22,
    paddingTop: 16,
  },

  search: {
    marginBottom: 16,
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
