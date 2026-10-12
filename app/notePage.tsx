import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
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
import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";

// Höjden på varje skrivrad. Texten och linjerna använder samma värde,
// annars hamnar texten mellan linjerna i stället för på dem.
const LINE_HEIGHT = 28;

// Hur många linjer vi ritar. Fler än man ser, och resten klipps bort.
const LINE_COUNT = 40;

// Hur många rader pappret är när det är tomt.
const EMPTY_LINES = 14;

// Ritar de blå linjerna på pappret, som i ett skrivblock.
function PaperLines() {
  return (
    <View style={styles.lines} pointerEvents="none">
      {Array.from({ length: LINE_COUNT }).map((_, index) => (
        <View key={index} style={styles.line} />
      ))}
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
    router.dismissTo({
      pathname: "/notesPage",
      params: { from, to },
    });
  }

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (id) {
      loadNote();
    }
  }, [id]);

  async function loadNote() {
    const note = await db.getFirstAsync<Note>(
      `
      SELECT
        title,
        text,
        created_at,
        selected_date
      FROM notes
      WHERE id = ?
      `,
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

    if (!date) {
      return;
    }

    setSelectedDate(date);
  }

  function formatDateOnly(date: Date) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async function saveNote() {
    if (!title.trim() && !text.trim()) {
      Alert.alert(t("writeSomethingFirst"));
      return;
    }

    const noteTitle = title.trim() || t("untitled");

    /*
     * Det valda datumet sparas som:
     *
     * YYYY-MM-DD
     *
     * Exempel:
     * 2026-09-28
     *
     * Ingen tid sparas.
     */
    const selectedDateValue = selectedDate
      ? formatDateOnly(selectedDate)
      : null;

    if (id) {
      await db.runAsync(
        `
        UPDATE notes
        SET
          title = ?,
          text = ?,
          selected_date = ?
        WHERE id = ?
        `,
        noteTitle,
        text.trim(),
        selectedDateValue,
        Number(id),
      );
    } else {
      await db.runAsync(
        `
        INSERT INTO notes
        (
          title,
          text,
          created_at,
          selected_date
        )
        VALUES (?, ?, ?, ?)
        `,
        noteTitle,
        text.trim(),

        /*
         * created_at är den automatiska
         * skapandetiden och ska fortfarande
         * innehålla datum + tid.
         */
        new Date().toISOString(),

        selectedDateValue,
      );
    }

    goToNotes();
  }

  function deleteNote() {
    Alert.alert(t("deleteNoteTitle"), t("deleteNoteMessage"), [
      {
        text: t("cancel"),
        style: "cancel",
      },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await db.runAsync("DELETE FROM notes WHERE id = ?", Number(id));

          goToNotes();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton onPress={goToNotes} />

        {/* Själva anteckningen: ett vitt papper man skriver på. */}
        <View style={styles.paper}>
          {/* Den röda marginallinjen längst till vänster. */}
          <View style={styles.marginLine} pointerEvents="none" />

          <TextInput
            style={styles.titleInput}
            placeholder={t("noteTitle")}
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.writingArea}>
            <PaperLines />

            {/* scrollEnabled = false gör att rutan växer med texten,
                så att hela sidan skrollar i stället för bara rutan. */}
            <TextInput
              style={styles.textInput}
              placeholder={t("noteText")}
              placeholderTextColor="#94A3B8"
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

        <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
          <Text style={styles.saveButtonText}>{t("save")}</Text>
        </TouchableOpacity>

        {id && (
          <TouchableOpacity style={styles.deleteButton} onPress={deleteNote}>
            <Text style={styles.deleteButtonText}>{t("delete")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Pappret */

  paper: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    // Papper har nästan raka hörn.
    borderRadius: 4,
    // Plats till vänster för marginallinjen.
    paddingLeft: 40,
    paddingRight: 18,
    paddingTop: 14,
    paddingBottom: 18,
    overflow: "hidden",
    // En liten skugga, som ett blad som ligger på bordet.
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
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
    color: colors.text,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#C7D7EA",
    marginBottom: 6,
  },

  // Linjerna och texten ligger i samma ruta, så att de börjar på
  // exakt samma höjd. Rutan klipper bort linjer som inte får plats.
  writingArea: {
    minHeight: LINE_HEIGHT * EMPTY_LINES,
    overflow: "hidden",
  },

  lines: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  line: {
    height: LINE_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "#DFE8F2",
  },

  textInput: {
    minHeight: LINE_HEIGHT * EMPTY_LINES,
    fontSize: 16,
    color: colors.text,
    lineHeight: LINE_HEIGHT,
    // Ingen inbyggd luft runt texten, annars hamnar den bredvid linjerna.
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    backgroundColor: "transparent",
  },

  /* Under pappret */

  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 20,
    backgroundColor: colors.surface,
  },

  calendarSymbol: {
    fontSize: 16,
    marginRight: 8,
  },

  dateButtonText: {
    fontSize: 14,
    color: colors.text,
  },

  removeDateButton: {
    alignItems: "center",
    marginTop: 8,
  },

  removeDateText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  saveButton: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  deleteButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },

  deleteButtonText: {
    color: "#dc2626",
    fontSize: 15,
  },
});
