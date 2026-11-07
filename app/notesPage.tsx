import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { LanguagePicker } from "@/components/language-picker";
import { SearchBar } from "@/components/search-bar";
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

function normalizeSearchText(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function PaperLines() {
  return (
    <View style={styles.lines} pointerEvents="none">
      {Array.from({ length: LINE_COUNT }).map((_, index) => (
        <View key={index} style={styles.line} />
      ))}
    </View>
  );
}

// Samma mycket svaga symbol med tre personer som på de övriga sidorna.
function InterpreterWatermark() {
  return (
    <View
      pointerEvents="none"
      style={styles.watermark}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.person, styles.personLeft]}>
        <View style={[styles.personHead, { backgroundColor: "#A8CBE7" }]} />
        <View style={[styles.personBody, { backgroundColor: "#A8CBE7" }]} />
      </View>
      <View style={[styles.person, styles.personCenter]}>
        <View style={[styles.personHead, { backgroundColor: "#285F9D" }]} />
        <View style={[styles.personBody, { backgroundColor: "#285F9D" }]} />
        <View style={styles.badgeCord} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>TolkAppen</Text>
        </View>
      </View>
      <View style={[styles.person, styles.personRight]}>
        <View style={[styles.personHead, { backgroundColor: "#A8CBE7" }]} />
        <View style={[styles.personBody, { backgroundColor: "#A8CBE7" }]} />
      </View>
    </View>
  );
}

export default function NotesPage() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { t } = useUiLanguage();
  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      void loadNotes();
    }, [db]),
  );

  async function loadNotes() {
    const result = await db.getAllAsync<Note>(
      `SELECT id, title, text, created_at, selected_date
       FROM notes ORDER BY created_at DESC`,
    );
    setNotes(result);
  }

  const searchText = normalizeSearchText(search);
  const visibleNotes = notes.filter((note) => {
    if (!searchText) return true;
    const title = normalizeSearchText(note.title ?? "");
    const text = normalizeSearchText(note.text ?? "");
    return title.includes(searchText) || text.includes(searchText);
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <InterpreterWatermark />
      <View style={styles.header}>
        <BackButton
          onPress={() =>
            router.dismissTo({ pathname: "/secondPage", params: { from, to } })
          }
        />
        <LanguagePicker />
      </View>

      <Text style={styles.title}>{t("myNotes")}</Text>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <FlatList
        style={styles.list}
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
                params: { id: String(item.id), from, to },
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
          router.push({ pathname: "/notePage", params: { from, to } })
        }
        accessibilityRole="button"
        accessibilityLabel={t("add")}
      >
        <FontAwesome name="plus" size={16} color="#285F9D" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FD",
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#203B59",
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  search: { marginBottom: 16 },
  list: { zIndex: 1 },
  listContent: { paddingBottom: 90 },
  row: { gap: 12 },
  paper: {
    width: "48%",
    minHeight: LINE_HEIGHT * LINE_COUNT + 20,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderRadius: 4,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
    paddingLeft: 22,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#203B59",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lines: { position: "absolute", top: 10, left: 22, right: 10 },
  line: {
    height: LINE_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "#DFEAF4",
  },
  marginLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 14,
    width: 1,
    backgroundColor: "#F0BCBC",
  },
  selectedDate: {
    fontSize: 10,
    fontWeight: "700",
    color: "#203B59",
    textAlign: "center",
    marginBottom: 4,
  },
  paperTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#203B59",
    lineHeight: LINE_HEIGHT,
  },
  paperTitleWithDate: { marginTop: 2 },
  paperText: { fontSize: 12, color: "#4C6074", lineHeight: LINE_HEIGHT },
  createdDate: {
    position: "absolute",
    bottom: 6,
    right: 8,
    fontSize: 8,
    color: "#61758A",
    opacity: 0.65,
  },
  empty: {
    fontSize: 14,
    color: "#61758A",
    textAlign: "center",
    paddingVertical: 40,
    lineHeight: 22,
  },
  addButton: {
    position: "absolute",
    right: 24,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E9F3FB",
    borderWidth: 1,
    borderColor: "#DCEBF7",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  watermark: {
    position: "absolute",
    left: "50%",
    top: "34%",
    marginLeft: -150,
    width: 300,
    height: 260,
    opacity: 0.055,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  person: {
    width: 92,
    height: 210,
    alignItems: "center",
    position: "relative",
  },
  personLeft: { transform: [{ translateX: 12 }, { scale: 0.83 }] },
  personCenter: { zIndex: 2, transform: [{ scale: 1.07 }] },
  personRight: { transform: [{ translateX: -12 }, { scale: 0.83 }] },
  personHead: { width: 61, height: 61, borderRadius: 31 },
  personBody: {
    width: 88,
    height: 135,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    marginTop: 10,
  },
  badgeCord: {
    position: "absolute",
    top: 86,
    height: 47,
    width: 2,
    backgroundColor: "#FFFFFF",
  },
  badge: {
    position: "absolute",
    top: 127,
    paddingHorizontal: 4,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  badgeText: { color: "#285F9D", fontSize: 7, fontWeight: "700" },
});
