
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
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

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const result = await db.getAllAsync<Category>(
      "SELECT id, name FROM tags ORDER BY name ASC",
    );

    setCategories(result);
  }

  async function changeLanguages() {
    try {
      await AsyncStorage.removeItem("fromLanguage");
      await AsyncStorage.removeItem("toLanguage");

      router.replace("/firstPage");
    } catch (error) {
      console.log("Kunde inte ta bort sparade språk:", error);
    }
  }

  async function addWord() {
    if (!word.trim() || !translation.trim()) {
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

    await db.runAsync(
      "INSERT OR IGNORE INTO words (name) VALUES (?)",
      word.trim(),
    );

    const wordResult = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM words WHERE name = ?",
      word.trim(),
    );

    if (!wordResult) {
      return;
    }

    const fromLanguageResult = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM languages WHERE name = ?",
      fromLanguage,
    );

    const toLanguageResult = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM languages WHERE name = ?",
      toLanguage,
    );

    if (fromLanguageResult) {
      await db.runAsync(
        "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
        wordResult.id,
        fromLanguageResult.id,
        word.trim(),
      );
    }

    if (toLanguageResult) {
      await db.runAsync(
        "INSERT OR IGNORE INTO translations (word_id, language_id, text) VALUES (?, ?, ?)",
        wordResult.id,
        toLanguageResult.id,
        translation.trim(),
      );
    }

    if (selectedCategories.length === 0) {
      const otherCategory = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM tags WHERE name = ?",
        "Övrigt",
      );

      if (otherCategory) {
        await db.runAsync(
          "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
          wordResult.id,
          otherCategory.id,
        );
      }
    } else {
      for (const categoryName of selectedCategories) {
        const categoryResult = await db.getFirstAsync<{ id: number }>(
          "SELECT id FROM tags WHERE name = ?",
          categoryName,
        );

        if (categoryResult) {
          await db.runAsync(
            "INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)",
            wordResult.id,
            categoryResult.id,
          );
        }
      }
    }

    setWord("");
    setTranslation("");
    setSelectedCategories([]);
    setShowAddWord(false);

    Alert.alert("Ordet har lagts till!");
  }

  function toggleCategory(categoryName: string) {
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(
        selectedCategories.filter((name) => name !== categoryName),
      );
    } else {
      setSelectedCategories([...selectedCategories, categoryName]);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Byt språk */}
        <TouchableOpacity onPress={changeLanguages} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* KATEGORIER */}
        <Text style={styles.title}>Categories</Text>

        <View style={styles.categoryGrid}>
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
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dictionary */}
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

        {/* Idiomer */}
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

        {/* Lägg till ord */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowAddWord(true)}
        >
          <Text>Lägg till ord</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Popup för att lägga till ord */}
      <Modal
        visible={showAddWord}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddWord(false)}
      >
        <View style={styles.modalBackground}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
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

              <Text style={styles.optionalText}>
                Valfritt – välj ingen kategori för att lägga ordet i Övrigt.
              </Text>

              {categories
                .filter((category) => category.name !== "Övrigt")
                .map((category) => {
                  const isSelected = selectedCategories.includes(category.name);

                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={
                        isSelected ? styles.selectedCategory : styles.category
                      }
                      onPress={() => toggleCategory(category.name)}
                    >
                      <Text>
                        {isSelected ? "✓ " : ""}
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

              <TouchableOpacity style={styles.addButton} onPress={addWord}>
                <Text>Lägg till</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedCategories([]);
                  setShowAddWord(false);
                }}
              >
                <Text>Avbryt</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
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

  /* KATEGORIER */

  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 18,
    textAlign: "center",
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 10,
  },

  box: {
    width: "31%",
    minHeight: 55,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  categoryText: {
    textAlign: "center",
    fontSize: 14,
  },

  /* KNAPPAR */

  button: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 14,
    marginTop: 20,
    alignSelf: "center",
    width: "50%",
    alignItems: "center",
    gap: 6,
  },

  /* MODAL */

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  modalScrollContent: {
    flexGrow: 1,
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
    marginBottom: 4,
    fontWeight: "600",
  },

  optionalText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
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
