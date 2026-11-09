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

// Texter som används på den här sidan och ännu inte finns i t().
const pageTexts = {
  sv: {
    saving: "Sparar...",
    optionalInformation: "Information (frivilligt)",
    moreResults: "fler träffar",
    saveWordFailed: "Kunde inte spara ordet. Försök igen.",
    chooseCategory: "Välj kategori",
    done: "Klar",
    showInformationAbout: "Visa information om",
  },
  en: {
    saving: "Saving...",
    optionalInformation: "Information (optional)",
    moreResults: "more results",
    saveWordFailed: "Could not save the word. Please try again.",
    chooseCategory: "Choose category",
    done: "Done",
    showInformationAbout: "Show information about",
  },
  es: {
    saving: "Guardando...",
    optionalInformation: "Información (opcional)",
    moreResults: "resultados más",
    saveWordFailed: "No se pudo guardar la palabra. Inténtalo de nuevo.",
    chooseCategory: "Elegir categoría",
    done: "Listo",
    showInformationAbout: "Mostrar información sobre",
  },
};

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
  const pageText =
    pageTexts[String(language).toLowerCase() as keyof typeof pageTexts] ??
    pageTexts.sv;

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
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [englishWord, setEnglishWord] = useState("");

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
    loadRecentCategories();
    loadCategoriesExpanded();
  }, []);

  // Uppdatera kategorier och sökresultat när användaren återvänder hit.
  useFocusEffect(
    useCallback(() => {
      loadCategories();
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

  // Visa alltid valt källspråk först, målspråk sedan och tredje språket sist.
  const orderedLanguageCodes = Array.from(
    new Set([
      String(from ?? "").toLowerCase(),
      String(to ?? "").toLowerCase(),
      "sv",
      "en",
      "es",
    ]),
  ).filter((code) => code === "sv" || code === "en" || code === "es");

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
    setEnglishWord("");
    setWordInformation("");
    setSelectedCategories([]);
    setShowCategoryPicker(false);
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

    // Alla tre språken visas. De två valda språken behåller sina
    // befintliga inmatningsfält, och det tredje språket har ett eget fält.
    const fromCode = String(from ?? "").toLowerCase();
    const toCode = String(to ?? "").toLowerCase();
    const thirdCode = ["sv", "en", "es"].find(
      (code) => code !== fromCode && code !== toCode,
    );
    if (
      !languageNames[fromCode] ||
      !languageNames[toCode] ||
      !thirdCode ||
      fromCode === toCode
    ) {
      setWordError(t("languagesNotFound"));
      return;
    }

    const entries = [
      { code: fromCode, text: word.trim() },
      { code: toCode, text: translation.trim() },
      { code: thirdCode, text: englishWord.trim() },
    ];
    if (entries.filter((entry) => entry.text.length > 0).length < 2) {
      setWordError(t("fillTwoLanguagesHelp"));
      return;
    }

    setSavingWord(true);
    setWordError("");

    try {
      // Alla databasändringar för ett ord sparas tillsammans.
      // Om något steg misslyckas ångras hela sparningen automatiskt.
      await db.withExclusiveTransactionAsync(async (transaction) => {
        const wordName =
          word.trim() || translation.trim() || englishWord.trim();
        await transaction.runAsync(
          "INSERT OR IGNORE INTO words (name) VALUES (?)",
          wordName,
        );

        const wordResult = await transaction.getFirstAsync<{ id: number }>(
          "SELECT id FROM words WHERE name = ?",
          wordName,
        );

        if (!wordResult) {
          throw new Error("Kunde inte hitta ordet efter sparning.");
        }

        for (const entry of entries) {
          if (!entry.text) continue;
          const languageResult = await transaction.getFirstAsync<{
            id: number;
          }>(
            "SELECT id FROM languages WHERE name = ?",
            languageNames[entry.code],
          );
          if (!languageResult) throw new Error(`Språket ${entry.code} saknas`);
          await transaction.runAsync(
            `INSERT OR IGNORE INTO translations
             (word_id, language_id, text) VALUES (?, ?, ?)`,
            wordResult.id,
            languageResult.id,
            entry.text,
          );
        }

        // Frivillig information.
        if (wordInformation.trim()) {
          await transaction.runAsync(
            "UPDATE words SET information = ? WHERE id = ?",
            wordInformation.trim(),
            wordResult.id,
          );
        }

        if (selectedCategories.length === 0) {
          const otherCategory = await transaction.getFirstAsync<{ id: number }>(
            "SELECT id FROM tags WHERE name = ?",
            "Övrigt",
          );

          if (otherCategory) {
            await transaction.runAsync(
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
            const categoryResult = await transaction.getFirstAsync<{
              id: number;
            }>("SELECT id FROM tags WHERE name = ?", categoryName);

            if (categoryResult) {
              await transaction.runAsync(
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
      });

      await loadAllTranslations();

      setWord("");
      setTranslation("");
      setEnglishWord("");
      setWordInformation("");
      setSelectedCategories([]);
      setWordError("");
      setShowAddWord(false);
    } catch (error) {
      console.error("Kunde inte spara ord:", error);

      setWordError(pageText.saveWordFailed);
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
                          onPressIn={(event) => event.stopPropagation()}
                          onPress={() =>
                            setSelectedInformation((current) =>
                              current?.word_id === item.word_id ? null : item,
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`${pageText.showInformationAbout} ${item.text_from}`}
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
                    + {searchResults.length - MAX_RESULTS}{" "}
                    {pageText.moreResults}
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

      {/* Plusknappen ligger längst ner och påverkas inte av sidans scrollning. */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={styles.bottomAddButton}
          onPress={() => setShowAddMenu(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t("add")}
        >
          <Text style={styles.bottomAddText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Välj vad som ska skapas. De befintliga formulären återanvänds. */}
      <Modal
        visible={showAddMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMenu(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.addMenuCard}>
            <TouchableOpacity
              style={styles.addMenuOption}
              onPress={() => {
                setShowAddMenu(false);
                setWordError("");
                setShowAddWord(true);
              }}
              accessibilityRole="button"
            >
              <FontAwesome name="book" size={19} color="#285F9D" />
              <Text style={styles.addMenuOptionText}>{t("word")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addMenuOption}
              onPress={() => {
                setShowAddMenu(false);
                setCategoryError("");
                setShowAddCategory(true);
              }}
              accessibilityRole="button"
            >
              <FontAwesome name="folder-o" size={19} color="#285F9D" />
              <Text style={styles.addMenuOptionText}>{t("category")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowAddMenu(false)}
            >
              <Text style={styles.modalCancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

            {orderedLanguageCodes.map((code, index) => (
              <Fragment key={code}>
                <Text style={styles.languageLabel}>{languageNames[code]}</Text>
                <TextInput
                  style={styles.input}
                  value={
                    code === "sv"
                      ? newCategorySv
                      : code === "en"
                        ? newCategoryEn
                        : newCategoryEs
                  }
                  onChangeText={(value) => {
                    if (code === "sv") setNewCategorySv(value);
                    else if (code === "en") setNewCategoryEn(value);
                    else setNewCategoryEs(value);
                    setCategoryError("");
                  }}
                  autoFocus={index === 0}
                />
              </Fragment>
            ))}

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
                {savingCategory ? pageText.saving : t("add")}
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

              <Text style={styles.languageLabel}>
                {languageNames[String(from ?? "").toLowerCase()] || from}
              </Text>
              <TextInput
                style={styles.input}
                value={word}
                onChangeText={(value) => {
                  setWord(value);
                  setWordError("");
                }}
              />

              <Text style={styles.languageLabel}>
                {languageNames[String(to ?? "").toLowerCase()] || to}
              </Text>
              <TextInput
                style={styles.input}
                value={translation}
                onChangeText={(value) => {
                  setTranslation(value);
                  setWordError("");
                }}
              />

              <Text style={styles.languageLabel}>
                {
                  languageNames[
                    ["sv", "en", "es"].find(
                      (code) =>
                        code !== String(from ?? "").toLowerCase() &&
                        code !== String(to ?? "").toLowerCase(),
                    ) ?? "en"
                  ]
                }
              </Text>
              <TextInput
                style={styles.input}
                value={englishWord}
                onChangeText={(value) => {
                  setEnglishWord(value);
                  setWordError("");
                }}
              />

              <Text style={styles.informationLabel}>
                {pageText.optionalInformation}
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

              <TouchableOpacity
                style={styles.categoryPickerButton}
                onPress={() => setShowCategoryPicker((current) => !current)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ expanded: showCategoryPicker }}
              >
                <Text style={styles.categoryPickerButtonText}>
                  {pageText.chooseCategory}
                  {selectedCategories.length > 0
                    ? ` (${selectedCategories.length})`
                    : ""}
                </Text>
                <FontAwesome
                  name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                  size={14}
                  color="#285F9D"
                />
              </TouchableOpacity>

              {showCategoryPicker && (
                <View style={styles.categoryPickerPanel}>
                  <ScrollView
                    style={styles.categoryPickerScroll}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator
                  >
                    {categories
                      .filter((category) => category.name !== "Övrigt")
                      .map((category) => {
                        const isSelected = selectedCategories.includes(
                          category.name,
                        );
                        return (
                          <TouchableOpacity
                            key={category.id}
                            style={
                              isSelected
                                ? styles.selectedCategory
                                : styles.category
                            }
                            onPress={() => toggleCategory(category.name)}
                            activeOpacity={0.8}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isSelected }}
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
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.categoryPickerDone}
                    onPress={() => setShowCategoryPicker(false)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.categoryPickerDoneText}>
                      {pageText.done}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

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
                  {savingWord ? pageText.saving : t("add")}
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
    backgroundColor: "#EAF3FA",
  },

  scrollView: {
    flex: 1,
    zIndex: 1,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
  },
  bottomActionBar: {
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    zIndex: 2,
  },
  bottomAddButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DCECF8",
    borderWidth: 1,
    borderColor: "#DCEBF7",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomAddText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "500",
    color: "#285F9D",
  },
  addMenuCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
  },
  addMenuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#F7FAFD",
    borderRadius: 12,
  },
  addMenuOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#203B59",
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

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#203B59",
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E9ED",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    shadowColor: "#597783",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 9,
    elevation: 2,
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
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E9EA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: "#597783",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 9,
    elevation: 2,
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
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

  categoryPickerButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#F5F9FD",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryPickerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#285F9D",
  },
  categoryPickerPanel: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#FFFFFF",
  },
  categoryPickerScroll: {
    maxHeight: 210,
  },
  categoryPickerDone: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryPickerDoneText: {
    fontWeight: "700",
    color: "#285F9D",
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
