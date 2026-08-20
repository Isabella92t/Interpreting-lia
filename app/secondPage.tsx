import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Category = {
  id: number;
  name: string;
};

export default function SecondPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { from, to } = useLocalSearchParams<{
    from?: string;
    to?: string;
  }>();

  const [categories, setCategories] = useState<Category[]>([]);

  const [showAddWord, setShowAddWord] = useState(false);

  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const result = await db.getAllAsync<Category>(
      "SELECT id, name FROM tags ORDER BY name ASC",
    );

    setCategories(result);
  }

  async function addWord() {
    if (!word.trim() || !translation.trim() || !selectedCategory) {
      Alert.alert("Fyll i alla fält");
      return;
    }

    const languageNames: Record<string, string> = {
      sv: "Svenska",
      en: "English",
      es: "Español",
    };

    const fromLanguage = languageNames[String(from).toLowerCase()];
    const toLanguage = languageNames[String(to).toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      Alert.alert("Språken kunde inte hittas");
      return;
    }

    // Lägg till ordet
    await db.runAsync(
      "INSERT OR IGNORE INTO words (name) VALUES (?)",
      word.trim(),
    );

    // Hämta ordets ID
    const wordResult = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM words WHERE name = ?",
      word.trim(),
    );

    if (!wordResult) {
      return;
    }

    // Hämta språk-ID
    const fromLanguageResult = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM languages WHERE name = ?",
      fromLanguage,
    );

    const toLanguageResult = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM languages WHERE name = ?",
      toLanguage,
    );

    // Lägg till översättning för första språket
    if (fromLanguageResult) {
      await db.runAsync(
        "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
        wordResult.id,
        fromLanguageResult.id,
        word.trim(),
      );
    }

    // Lägg till översättning för andra språket
    if (toLanguageResult) {
      await db.runAsync(
        "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
        wordResult.id,
        toLanguageResult.id,
        translation.trim(),
      );
    }

    // Hämta kategori-ID
    const categoryResult = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM tags WHERE name = ?",
      selectedCategory,
    );

    // Koppla ordet till kategorin
    if (categoryResult) {
      await db.runAsync(
        "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
        wordResult.id,
        categoryResult.id,
      );
    }

    // Töm fälten
    setWord("");
    setTranslation("");
    setSelectedCategory("");

    setShowAddWord(false);

    Alert.alert("Ordet har lagts till!");
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.searchText}>
        <FontAwesome name="search" size={32} color="#111827" />
      </View>

      <Text style={styles.title}>Categories</Text>

      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={styles.box}
          onPress={() =>
            router.push({
              pathname: "/dictionaryPage",
              params: {
                from,
                to,
                category: category.name,
              },
            })
          }
        >
          <Text>{category.name}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: "/dictionaryPage",
            params: { from, to },
          })
        }
      >
        <FontAwesome name="book" size={24} color="#111827" />
        <Text>Dictionary</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: "/idiomsPage",
            params: {
              from,
              to,
            },
          })
        }
      >
        <Text>Idiomer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowAddWord(true)}
      >
        <Text>Lägg till ord</Text>
      </TouchableOpacity>

      {/* Popup för att lägga till ord */}
      <Modal
        visible={showAddWord}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddWord(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Lägg till ord</Text>

            <Text>
              {from} → {to}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ord"
              value={word}
              onChangeText={setWord}
            />

            <TextInput
              style={styles.input}
              placeholder="Översättning"
              value={translation}
              onChangeText={setTranslation}
            />

            <Text style={styles.categoryTitle}>Kategori</Text>

            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={
                  selectedCategory === category.name
                    ? styles.selectedCategory
                    : styles.category
                }
                onPress={() => setSelectedCategory(category.name)}
              >
                <Text>{category.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addWord}>
              <Text>Lägg till</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddWord(false)}
            >
              <Text>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    paddingTop: 40,
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

  searchText: {
    color: "#9ca3af",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    marginBottom: 32,
    width: "60%",
    alignSelf: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 18,
    marginLeft: "18%",
    alignSelf: "flex-start",
    textAlign: "left",
  },

  box: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 14,
    marginBottom: 18,
    alignSelf: "center",
    width: "42%",
    alignItems: "center",
  },

  button: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 14,
    marginTop: 20,
    alignSelf: "center",
    width: "50%",
    alignItems: "center",
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 24,
  },

  modal: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 8,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    marginTop: 12,
  },

  categoryTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontWeight: "600",
  },

  category: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 10,
    marginBottom: 6,
  },

  selectedCategory: {
    borderWidth: 2,
    borderColor: "#111827",
    padding: 10,
    marginBottom: 6,
  },

  addButton: {
    borderWidth: 1,
    borderColor: "#111827",
    padding: 12,
    marginTop: 18,
    alignItems: "center",
  },

  cancelButton: {
    padding: 12,
    marginTop: 8,
    alignItems: "center",
  },
});
