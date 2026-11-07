import { BackButton } from "@/components/back-button";
import { LanguagePicker } from "@/components/language-picker";
import { SearchBar } from "@/components/search-bar";
import { useUiLanguage } from "@/context/ui-language-context";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  information: string | null;
};

const CATEGORIES_PER_PAGE = 3;
const CATEGORY_GAP = 10;
const RECENT_CATEGORIES_KEY = "recentCategories";
const CATEGORY_EXPANDED_KEY = "categoriesExpanded";
const MIN_SEARCH_LENGTH = 3;
const MAX_RESULTS = 3;

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

function sortByRecentlyUsed(categories: Category[], recentNames: string[]) {
  const recent: Category[] = [];

  for (const name of recentNames) {
    const category = categories.find((item) => item.name === name);
    if (category) recent.push(category);
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

// Söker på både ord och hela fraser.
function startsWithSearch(text: string, searchText: string) {
  const normalizedText = text.toLowerCase().trim().replace(/\s+/g, " ");

  const normalizedSearch = searchText.toLowerCase().trim().replace(/\s+/g, " ");

  if (!normalizedSearch) return false;

  if (normalizedSearch.includes(" ")) {
    return normalizedText.includes(normalizedSearch);
  }

  const words = normalizedText.split(/[\s/,()!?;:]+/);

  return words.some((word) => word.startsWith(normalizedSearch));
}

/** Liten diskret symbol: två deltagare och en tolk med namnbricka. */
function InterpreterLogo() {
  return (
    <View
      style={styles.logo}
      accessibilityLabel="TolkAppen – tre personer och tolk med namnbricka"
    >
      <View style={[styles.logoPerson, styles.logoSideLeft]}>
        <View style={styles.logoSideHead} />
        <View style={styles.logoSideBody} />
      </View>
      <View style={[styles.logoPerson, styles.logoSideRight]}>
        <View style={styles.logoSideHead} />
        <View style={styles.logoSideBody} />
      </View>
      <View style={styles.logoCenter}>
        <View style={styles.logoCenterHead} />
        <View style={styles.logoCenterBody} />
        <View style={styles.logoStrapLeft} />
        <View style={styles.logoStrapRight} />
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText} numberOfLines={1}>
            TolkAppen
          </Text>
          <View style={styles.logoBadgeTail} />
        </View>
      </View>
    </View>
  );
}

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

  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  const carouselRef = useRef<ScrollView>(null);

  const [showAddWord, setShowAddWord] = useState(false);

  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");

  const [wordInformation, setWordInformation] = useState("");

  const [selectedInformation, setSelectedInformation] =
    useState<Translation | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [showAddCategory, setShowAddCategory] = useState(false);

  const [newCategorySv, setNewCategorySv] = useState("");

  const [newCategoryEn, setNewCategoryEn] = useState("");

  const [newCategoryEs, setNewCategoryEs] = useState("");

  // Diskreta felmeddelanden.
  const [wordError, setWordError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const [savingWord, setSavingWord] = useState(false);

  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    loadCategories();
    loadRecentCategories();
    loadCategoriesExpanded();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllTranslations();
    }, [from, to]),
  );

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

  async function loadCategoriesExpanded() {
    try {
      const saved = await AsyncStorage.getItem(CATEGORY_EXPANDED_KEY);

      if (saved !== null) {
        setCategoriesExpanded(saved === "true");
      }
    } catch (error) {
      console.error("Kunde inte läsa kategoriläge:", error);
    }
  }

  async function toggleCategoriesExpanded() {
    const newValue = !categoriesExpanded;
    setCategoriesExpanded(newValue);

    try {
      await AsyncStorage.setItem(CATEGORY_EXPANDED_KEY, String(newValue));
    } catch (error) {
      console.error("Kunde inte spara kategoriläge:", error);
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
      setAllTranslations([]);
      return;
    }

    try {
      const result = await db.getAllAsync<Translation>(
        `
          SELECT DISTINCT
            from_translation.word_id,
            from_translation.text AS text_from,
            to_translation.text AS text_to,
            words.information AS information

          FROM translations AS from_translation

          INNER JOIN words
            ON words.id = from_translation.word_id

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

          ORDER BY LOWER(from_translation.text) ASC
          `,
        fromLanguage,
        toLanguage,
      );

      setAllTranslations(result);
    } catch (error) {
      console.error("Kunde inte läsa översättningar:", error);
      setAllTranslations([]);
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

  function closeAddCategory() {
    if (savingCategory) return;

    setNewCategorySv("");
    setNewCategoryEn("");
    setNewCategoryEs("");
    setCategoryError("");
    setShowAddCategory(false);
  }

  function closeAddWord() {
    if (savingWord) return;

    setWord("");
    setTranslation("");
    setWordInformation("");
    setSelectedCategories([]);
    setWordError("");
    setShowAddWord(false);
  }

  async function addCategory() {
    if (savingCategory) return;

    const categorySv = newCategorySv.trim();
    const categoryEn = newCategoryEn.trim();
    const categoryEs = newCategoryEs.trim();

    const filledLanguages = [categorySv, categoryEn, categoryEs].filter(
      (value) => value.length > 0,
    ).length;

    if (filledLanguages < 2) {
      setCategoryError(t("fillTwoLanguagesHelp"));
      return;
    }

    const fromLanguage = languageNames[String(from).toLowerCase()];

    const toLanguage = languageNames[String(to).toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      setCategoryError(t("languagesNotFound"));
      return;
    }

    setSavingCategory(true);
    setCategoryError("");

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
        setCategoryError(t("languagesNotFound"));
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
        setCategoryError(t("categoryExists"));
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

      await loadCategories();
      closeCategoryAfterSave();
    } catch (error) {
      console.error("Kunde inte spara kategori:", error);

      setCategoryError(t("categorySaveFailedHelp"));
    } finally {
      setSavingCategory(false);
    }
  }

  function closeCategoryAfterSave() {
    setNewCategorySv("");
    setNewCategoryEn("");
    setNewCategoryEs("");
    setCategoryError("");
    setShowAddCategory(false);
  }

  async function addWord() {
    if (savingWord) return;

    if (!word.trim() || !translation.trim()) {
      setWordError(t("fillAllFields"));
      return;
    }

    const fromLanguage = languageNames[String(from).toLowerCase()];

    const toLanguage = languageNames[String(to).toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      setWordError(t("languagesNotFound"));
      return;
    }

    setSavingWord(true);
    setWordError("");

    try {
      await db.runAsync(
        "INSERT OR IGNORE INTO words (name) VALUES (?)",
        word.trim(),
      );

      const wordResult = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM words WHERE name = ?",
        word.trim(),
      );

      if (!wordResult) {
        setWordError("Kunde inte spara ordet. Försök igen.");
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
        setWordError(t("languagesNotFound"));
        return;
      }

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

      // Frivillig information.
      if (wordInformation.trim()) {
        await db.runAsync(
          "UPDATE words SET information = ? WHERE id = ?",
          wordInformation.trim(),
          wordResult.id,
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
      setWordInformation("");
      setSelectedCategories([]);
      setWordError("");
      setShowAddWord(false);
    } catch (error) {
      console.error("Kunde inte spara ord:", error);

      setWordError("Kunde inte spara ordet. Försök igen.");
    } finally {
      setSavingWord(false);
    }
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
    ? allTranslations
        .filter(
          (item) =>
            startsWithSearch(item.text_from, searchText) ||
            startsWithSearch(item.text_to, searchText),
        )
        .map((item) => {
          const fromMatches = startsWithSearch(item.text_from, searchText);

          const toMatches = startsWithSearch(item.text_to, searchText);

          if (toMatches && !fromMatches) {
            return {
              ...item,
              text_from: item.text_to,
              text_to: item.text_from,
            };
          }

          return item;
        })
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View
        pointerEvents="none"
        accessible={false}
        style={styles.watermarkLayer}
      >
        <View style={styles.watermarkScale}>
          <InterpreterLogo />
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onTouchEnd={() => {
          if (selectedInformation) {
            setSelectedInformation(null);
          }
        }}
      >
        {/* HEADER */}

        <View style={styles.topRow}>
          <BackButton onPress={changeLanguages} />

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

        {/* SÖKNING */}

        <SearchBar
          value={search}
          onChangeText={(value) => {
            setSearch(value);
            setSelectedInformation(null);
          }}
        />

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
                  <Fragment key={item.word_id}>
                    <View style={styles.searchRow}>
                      <View style={styles.searchTextContainer}>
                        <Text style={styles.searchWord}>{item.text_from}</Text>

                        <Text style={styles.searchTranslation}>
                          {item.text_to}
                        </Text>
                      </View>

                      {!!item.information?.trim() && (
                        <TouchableOpacity
                          onTouchEnd={(event) => event.stopPropagation()}
                          onPress={() =>
                            setSelectedInformation((current) =>
                              current?.word_id === item.word_id ? null : item,
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Visa information om ${item.text_from}`}
                          style={styles.infoButton}
                        >
                          <FontAwesome
                            name="info-circle"
                            size={15}
                            color="#285F9D"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {selectedInformation?.word_id === item.word_id && (
                      <View
                        style={styles.inlineInfoPopup}
                        onTouchEnd={(event) => event.stopPropagation()}
                      >
                        <ScrollView
                          style={styles.inlineInfoScroll}
                          contentContainerStyle={styles.inlineInfoScrollContent}
                          nestedScrollEnabled
                        >
                          <Text style={styles.informationBody}>
                            {item.information}
                          </Text>
                        </ScrollView>
                      </View>
                    )}
                  </Fragment>
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
          <View style={styles.categoryHeaderTitle}>
            <Text style={styles.sectionTitle}>{t("categories")}</Text>

            <TouchableOpacity
              style={styles.collapseButton}
              onPress={toggleCategoriesExpanded}
              activeOpacity={0.8}
            >
              <FontAwesome
                name={categoriesExpanded ? "chevron-up" : "chevron-down"}
                size={15}
                color="#71859B"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={() => {
              setCategoryError("");
              setShowAddCategory(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.addCategoryText}>+</Text>
          </TouchableOpacity>
        </View>

        {categoriesExpanded && (
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
                      style={[
                        styles.carouselPage,
                        {
                          width: carouselWidth,
                        },
                      ]}
                    >
                      {categoriesOnPage.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryCard,
                            {
                              width: boxWidth,
                            },
                          ]}
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
        )}

        {/* ORDBOK OCH ÖVRIGA VYER */}

        <TouchableOpacity
          style={[styles.featureCard, { marginTop: 30 }]}
          onPress={() =>
            router.push({
              pathname: "/dictionaryPage",
              params: { from, to },
            })
          }
          activeOpacity={0.8}
        >
          <View style={styles.featureIcon}>
            <FontAwesome name="book" size={20} color="#285F9D" />
          </View>

          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t("dictionary")}</Text>
          </View>

          <Text style={styles.featureArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() =>
            router.push({
              pathname: "/idiomsPage",
              params: { from, to },
            })
          }
          activeOpacity={0.8}
        >
          <View style={styles.featureIcon}>
            <FontAwesome name="comments-o" size={20} color="#285F9D" />
          </View>

          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t("idioms")}</Text>
          </View>

          <Text style={styles.featureArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() =>
            router.push({
              pathname: "/notesPage",
              params: { from, to },
            })
          }
          activeOpacity={0.8}
        >
          <View style={styles.featureIcon}>
            <FontAwesome name="file-text-o" size={20} color="#285F9D" />
          </View>

          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t("notes")}</Text>
          </View>

          <Text style={styles.featureArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() =>
            router.push({
              pathname: "/flashcardsPage",
              params: { from, to },
            })
          }
          activeOpacity={0.8}
        >
          <View style={styles.featureIcon}>
            <FontAwesome name="clone" size={20} color="#285F9D" />
          </View>

          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{t("flashcards")}</Text>
          </View>

          <Text style={styles.featureArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL: LÄGG TILL KATEGORI */}

      <Modal
        visible={showAddCategory}
        transparent
        animationType="fade"
        onRequestClose={closeAddCategory}
      >
        <View style={styles.modalBackground}>
          <View style={styles.categoryModal}>
            <Text style={styles.modalTitle}>{t("addCategory")}</Text>

            <Text style={styles.languageLabel}>Svenska</Text>

            <TextInput
              style={styles.input}
              value={newCategorySv}
              onChangeText={(value) => {
                setNewCategorySv(value);
                setCategoryError("");
              }}
              autoFocus
            />

            <Text style={styles.languageLabel}>English</Text>

            <TextInput
              style={styles.input}
              value={newCategoryEn}
              onChangeText={(value) => {
                setNewCategoryEn(value);
                setCategoryError("");
              }}
            />

            <Text style={styles.languageLabel}>Español</Text>

            <TextInput
              style={styles.input}
              value={newCategoryEs}
              onChangeText={(value) => {
                setNewCategoryEs(value);
                setCategoryError("");
              }}
            />

            <Text style={styles.categoryHint}>{t("fillTwoLanguages")}</Text>

            {!!categoryError && (
              <Text style={styles.formError}>{categoryError}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.modalPrimaryButton,
                savingCategory && styles.disabledButton,
              ]}
              onPress={addCategory}
              disabled={savingCategory}
              activeOpacity={0.8}
            >
              <Text style={styles.modalPrimaryButtonText}>
                {savingCategory ? "Sparar..." : t("add")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={closeAddCategory}
              disabled={savingCategory}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: LÄGG TILL ORD */}

      <Modal
        visible={showAddWord}
        transparent
        animationType="fade"
        onRequestClose={closeAddWord}
      >
        <View style={styles.modalBackground}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.categoryModal}>
              <Text style={styles.modalTitle}>{t("addWord")}</Text>

              <View style={styles.modalLanguagePair}>
                <Text style={styles.modalLanguageText}>{from}</Text>

                <Text style={styles.modalLanguageArrow}>→</Text>

                <Text style={styles.modalLanguageText}>{to}</Text>
              </View>

              <TextInput
                style={styles.input}
                value={word}
                onChangeText={(value) => {
                  setWord(value);
                  setWordError("");
                }}
              />

              <TextInput
                style={styles.input}
                value={translation}
                onChangeText={(value) => {
                  setTranslation(value);
                  setWordError("");
                }}
              />

              <Text style={styles.informationLabel}>
                Information (frivilligt)
              </Text>

              <TextInput
                style={[styles.input, styles.informationInput]}
                value={wordInformation}
                onChangeText={(value) => {
                  setWordInformation(value);
                  setWordError("");
                }}
                multiline
                textAlignVertical="top"
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

              {!!wordError && <Text style={styles.formError}>{wordError}</Text>}

              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  savingWord && styles.disabledButton,
                ]}
                onPress={addWord}
                disabled={savingWord}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {savingWord ? "Sparar..." : t("add")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeAddWord}
                disabled={savingWord}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>{t("cancel")}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Samma tre personer som på startsidan, som mycket svag vattenstämpel.
  // pointerEvents="none" gör att den aldrig blockerar tryck eller scrollning.
  watermarkLayer: {
    position: "absolute",
    top: "24%",
    left: 0,
    right: 0,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.055,
  },
  watermarkScale: {
    width: 106,
    height: 83,
    transform: [{ scale: 2.8 }],
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 106,
    height: 90,
    alignSelf: "center",
    marginBottom: 34,
    position: "relative",
    transform: [{ scale: 1.6 }],
  },
  logoPerson: {
    position: "absolute",
    top: 12,
    width: 38,
    height: 55,
    alignItems: "center",
  },
  logoSideLeft: { left: 2 },
  logoSideRight: { right: 2 },
  logoSideHead: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: "#91B7DA",
  },
  logoSideBody: {
    width: 35,
    height: 29,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#91B7DA",
    marginTop: 3,
  },
  logoCenter: {
    position: "absolute",
    top: 0,
    left: 29,
    width: 48,
    height: 70,
    alignItems: "center",
  },
  logoCenterHead: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#234C7A",
    zIndex: 2,
  },
  logoCenterBody: {
    position: "absolute",
    top: 27,
    width: 48,
    height: 41,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: "#234C7A",
  },
  logoStrapLeft: {
    position: "absolute",
    top: 28,
    left: 16,
    width: 3,
    height: 24,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-28deg" }],
    zIndex: 3,
  },
  logoStrapRight: {
    position: "absolute",
    top: 28,
    right: 16,
    width: 3,
    height: 24,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "28deg" }],
    zIndex: 3,
  },
  logoBadge: {
    position: "absolute",
    top: 43,
    width: 53,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 4,
  },
  logoBadgeText: { fontSize: 8, fontWeight: "700", color: "#234C7A" },
  logoBadgeTail: {
    position: "absolute",
    bottom: -3,
    left: 10,
    width: 7,
    height: 7,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F9FD",
  },

  scrollView: {
    flex: 1,
    zIndex: 1,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 50,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  languagePair: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  languagePairText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#304C69",
  },

  languagePairArrow: {
    fontSize: 16,
    color: "#8299AF",
    marginHorizontal: 10,
  },

  searchHint: {
    fontSize: 13,
    color: "#8299AF",
    marginTop: 8,
    marginLeft: 4,
  },

  searchResults: {
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  searchRow: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
  },

  searchTextContainer: {
    flex: 1,
  },

  searchWord: {
    fontSize: 15,
    fontWeight: "600",
    color: "#203B59",
  },

  searchTranslation: {
    fontSize: 14,
    color: "#71859B",
    marginTop: 3,
  },

  infoButton: {
    marginLeft: 12,
    padding: 8,
  },

  inlineInfoPopup: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F5F9FD",
    borderColor: "#C9DEEE",
    borderWidth: 1,
    borderRadius: 10,
  },

  inlineInfoScroll: {
    maxHeight: 130,
  },

  inlineInfoScrollContent: {
    paddingRight: 24,
  },

  informationLabel: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#304C69",
  },

  informationInput: {
    minHeight: 85,
  },

  informationBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "#71859B",
  },

  noResults: {
    fontSize: 14,
    color: "#8299AF",
    padding: 16,
  },

  moreResults: {
    fontSize: 12,
    color: "#8299AF",
    padding: 12,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 14,
  },

  categoryHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
  },

  collapseButton: {
    marginLeft: 9,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },

  sectionHeaderSimple: {
    marginTop: 30,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#203B59",
  },

  addCategoryButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: 8,
    backgroundColor: "#E9F3FB",
    borderWidth: 1,
    borderColor: "#DCEBF7",
    alignItems: "center",
    justifyContent: "center",
  },

  addCategoryText: {
    fontSize: 21,
    lineHeight: 23,
    color: "#285F9D",
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

  arrowButton: {
    width: 25,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },

  arrowText: {
    fontSize: 29,
    color: "#475569",
    fontWeight: "300",
  },

  arrowTextDisabled: {
    fontSize: 29,
    color: "#CBD5E1",
    fontWeight: "300",
  },

  categoryCard: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#FFFFFF",
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
    color: "#304C69",
  },

  featureCard: {
    minHeight: 76,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE8F1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#E9F3FB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#203B59",
  },

  featureArrow: {
    fontSize: 26,
    fontWeight: "300",
    color: "#8299AF",
    marginLeft: 8,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.30)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalScroll: {
    width: "100%",
    flexGrow: 0,
    flexShrink: 1,
  },

  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  categoryModal: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 22,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#203B59",
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
    color: "#304C69",
  },

  modalLanguageArrow: {
    color: "#8299AF",
    marginHorizontal: 8,
  },

  languageLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#304C69",
    marginTop: 10,
    marginBottom: 5,
  },

  categoryHint: {
    fontSize: 12,
    color: "#8299AF",
    marginTop: 10,
    lineHeight: 17,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#F5F9FD",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: "#203B59",
    marginTop: 5,
    fontSize: 15,
  },

  categoryTitle: {
    marginTop: 20,
    marginBottom: 5,
    fontWeight: "700",
    color: "#203B59",
  },

  optionalText: {
    fontSize: 12,
    color: "#8299AF",
    marginBottom: 10,
  },

  category: {
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 7,
  },

  selectedCategory: {
    borderWidth: 1.5,
    borderColor: "#285F9D",
    backgroundColor: "#E9F3FB",
    borderRadius: 12,
    padding: 11,
    marginBottom: 7,
  },

  categoryOptionText: {
    color: "#304C69",
    fontSize: 14,
  },

  selectedCategoryText: {
    color: "#285F9D",
    fontSize: 14,
    fontWeight: "600",
  },

  modalPrimaryButton: {
    width: 160,
    height: 46,
    alignSelf: "center",
    borderRadius: 12,
    backgroundColor: "#285F9D",
    borderWidth: 1,
    borderColor: "#285F9D",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  modalPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  modalCancelButton: {
    width: 160,
    height: 46,
    alignSelf: "center",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE8F1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  modalCancelText: {
    color: "#304C69",
    fontSize: 15,
    fontWeight: "600",
  },

  formError: {
    color: "#9A5B22",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
});
