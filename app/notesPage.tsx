import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { SearchBar } from "@/components/search-bar";
import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";
import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LINE_HEIGHT = 18;
const LINE_COUNT = 7;

type Note = {
  id: number;
  title: string;
  text: string;
  created_at: string;
  selected_date: string | null;
};

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

  const { from, to } = useLocalSearchParams<{
    from?: string;
    to?: string;
  }>();

  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");

  // Hur mycket plats telefonens nederkant tar, t.ex. hemknappens streck.
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, []),
  );

  async function loadNotes() {
    const result = await db.getAllAsync<Note>(
      `
      SELECT
        id,
        title,
        text,
        created_at,
        selected_date
      FROM notes
      ORDER BY created_at DESC
      `,
    );

    setNotes(result);
  }

  // Sökningen letar i både rubrik och text.
  const searchText = search.trim().toLowerCase();

  const visibleNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchText) ||
      note.text.toLowerCase().includes(searchText),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <BackButton
        onPress={() =>
          router.dismissTo({
            pathname: "/secondPage",
            params: { from, to },
          })
        }
      />

      <Text style={styles.title}>{t("myNotes")}</Text>

      <SearchBar value={search} onChangeText={setSearch} style={styles.search} />

      <FlatList
        data={visibleNotes}
        keyboardShouldPersistTaps="handled"
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
                params: {
                  id: String(item.id),
                  from,
                  to,
                },
              })
            }
          >
            <PaperLines />

            <View style={styles.marginLine} pointerEvents="none" />

            {item.selected_date && (
              <Text style={styles.selectedDate}>{item.selected_date}</Text>
            )}

            <Text
              style={[
                styles.paperTitle,
                item.selected_date ? styles.paperTitleWithDate : undefined,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>

            <Text style={styles.paperText} numberOfLines={5}>
              {item.text}
            </Text>

            <Text style={styles.createdDate}>
              {new Date(item.created_at).toLocaleString("sv-SE")}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t("noNotesYet")}</Text>}
      />

      <TouchableOpacity
        style={[styles.addButton, { bottom: 24 + insets.bottom }]}
        onPress={() =>
          router.push({
            pathname: "/notePage",
            params: {
              from,
              to,
            },
          })
        }
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
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

  paper: {
    width: "48%",
    minHeight: LINE_HEIGHT * LINE_COUNT + 20,
    backgroundColor: "#fffdf7",
    borderWidth: 1,
    borderColor: "#e8e2d4",
    borderRadius: 2,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
    paddingLeft: 22,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },

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

  selectedDate: {
    fontSize: 10,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },

  paperTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    lineHeight: LINE_HEIGHT,
  },

  paperTitleWithDate: {
    marginTop: 2,
  },

  paperText: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: LINE_HEIGHT,
  },

  createdDate: {
    position: "absolute",
    bottom: 6,
    right: 8,
    fontSize: 8,
    color: "#6b7280",
    opacity: 0.55,
  },

  empty: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 40,
    lineHeight: 22,
  },

  // bottom satts i koden, sa att knappen hamnar ovanfor hemknappens streck.
  addButton: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
});
