import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { LanguagePicker } from "@/components/language-picker";
import { useUiLanguage } from "@/context/ui-language-context";

const LINE_HEIGHT = 28;
const LINE_COUNT = 40;
const EMPTY_LINES = 14;

function PaperLines() {
  return (
    <View style={styles.lines} pointerEvents="none">
      {Array.from({ length: LINE_COUNT }).map((_, index) => (
        <View key={index} style={styles.line} />
      ))}
    </View>
  );
}

// Samma diskreta symbol som på övriga TolkAppen-sidor.
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

type Note = {
  title: string;
  text: string;
  created_at: string;
  selected_date: string | null;
};

export default function NotePage() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { t } = useUiLanguage();
  const { id, from, to } = useLocalSearchParams<{
    id?: string;
    from?: string;
    to?: string;
  }>();

  function goToNotes() {
    router.dismissTo({ pathname: "/notesPage", params: { from, to } });
  }

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const savingRef = useRef(false);
  const deletingRef = useRef(false);

  useEffect(() => {
    if (id) void loadNote();
  }, [id]);

  async function loadNote() {
    const note = await db.getFirstAsync<Note>(
      `SELECT title, text, created_at, selected_date FROM notes WHERE id = ?`,
      Number(id),
    );
    if (note) {
      setTitle(note.title);
      setText(note.text);
      if (note.selected_date) {
        const [year, month, day] = note.selected_date.split("-").map(Number);
        setSelectedDate(new Date(year, month - 1, day));
      }
    }
  }

  function openDatePicker() {
    setShowDatePicker(true);
  }

  function handleDateChange(event: any, date?: Date) {
    setShowDatePicker(false);
    if (!date) return;
    setSelectedDate(date);
  }

  function formatDateOnly(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function saveNote() {
    if (savingRef.current || deletingRef.current) return;
    if (!title.trim() && !text.trim()) {
      Alert.alert(t("writeSomethingFirst"));
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const noteTitle = title.trim() || t("untitled");
      const selectedDateValue = selectedDate
        ? formatDateOnly(selectedDate)
        : null;
      if (id) {
        await db.runAsync(
          `UPDATE notes SET title = ?, text = ?, selected_date = ? WHERE id = ?`,
          noteTitle,
          text.trim(),
          selectedDateValue,
          Number(id),
        );
      } else {
        await db.runAsync(
          `INSERT INTO notes (title, text, created_at, selected_date) VALUES (?, ?, ?, ?)`,
          noteTitle,
          text.trim(),
          new Date().toISOString(),
          selectedDateValue,
        );
      }
      goToNotes();
    } catch (error) {
      console.error("Kunde inte spara anteckningen:", error);
      Alert.alert("Fel", "Det gick inte att spara anteckningen. Försök igen.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function deleteNote() {
    if (savingRef.current || deletingRef.current) return;
    Alert.alert(t("deleteNoteTitle"), t("deleteNoteMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          if (deletingRef.current || savingRef.current) return;
          deletingRef.current = true;
          setDeleting(true);
          try {
            await db.runAsync("DELETE FROM notes WHERE id = ?", Number(id));
            goToNotes();
          } catch (error) {
            console.error("Kunde inte radera anteckningen:", error);
            Alert.alert(
              "Fel",
              "Det gick inte att radera anteckningen. Försök igen.",
            );
          } finally {
            deletingRef.current = false;
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <InterpreterWatermark />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <BackButton onPress={goToNotes} />
          <LanguagePicker />
        </View>

        {/* Behåll skrivpapprets linjer, marginal och växande textfält. */}
        <View style={styles.paper}>
          <View style={styles.marginLine} pointerEvents="none" />
          <TextInput
            style={styles.titleInput}
            placeholder={t("noteTitle")}
            placeholderTextColor="#91A5B9"
            value={title}
            onChangeText={setTitle}
          />
          <View style={styles.writingArea}>
            <PaperLines />
            <TextInput
              style={styles.textInput}
              placeholder={t("noteText")}
              placeholderTextColor="#91A5B9"
              value={text}
              onChangeText={setText}
              multiline
              scrollEnabled={false}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
          <Text style={styles.calendarSymbol}>📅</Text>
          <Text style={styles.dateButtonText}>
            {selectedDate ? formatDateOnly(selectedDate) : t("chooseDate")}
          </Text>
        </TouchableOpacity>

        {selectedDate && (
          <TouchableOpacity
            style={styles.removeDateButton}
            onPress={() => setSelectedDate(null)}
          >
            <Text style={styles.removeDateText}>{t("removeDate")}</Text>
          </TouchableOpacity>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
          />
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveNote}
          disabled={saving || deleting}
        >
          <Text style={styles.saveButtonText}>{t("save")}</Text>
        </TouchableOpacity>

        {id && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteNote}
            disabled={saving || deleting}
          >
            <Text style={styles.deleteButtonText}>{t("delete")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9FD" },
  content: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 42,
  },
  paper: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 4,
    paddingLeft: 40,
    paddingRight: 18,
    paddingTop: 14,
    paddingBottom: 18,
    overflow: "hidden",
    shadowColor: "#203B59",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  marginLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 28,
    width: 1,
    backgroundColor: "#F0BCBC",
  },
  titleInput: {
    fontSize: 20,
    fontWeight: "700",
    color: "#203B59",
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#C7D7EA",
    marginBottom: 6,
  },
  writingArea: { minHeight: LINE_HEIGHT * EMPTY_LINES, overflow: "hidden" },
  lines: { position: "absolute", top: 0, left: 0, right: 0 },
  line: {
    height: LINE_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "#DFE8F2",
  },
  textInput: {
    minHeight: LINE_HEIGHT * EMPTY_LINES,
    fontSize: 16,
    color: "#203B59",
    lineHeight: LINE_HEIGHT,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    backgroundColor: "transparent",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 20,
    backgroundColor: "#FFFFFF",
  },
  calendarSymbol: { fontSize: 16, marginRight: 8 },
  dateButtonText: { fontSize: 14, color: "#203B59" },
  removeDateButton: { alignItems: "center", marginTop: 8 },
  removeDateText: { fontSize: 13, color: "#61758A" },
  saveButton: {
    backgroundColor: "#285F9D",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  deleteButton: { padding: 14, alignItems: "center", marginTop: 8 },
  deleteButtonText: { color: "#DC2626", fontSize: 15 },
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
