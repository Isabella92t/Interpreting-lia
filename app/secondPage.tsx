import { LanguagePicker } from "@/components/language-picker";
import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  name_sv: string | null;
  name_en: string | null;
  name_es: string | null;
};

type Translation = {
  word_id: number;
  text_from: string;
  text_to: string;
};

const CATEGORIES_PER_PAGE = 3;
const CATEGORY_GAP = 10;
const RECENT_CATEGORIES_KEY = "recentCategories";
const MIN_SEARCH_LENGTH = 3;
const MAX_RESULTS = 3;

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

function splitIntoPages(categories: Category[]) {
  const pages: Category[][] = [];

  for (let i = 0; i < categories.length; i += CATEGORIES_PER_PAGE) {
    pages.push(categories.slice(i, i + CATEGORIES_PER_PAGE));
  }

  return pages;
}

function startsWithSearch(text: string, searchText: string) {
  const words = text.toLowerCase().split(/[\s/,()]+/);

  return words.some((word) => word.startsWith(searchText));
}

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

export default function SecondPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { t, language } = useUiLanguage();

  const { from, to } = useLocalSearchParams<{
    from?: string;
    to?: string;
  }>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [allTranslations, setAllTranslations] = useState<Translation[]>([]);

  const [search, setSearch] = useState("");

  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);

  const carouselRef = useRef<ScrollView>(null);

  const [showAddWord, setShowAddWord] = useState(false);

  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [showAddCategory, setShowAddCategory] = useState(false);

  const [newCategorySv, setNewCategorySv] = useState("");
  const [newCategoryEn, setNewCategoryEn] = useState("");
  const [newCategoryEs, setNewCategoryEs] = useState("");

  useEffect(() => {
    loadCategories();
    loadRecentCategories();
  }, []);

  useEffect(() => {
    loadAllTranslations();
  }, [from, to]);

  async function loadCategories() {
    try {
      const result = await db.getAllAsync<Category>(
        `
          SELECT
            id,
            name,
            name_sv,
            name_en,
            name_es
          FROM tags
          ORDER BY name ASC
        `,
      );

      setCategories(result);
    } catch (error) {
      console.error("Kunde inte läsa kategorier:", error);
    }
  }

  async function loadRecentCategories() {
    try {
      const saved = await AsyncStorage.getItem(RECENT_CATEGORIES_KEY);

      if (saved) {
        setRecentCategories(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Kunde inte läsa senaste kategorier:", error);
    }
  }

  async function openCategory(categoryName: string) {
    const updated = [
      categoryName,
      ...recentCategories.filter((name) => name !== categoryName),
    ];

    setRecentCategories(updated);

    await AsyncStorage.setItem(RECENT_CATEGORIES_KEY, JSON.stringify(updated));

    router.push({
      pathname: "/dictionaryPage",
      params: {
        from,
        to,
        category: categoryName,
      },
    });
  }

  async function loadAllTranslations() {
    const fromLanguage = languageNames[String(from).toLowerCase()];
    const toLanguage = languageNames[String(to).toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      return;
    }

    try {
      const result = await db.getAllAsync<Translation>(
        `
          SELECT DISTINCT
            from_translation.text AS text_from,
            to_translation.text AS text_to,
            from_translation.word_id
          FROM translations AS from_translation
          INNER JOIN translations AS to_translation
            ON from_translation.word_id =
               to_translation.word_id
          INNER JOIN languages AS from_language
            ON from_translation.language_id =
               from_language.id
          INNER JOIN languages AS to_language
            ON to_translation.language_id =
               to_language.id
          WHERE from_language.name = ?
            AND to_language.name = ?
          ORDER BY LOWER(text_from) ASC
        `,
        fromLanguage,
        toLanguage,
      );

      setAllTranslations(result);
    } catch (error) {
      console.error("Kunde inte läsa översättningar:", error);
    }
  }

  function changeLanguages() {
    router.dismissTo("/firstPage");
  }

  function getCategoryName(category: Category) {
    const currentLanguage = String(language).toLowerCase();

    const svenska = category.name_sv?.trim() || "";
    const engelska = category.name_en?.trim() || "";
    const spanska = category.name_es?.trim() || "";

    if (currentLanguage === "sv") {
      return svenska || engelska || spanska || category.name;
    }

    if (currentLanguage === "en") {
      return engelska || svenska || spanska || category.name;
    }

    if (currentLanguage === "es") {
      return spanska || svenska || engelska || category.name;
    }

    return svenska || engelska || spanska || category.name;
  }

  async function addCategory() {
    const categorySv = newCategorySv.trim();
    const categoryEn = newCategoryEn.trim();
    const categoryEs = newCategoryEs.trim();

    const filledLanguages = [categorySv, categoryEn, categoryEs].filter(
      (value) => value.length > 0,
    ).length;

    if (filledLanguages < 2) {
      Alert.alert(
        "Fyll i minst två språk",
        "Du kan välja vilka två eller tre språk du vill använda.",
      );

      return;
    }

    const fromLanguage = languageNames[String(from).toLowerCase()];
    const toLanguage = languageNames[String(to).toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      Alert.alert(t("languagesNotFound"));
      return;
    }

    try {
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

      const internalName = categorySv || categoryEn || categoryEs;

      const existingCategory = await db.getFirstAsync<{ id: number }>(
        `
            SELECT id
            FROM tags
            WHERE LOWER(name) = LOWER(?)
              AND from_language_id = ?
              AND to_language_id = ?
          `,
        internalName,
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
            name_sv,
            name_en,
            name_es,
            from_language_id,
            to_language_id
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        internalName,
        categorySv,
        categoryEn,
        categoryEs,
        fromLanguageResult.id,
        toLanguageResult.id,
      );

      setNewCategorySv("");
      setNewCategoryEn("");
      setNewCategoryEs("");
      setShowAddCategory(false);

      await loadCategories();

      Alert.alert("Kategori tillagd");
    } catch (error) {
      console.error("Kunde inte spara kategori:", error);

      Alert.alert(
        "Kunde inte spara kategorin",
        "Något gick fel när kategorin skulle sparas.",
      );
    }
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
        `
          INSERT OR IGNORE INTO translations
            (word_id, language_id, text)
            VALUES (?, ?, ?)
        `,
        wordResult.id,
        fromLanguageResult.id,
        word.trim(),
      );
    }

    if (toLanguageResult) {
      await db.runAsync(
        `
          INSERT OR IGNORE INTO translations
            (word_id, language_id, text)
            VALUES (?, ?, ?)
        `,
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
          `
            INSERT OR IGNORE INTO word_tags
              (word_id, tag_id)
              VALUES (?, ?)
          `,
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
            `
              INSERT OR IGNORE INTO word_tags
                (word_id, tag_id)
                VALUES (?, ?)
            `,
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

  const categoryPages = splitIntoPages(
    sortByRecentlyUsed(categories, recentCategories),
  );

  const boxWidth =
    carouselWidth > 0
      ? (carouselWidth - CATEGORY_GAP * 2) / CATEGORIES_PER_PAGE
      : 0;

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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={changeLanguages}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <LanguagePicker />
        </View>

        {/* SPRÅKPAR */}

        <View style={styles.languagePair}>
          <Text style={styles.languagePairText}>
            {languageNames[String(from).toLowerCase()] || from}
          </Text>

          <Text style={styles.languagePairArrow}>→</Text>

          <Text style={styles.languagePairText}>
            {languageNames[String(to).toLowerCase()] || to}
          </Text>
        </View>

        {/* GLOBAL SÖKNING */}

        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={17} color={colors.textSecondary} />

          <TextInput
            style={styles.searchInput}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {searchText.length > 0 && !hasEnoughLetters && (
          <Text style={styles.searchHint}>{t("minThreeLetters")}</Text>
        )}

        {hasEnoughLetters && (
          <View style={styles.searchResults}>
            {searchResults.length === 0 ? (
              <Text style={styles.noResults}>{t("noMatches")}</Text>
            ) : (
              <>
                {visibleResults.map((item) => (
                  <View key={item.word_id} style={styles.searchRow}>
                    <View style={styles.searchTextContainer}>
                      <Text style={styles.searchWord}>{item.text_from}</Text>

                      <Text style={styles.searchTranslation}>
                        {item.text_to}
                      </Text>
                    </View>

                    <Text style={styles.searchArrow}>→</Text>
                  </View>
                ))}

                {searchResults.length > MAX_RESULTS && (
                  <Text style={styles.moreResults}>
                    + {searchResults.length - MAX_RESULTS} fler träffar
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* KATEGORIER */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("categories")}</Text>

          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={() => setShowAddCategory(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addCategoryText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.carouselRow}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => goToPage(page - 1)}
            disabled={!canGoLeft}
            activeOpacity={0.7}
          >
            <Text
              style={canGoLeft ? styles.arrowText : styles.arrowTextDisabled}
            >
              ‹
            </Text>
          </TouchableOpacity>

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
                        style={[styles.categoryCard, { width: boxWidth }]}
                        onPress={() => openCategory(category.name)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.categoryText}>
                          {getCategoryName(category)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => goToPage(page + 1)}
            disabled={!canGoRight}
            activeOpacity={0.7}
          >
            <Text
              style={canGoRight ? styles.arrowText : styles.arrowTextDisabled}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* HUVUDFUNKTIONER */}

        <View style={styles.sectionHeaderSimple}>
          <Text style={styles.sectionTitle}>Ord & uttryck</Text>
        </View>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() =>
            router.push({
              pathname: "/dictionaryPage",
              params: {
                from,
                to,
              },
            })
          }
          activeOpacity={0.8}
        >
          <View style={styles.featureIcon}>
            <FontAwesome name="book" size={21} color={colors.primary} />
          </View>

          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t("dictionary")}</Text>

            <Text style={styles.featureDescription}>
              Bläddra bland ord och öva på dina språk
            </Text>
          </View>

          <Text style={styles.featureArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() =>
            router.push({
              pathname: "/idiomsPage",
              params: {
                from,
                to,
              },
            })
          }
          activeOpacity={0.8}
        >
          <View style={styles.featureIcon}>
            <FontAwesome name="comments-o" size={21} color={colors.primary} />
          </View>

          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t("idioms")}</Text>

            <Text style={styles.featureDescription}>
              Vanliga uttryck och fraser
            </Text>
          </View>

          <Text style={styles.featureArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() =>
            router.push({
              pathname: "/notesPage",
              params: {
                from,
                to,
              },
            })
          }
          activeOpacity={0.8}
        >
          <View style={styles.featureIcon}>
            <FontAwesome name="file-text-o" size={21} color={colors.primary} />
          </View>

          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t("notes")}</Text>

            <Text style={styles.featureDescription}>
              Dina egna anteckningar
            </Text>
          </View>

          <Text style={styles.featureArrow}>›</Text>
        </TouchableOpacity>

        {/* LÄGG TILL ORD */}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setShowAddWord(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonPlus}>+</Text>

          <Text style={styles.secondaryButtonText}>{t("addWord")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ------------------------------------------ */}
      {/* LÄGG TILL KATEGORI */}
      {/* ------------------------------------------ */}

      <Modal
        visible={showAddCategory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCategory(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.categoryModal}>
            <Text style={styles.modalTitle}>Lägg till kategori</Text>

            <Text style={styles.languageLabel}>Svenska</Text>

            <TextInput
              style={styles.input}
              placeholder="Kategorinamn på svenska"
              placeholderTextColor={colors.textSecondary}
              value={newCategorySv}
              onChangeText={setNewCategorySv}
              autoFocus
            />

            <Text style={styles.languageLabel}>English</Text>

            <TextInput
              style={styles.input}
              placeholder="Category name in English"
              placeholderTextColor={colors.textSecondary}
              value={newCategoryEn}
              onChangeText={setNewCategoryEn}
            />

            <Text style={styles.languageLabel}>Español</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre de categoría en español"
              placeholderTextColor={colors.textSecondary}
              value={newCategoryEs}
              onChangeText={setNewCategoryEs}
            />

            <Text style={styles.categoryHint}>
              Fyll i minst två av de tre språken.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={addCategory}
              activeOpacity={0.8}
            >
              <Text style={styles.modalPrimaryButtonText}>Lägg till</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setNewCategorySv("");
                setNewCategoryEn("");
                setNewCategoryEs("");
                setShowAddCategory(false);
              }}
            >
              <Text style={styles.modalCancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------ */}
      {/* LÄGG TILL ORD */}
      {/* ------------------------------------------ */}

      <Modal
        visible={showAddWord}
        transparent
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

              <View style={styles.modalLanguagePair}>
                <Text style={styles.modalLanguageText}>{from}</Text>

                <Text style={styles.modalLanguageArrow}>→</Text>

                <Text style={styles.modalLanguageText}>{to}</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder={t("word")}
                placeholderTextColor={colors.textSecondary}
                value={word}
                onChangeText={setWord}
              />

              <TextInput
                style={styles.input}
                placeholder={t("translation")}
                placeholderTextColor={colors.textSecondary}
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
                      activeOpacity={0.8}
                    >
                      <Text
                        style={
                          isSelected
                            ? styles.selectedCategoryText
                            : styles.categoryOptionText
                        }
                      >
                        {isSelected ? "✓  " : ""}
                        {getCategoryName(category)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={addWord}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryButtonText}>{t("add")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setSelectedCategories([]);
                  setShowAddWord(false);
                }}
              >
                <Text style={styles.modalCancelText}>{t("cancel")}</Text>
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 50,
  },

  /* HEADER */

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  backButtonText: {
    fontSize: 21,
    fontWeight: "500",
    color: colors.text,
  },

  languagePair: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  languagePairText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  languagePairArrow: {
    fontSize: 17,
    color: colors.textSecondary,
    marginHorizontal: 10,
  },

  /* SÖK */

  searchContainer: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 11,
    fontSize: 16,
    color: colors.text,
  },

  searchHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    marginLeft: 4,
  },

  searchResults: {
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },

  searchRow: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  searchTextContainer: {
    flex: 1,
  },

  searchWord: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  searchTranslation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 3,
  },

  searchArrow: {
    fontSize: 18,
    color: colors.primary,
    marginLeft: 12,
  },

  noResults: {
    fontSize: 14,
    color: colors.textSecondary,
    padding: 16,
  },

  moreResults: {
    fontSize: 12,
    color: colors.textSecondary,
    padding: 12,
    textAlign: "center",
  },

  /* SEKTIONER */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    marginBottom: 14,
  },

  sectionHeaderSimple: {
    marginTop: 30,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.text,
  },

  addCategoryButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  addCategoryText: {
    fontSize: 21,
    lineHeight: 23,
    color: colors.primary,
    fontWeight: "500",
  },

  /* KATEGORIER */

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

  arrowButton: {
    width: 24,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },

  arrowText: {
    fontSize: 30,
    color: colors.text,
    fontWeight: "300",
  },

  arrowTextDisabled: {
    fontSize: 30,
    color: colors.border,
    fontWeight: "300",
  },

  categoryCard: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },

  categoryText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.text,
  },

  /* HUVUDFUNKTIONER */

  featureCard: {
    minHeight: 76,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: "650",
    color: colors.text,
  },

  featureDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },

  featureArrow: {
    fontSize: 27,
    fontWeight: "300",
    color: colors.textSecondary,
    marginLeft: 8,
  },

  /* LÄGG TILL ORD */

  secondaryButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  secondaryButtonPlus: {
    fontSize: 20,
    color: colors.primary,
    marginRight: 8,
    fontWeight: "500",
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  /* MODAL */

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  modal: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  categoryModal: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 20,
    marginHorizontal: 24,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 18,
  },

  modalLanguagePair: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  modalLanguageText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },

  modalLanguageArrow: {
    color: colors.textSecondary,
    marginHorizontal: 8,
  },

  languageLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 10,
    marginBottom: 5,
  },

  categoryHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 17,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: colors.text,
    marginTop: 5,
    fontSize: 15,
  },

  categoryTitle: {
    marginTop: 20,
    marginBottom: 5,
    fontWeight: "700",
    color: colors.text,
  },

  optionalText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },

  category: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 7,
  },

  selectedCategory: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 11,
    marginBottom: 7,
  },

  categoryOptionText: {
    color: colors.text,
    fontSize: 14,
  },

  selectedCategoryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  modalPrimaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  modalPrimaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },

  modalCancelButton: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
