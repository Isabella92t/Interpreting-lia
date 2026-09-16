import { colors } from "@/constants/colors";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { LanguagePicker } from "@/components/language-picker";
import { useUiLanguage } from "@/context/ui-language-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
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

type Translation = {
  word_id: number;
  text_from: string;
  text_to: string;
};

// Vi visar tre kategorier i taget. Resten ser man genom att svepa.
const CATEGORIES_PER_PAGE = 3;

// Avståndet mellan kategori-rutorna.
const CATEGORY_GAP = 10;

// Här sparar vi vilka kategorier man använt senast.
const RECENT_CATEGORIES_KEY = "recentCategories";

// Lägger de senast använda kategorierna först, resten efter.
function sortByRecentlyUsed(categories: Category[], recentNames: string[]) {
  const recent: Category[] = [];

  for (const name of recentNames) {
    const category = categories.find((item) => item.name === name);

    if (category) {
      recent.push(category);
    }
  }

  const rest = categories.filter((item) => !recentNames.includes(item.name));

  return [...recent, ...rest];
}

// Delar upp kategorierna i sidor med tre i varje.
function splitIntoPages(categories: Category[]) {
  const pages: Category[][] = [];

  for (let i = 0; i < categories.length; i += CATEGORIES_PER_PAGE) {
    pages.push(categories.slice(i, i + CATEGORIES_PER_PAGE));
  }

  return pages;
}

// Man måste skriva minst tre bokstäver innan förslagen visas.
const MIN_SEARCH_LENGTH = 3;

// Vi visar högst tre förslag.
const MAX_RESULTS = 3;

// Delar upp texten i ord och kollar om NÅGOT ord börjar med det man skrev.
// "falsk" hittar alltså "Olovlig befattning med falska pengar".
function startsWithSearch(text: string, searchText: string) {
  const words = text.toLowerCase().split(/[\s/,()]+/);

  return words.some((word) => word.startsWith(searchText));
}

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

// Databasens kategorinamn är svenska.
// Den text användaren ser hämtas från translations.ts.
function getCategoryTranslation(categoryName: string, t: (key: any) => string) {
  switch (categoryName) {
    case "Juridik":
      return t("categoryJuridik");

    case "Samhällskunskap":
      return t("categorySamhallskunskap");

    case "Migration":
      return t("categoryMigration");

    case "Sjukvård":
      return t("categorySjukvard");

    default:
      return categoryName;
  }
}

export default function SecondPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { t } = useUiLanguage();

  const { from, to } = useLocalSearchParams<{
    from?: string;
    to?: string;
  }>();

  const [categories, setCategories] = useState<Category[]>([]);

  // Alla ord i de valda språken. Vi hämtar dem en gång och söker sedan
  // i listan, så att sökningen känns direkt när man skriver.
  const [allTranslations, setAllTranslations] = useState<Translation[]>([]);
  const [search, setSearch] = useState("");

  // Kategori-karusellen
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  const [showAddWord, setShowAddWord] = useState(false);

  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Lägg till kategori
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    loadCategories();
    loadRecentCategories();
  }, []);

  useEffect(() => {
    loadAllTranslations();
  }, [from, to]);

  async function loadCategories() {
    const result = await db.getAllAsync<Category>(
      "SELECT id, name FROM tags ORDER BY name ASC",
    );

    setCategories(result);
  }

  async function loadRecentCategories() {
    const saved = await AsyncStorage.getItem(RECENT_CATEGORIES_KEY);

    if (saved) {
      setRecentCategories(JSON.parse(saved));
    }
  }

  // När man öppnar en kategori läggs den först i listan,
  // så att den syns direkt nästa gång man kommer hit.
  async function openCategory(categoryName: string) {
    const updated = [
      categoryName,
      ...recentCategories.filter((name) => name !== categoryName),
    ];

    setRecentCategories(updated);

    await AsyncStorage.setItem(RECENT_CATEGORIES_KEY, JSON.stringify(updated));

    router.push({
      pathname: "/dictionaryPage",
      params: { from, to, category: categoryName },
    });
  }

  async function loadAllTranslations() {
    const fromLanguage = languageNames[String(from).toLowerCase()];
    const toLanguage = languageNames[String(to).toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      return;
    }

    const result = await db.getAllAsync<Translation>(
      `
      SELECT DISTINCT
        from_translation.text AS text_from,
        to_translation.text AS text_to,
        from_translation.word_id
      FROM translations AS from_translation
      INNER JOIN translations AS to_translation
        ON from_translation.word_id = to_translation.word_id
      INNER JOIN languages AS from_language
        ON from_translation.language_id = from_language.id
      INNER JOIN languages AS to_language
        ON to_translation.language_id = to_language.id
      WHERE from_language.name = ?
        AND to_language.name = ?
      ORDER BY LOWER(text_from) ASC
      `,
      fromLanguage,
      toLanguage,
    );

    setAllTranslations(result);
  }

  // Tillbaka till språkvalet.
  function changeLanguages() {
    router.dismissTo("/firstPage");
  }

  async function addCategory() {
    const categoryName = newCategory.trim();

    if (!categoryName) {
      Alert.alert("Skriv ett kategorinamn");
      return;
    }

    const fromLanguage = languageNames[String(from).toLowerCase()];
    const toLanguage = languageNames[String(to).toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      Alert.alert(t("languagesNotFound"));
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

    if (!fromLanguageResult || !toLanguageResult) {
      Alert.alert(t("languagesNotFound"));
      return;
    }

    const existingCategory = await db.getFirstAsync<{ id: number }>(
      `
      SELECT id
      FROM tags
      WHERE LOWER(name) = LOWER(?)
        AND from_language_id = ?
        AND to_language_id = ?
      `,
      categoryName,
      fromLanguageResult.id,
      toLanguageResult.id,
    );

    if (existingCategory) {
      Alert.alert("Kategorin finns redan");
      return;
    }

    await db.runAsync(
      `
      INSERT INTO tags (
        name,
        from_language_id,
        to_language_id
      )
      VALUES (?, ?, ?)
      `,
      categoryName,
      fromLanguageResult.id,
      toLanguageResult.id,
    );

    setNewCategory("");
    setShowAddCategory(false);

    await loadCategories();
  }

  async function addWord() {
    if (!word.trim() || !translation.trim()) {
      Alert.alert(t("fillAllFields"));
      return;
    }

    const fromLanguage = languageNames[String(from).toLowerCase()];
    const toLanguage = languageNames[String(to).toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      Alert.alert(t("languagesNotFound"));
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

    await loadAllTranslations();

    setWord("");
    setTranslation("");
    setSelectedCategories([]);
    setShowAddWord(false);

    Alert.alert(t("wordAdded"));
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

  // Vi söker i BÅDA språken samtidigt.
  const searchText = search.trim().toLowerCase();

  const hasEnoughLetters = searchText.length >= MIN_SEARCH_LENGTH;

  const searchResults = hasEnoughLetters
    ? allTranslations.filter(
        (item) =>
          startsWithSearch(item.text_from, searchText) ||
          startsWithSearch(item.text_to, searchText),
      )
    : [];

  const visibleResults = searchResults.slice(0, MAX_RESULTS);

  // Kategorierna, senast använda först.
  const categoryPages = splitIntoPages(
    sortByRecentlyUsed(categories, recentCategories),
  );

  // Tre rutor plus två mellanrum ska rymmas på bredden.
  const boxWidth = (carouselWidth - CATEGORY_GAP * 2) / CATEGORIES_PER_PAGE;

  const canGoLeft = page > 0;
  const canGoRight = page < categoryPages.length - 1;

  function goToPage(nextPage: number) {
    if (nextPage < 0 || nextPage > categoryPages.length - 1) {
      return;
    }

    setPage(nextPage);

    carouselRef.current?.scrollTo({
      x: nextPage * carouselWidth,
      animated: true,
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Byt ordboksspråk till vänster, appens språk till höger */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={changeLanguages} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <LanguagePicker />
        </View>

        {/* SÖK */}
        <TextInput
          style={styles.searchInput}
          placeholder={t("searchPlaceholder")}
          value={search}
          onChangeText={setSearch}
        />

        {searchText.length > 0 && !hasEnoughLetters && (
          <Text style={styles.noResults}>{t("minThreeLetters")}</Text>
        )}

        {hasEnoughLetters && (
          <View style={styles.searchResults}>
            {searchResults.length === 0 ? (
              <Text style={styles.noResults}>{t("noMatches")}</Text>
            ) : (
              visibleResults.map((item) => (
                <View key={item.word_id} style={styles.searchRow}>
                  <Text style={styles.searchWord}>{item.text_from}</Text>

                  <Text style={styles.searchTranslation}>{item.text_to}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* KATEGORIER */}
        <View style={styles.categoryHeader}>
          <Text style={styles.title}>{t("categories")}</Text>

          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={() => setShowAddCategory(true)}
          >
            <Text style={styles.addCategoryText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.carouselRow}>
          {/* Pil vänster */}
          <TouchableOpacity
            style={styles.arrow}
            onPress={() => goToPage(page - 1)}
            disabled={!canGoLeft}
          >
            <Text style={canGoLeft ? styles.arrowText : styles.arrowTextFaded}>
              ‹
            </Text>
          </TouchableOpacity>

          {/* Tre kategorier i taget - svep för att se fler */}
          <View
            style={styles.carousel}
            onLayout={(event) =>
              setCarouselWidth(event.nativeEvent.layout.width)
            }
          >
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                if (carouselWidth > 0) {
                  setPage(
                    Math.round(
                      event.nativeEvent.contentOffset.x / carouselWidth,
                    ),
                  );
                }
              }}
            >
              {carouselWidth > 0 &&
                categoryPages.map((categoriesOnPage, pageIndex) => (
                  <View
                    key={pageIndex}
                    style={[styles.carouselPage, { width: carouselWidth }]}
                  >
                    {categoriesOnPage.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[styles.box, { width: boxWidth }]}
                        onPress={() => openCategory(category.name)}
                      >
                        <Text style={styles.categoryText}>
                          {getCategoryTranslation(category.name, t)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
            </ScrollView>
          </View>

          {/* Pil höger */}
          <TouchableOpacity
            style={styles.arrow}
            onPress={() => goToPage(page + 1)}
            disabled={!canGoRight}
          >
            <Text style={canGoRight ? styles.arrowText : styles.arrowTextFaded}>
              ›
            </Text>
          </TouchableOpacity>
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
          <Text>{t("dictionary")}</Text>
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
          <Text>{t("idioms")}</Text>
        </TouchableOpacity>

        {/* Notes */}
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/notesPage",
              params: { from, to },
            })
          }
        >
          <FontAwesome name="file-text-o" size={24} color="#111827" />
          <Text>{t("notes")}</Text>
        </TouchableOpacity>

        {/* Lägg till ord */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowAddWord(true)}
        >
          <Text>{t("addWord")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Popup för att lägga till kategori */}
      <Modal
        visible={showAddCategory}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddCategory(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.categoryModal}>
            <Text style={styles.modalTitle}>Lägg till kategori</Text>

            <TextInput
              style={styles.input}
              placeholder="Kategorinamn"
              value={newCategory}
              onChangeText={setNewCategory}
              autoFocus
            />

            <TouchableOpacity style={styles.addButton} onPress={addCategory}>
              <Text>Lägg till</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setNewCategory("");
                setShowAddCategory(false);
              }}
            >
              <Text>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              <Text style={styles.modalTitle}>{t("addWord")}</Text>

              <Text>
                {from} → {to}
              </Text>

              <TextInput
                style={styles.input}
                placeholder={t("word")}
                value={word}
                onChangeText={setWord}
              />

              <TextInput
                style={styles.input}
                placeholder={t("translation")}
                value={translation}
                onChangeText={setTranslation}
              />

              <Text style={styles.categoryTitle}>{t("category")}</Text>

              <Text style={styles.optionalText}>{t("categoryOptional")}</Text>

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
                        {getCategoryTranslation(category.name, t)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

              <TouchableOpacity style={styles.addButton} onPress={addWord}>
                <Text>{t("add")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedCategories([]);
                  setShowAddWord(false);
                }}
              >
                <Text>{t("cancel")}</Text>
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
    backgroundColor: colors.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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

  /* SÖK */

  searchInput: {
    borderWidth: 1.5,
    borderColor: "#9ca3af",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },

  searchResults: {
    marginBottom: 20,
  },

  searchRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
  },

  searchWord: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  searchTranslation: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },

  noResults: {
    fontSize: 14,
    color: "#6b7280",
    paddingVertical: 10,
  },

  /* KATEGORIER */

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    gap: 8,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 0,
  },

  addCategoryButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#9ca3af",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  addCategoryText: {
    fontSize: 20,
    lineHeight: 22,
    color: "#111827",
    fontWeight: "500",
  },

  carouselRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  carousel: {
    flex: 1,
  },

  carouselPage: {
    flexDirection: "row",
    gap: CATEGORY_GAP,
  },

  arrow: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  arrowText: {
    fontSize: 30,
    color: "#111827",
  },

  arrowTextFaded: {
    fontSize: 30,
    color: "#d1d5db",
  },

  box: {
    minHeight: 55,
    borderWidth: 1.5,
    borderColor: "#9ca3af",
    backgroundColor: "#fff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  categoryText: {
    textAlign: "center",
    fontSize: 14,
  },

  /* HUVUDBOXAR */

  button: {
    borderWidth: 1.5,
    borderColor: "#9ca3af",
    backgroundColor: "#fff",
    borderRadius: 8,
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

  categoryModal: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 8,
    marginHorizontal: 24,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    borderRadius: 8,
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
    borderWidth: 1.5,
    borderColor: "#9ca3af",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },

  selectedCategory: {
    borderWidth: 2,
    borderColor: "#111827",
    backgroundColor: "#fff",
    borderRadius: 8,
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
