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

import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={goToNotes} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.titleInput}
          placeholder={t("noteTitle")}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.textInput}
          placeholder={t("noteText")}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
          <Text style={styles.calendarSymbol}>📅</Text>

          <Text style={styles.dateButtonText}>
            {selectedDate ? formatDateOnly(selectedDate) : "Välj datum"}
          </Text>
        </TouchableOpacity>

        {selectedDate && (
          <TouchableOpacity
            style={styles.removeDateButton}
            onPress={() => setSelectedDate(null)}
          >
            <Text style={styles.removeDateText}>Ta bort valt datum</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 24,
  },

  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    marginBottom: 20,
  },

  backButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },

  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingVertical: 10,
  },

  textInput: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 22,
    minHeight: 220,
    marginTop: 16,
  },

  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 20,
    backgroundColor: "#fff",
  },

  calendarSymbol: {
    fontSize: 16,
    marginRight: 8,
  },

  dateButtonText: {
    fontSize: 14,
    color: "#111827",
  },

  removeDateButton: {
    alignItems: "center",
    marginTop: 8,
  },

  removeDateText: {
    fontSize: 13,
    color: "#6b7280",
  },

  saveButton: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
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
