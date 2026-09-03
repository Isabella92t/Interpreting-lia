import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { useUiLanguage } from "@/context/ui-language-context";
import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Hur hogt varje skrivrad ar. Texten och linjerna anvander samma
// varde, annars hamnar texten mellan linjerna istallet for pa dem.
const LINE_HEIGHT = 18;

// Hur manga linjer vi ritar pa pappret.
const LINE_COUNT = 7;

type Note = {
  id: number;
  title: string;
  text: string;
};

// Ritar de vagrata linjerna, som i ett skrivblock.
function PaperLines() {
  return (
    <View style={styles.lines} pointerEvents="none">
      {Array.from({ length: LINE_COUNT }).map((_, index) => (
        <View key={index} style={styles.line} />
      ))}
    </View>
  );
}

export default function NotesPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { t } = useUiLanguage();

  // Sprakvalen skickas med sa att andra sidor vet vilka sprak man valt.
  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();

  const [notes, setNotes] = useState<Note[]>([]);

  // useFocusEffect kors varje gang man kommer TILLBAKA till sidan.
  // Da syns en ny anteckning direkt i listan.
  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, []),
  );

  async function loadNotes() {
    const result = await db.getAllAsync<Note>(
      "SELECT id, title, text FROM notes ORDER BY created_at DESC",
    );

    setNotes(result);
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

      <Text style={styles.title}>{t("myNotes")}</Text>

      {/* Varje anteckning ser ut som ett papper. Klicka for att lasa den. */}
      <FlatList
        data={notes}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.paper}
            onPress={() =>
              router.push({
                pathname: "/notePage",
                params: { id: String(item.id), from, to },
              })
            }
          >
            <PaperLines />

            {/* Den rosa marginal-linjen langst till vanster. */}
            <View style={styles.marginLine} pointerEvents="none" />

            <Text style={styles.paperTitle} numberOfLines={1}>
              {item.title}
            </Text>

            <Text style={styles.paperText} numberOfLines={5}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{t("noNotesYet")}</Text>
        }
      />

      {/* Ny anteckning */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          router.push({ pathname: "/notePage", params: { from, to } })
        }
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Ljusgra bakgrund sa att de vita pappren syns tydligt.
    backgroundColor: "#f6f6f7",
    padding: 24,
  },

  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    // Vit mot den ljusgra bakgrunden, annars syns knappen daligt.
    backgroundColor: "#fff",
  },

  backButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },

  title: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
  },

  listContent: {
    paddingBottom: 90,
  },

  row: {
    gap: 12,
  },

  // Ett papper med linjer och skugga, som ett blad ur ett skrivblock.
  paper: {
    flex: 1,
    minHeight: LINE_HEIGHT * LINE_COUNT + 20,
    // Lite varmare an vitt, som riktigt papper.
    backgroundColor: "#fffdf7",
    borderWidth: 1,
    borderColor: "#e8e2d4",
    // Papper har nastan raka horn.
    borderRadius: 2,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
    // Extra plats till vanster for marginal-linjen.
    paddingLeft: 22,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Linjerna ligger bakom texten, med samma padding som pappret.
  lines: {
    position: "absolute",
    top: 10,
    left: 22,
    right: 10,
  },

  line: {
    height: LINE_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "#dfe8f2",
  },

  marginLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 14,
    width: 1,
    backgroundColor: "#f0bcbc",
  },

  paperTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    // Samma radhojd som linjerna, sa att rubriken hamnar pa en linje.
    lineHeight: LINE_HEIGHT,
  },

  paperText: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: LINE_HEIGHT,
  },

  empty: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 40,
    lineHeight: 22,
  },

  // Runda plus-knappen nere i hogra hornet.
  addButton: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
});
