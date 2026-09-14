import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";
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

type Note = {
  title: string;
  text: string;
};

export default function NotePage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { t } = useUiLanguage();

  // Finns det ett id sa oppnar vi en gammal anteckning.
  // Finns det inget id sa skriver vi en ny.
  const { id, from, to } = useLocalSearchParams<{
    id?: string;
    from?: string;
    to?: string;
  }>();

  // Tillbaka till anteckningslistan. dismissTo hoppar dit om sidan
  // redan finns bakom oss, annars oppnar den sidan istallet.
  function goToNotes() {
    router.dismissTo({ pathname: "/notesPage", params: { from, to } });
  }

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (id) {
      loadNote();
    }
  }, [id]);

  async function loadNote() {
    const note = await db.getFirstAsync<Note>(
      "SELECT title, text FROM notes WHERE id = ?",
      Number(id),
    );

    if (note) {
      setTitle(note.title);
      setText(note.text);
    }
  }

  async function saveNote() {
    if (!title.trim() && !text.trim()) {
      Alert.alert(t("writeSomethingFirst"));
      return;
    }

    // En anteckning utan rubrik far en standardrubrik,
    // annars blir pappret tomt.
    const noteTitle = title.trim() || t("untitled");

    if (id) {
      await db.runAsync(
        "UPDATE notes SET title = ?, text = ? WHERE id = ?",
        noteTitle,
        text.trim(),
        Number(id),
      );
    } else {
      await db.runAsync(
        "INSERT INTO notes (title, text, created_at) VALUES (?, ?, ?)",
        noteTitle,
        text.trim(),
        new Date().toISOString(),
      );
    }

    goToNotes();
  }

  function deleteNote() {
    Alert.alert(t("deleteNoteTitle"), t("deleteNoteMessage"), [
      { text: t("cancel"), style: "cancel" },
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
        <TouchableOpacity
          onPress={goToNotes}
          style={styles.backButton}
        >
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

        <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
          <Text style={styles.saveButtonText}>{t("save")}</Text>
        </TouchableOpacity>

        {/* Ta bort-knappen visas bara for en sparad anteckning. */}
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
