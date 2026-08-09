import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Word = {
  id: number;
  svenska: string;
  engelska: string;
  spanska: string;
};

export default function DictionaryPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { from, to, category } = useLocalSearchParams<{
    from?: string;
    to?: string;
    category?: string;
  }>();

  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    loadWords();
  }, [from, to, category]);

  async function loadWords() {
    let result: Word[];

    if (category) {
      result = await db.getAllAsync<Word>(
        `
        SELECT words.*
        FROM words
        INNER JOIN word_tags
          ON words.id = word_tags.word_id
        INNER JOIN tags
          ON word_tags.tag_id = tags.id
        WHERE tags.name = ?
        ORDER BY words.svenska ASC
        `,
        category,
      );
    } else {
      result = await db.getAllAsync<Word>(
        "SELECT * FROM words ORDER BY svenska ASC",
      );
    }

    setWords(result);
  }

  function getTranslation(word: Word) {
    const selectedFrom = String(from ?? "").toLowerCase();
    const selectedTo = String(to ?? "").toLowerCase();

    if (selectedFrom === "sv" && selectedTo === "en") {
      return {
        textFrom: word.svenska,
        textTo: word.engelska,
      };
    }

    if (selectedFrom === "sv" && selectedTo === "es") {
      return {
        textFrom: word.svenska,
        textTo: word.spanska,
      };
    }

    if (selectedFrom === "en" && selectedTo === "sv") {
      return {
        textFrom: word.engelska,
        textTo: word.svenska,
      };
    }

    if (selectedFrom === "en" && selectedTo === "es") {
      return {
        textFrom: word.engelska,
        textTo: word.spanska,
      };
    }

    if (selectedFrom === "es" && selectedTo === "sv") {
      return {
        textFrom: word.spanska,
        textTo: word.svenska,
      };
    }

    if (selectedFrom === "es" && selectedTo === "en") {
      return {
        textFrom: word.spanska,
        textTo: word.engelska,
      };
    }

    return {
      textFrom: word.svenska,
      textTo: word.engelska,
    };
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{category ? category : "Dictionary"}</Text>

      {words.map((word) => {
        const translation = getTranslation(word);

        return (
          <View key={word.id} style={styles.row}>
            <Text style={styles.text}>{translation.textFrom}</Text>

            <Text style={styles.text}>{translation.textTo}</Text>
          </View>
        );
      })}
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
