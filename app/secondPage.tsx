import { BackButton } from "@/components/back-button";
import { AppTextInput } from "@/components/app-text-input";
import { LanguagePicker } from "@/components/language-picker";
import { SearchBar } from "@/components/search-bar";
import { AddWordModal } from "@/components/second-page/add-word-modal";
import { InterpreterLogo } from "@/components/second-page/interpreter-logo";
import { styles } from "@/components/second-page/second-page-styles";
import { getFilledLanguages } from "@/constants/languages";
import { useUiLanguage } from "@/context/ui-language-context";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  type Category,
  type Translation,
  CATEGORIES_PER_PAGE,
  CATEGORY_EXPANDED_KEY,
  CATEGORY_GAP,
  languageNames,
  MAX_RESULTS,
  MIN_SEARCH_LENGTH,
  pageTexts,
  RECENT_CATEGORIES_KEY,
  sortByRecentlyUsed,
  splitIntoPages,
  startsWithSearch,
} from "@/components/second-page/second-page-helpers";

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
  const [, setShowCategoryPicker] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Texten för varje språk i "Lägg till ord", till exempel
  // { sv: "domstol", es: "tribunal" }.
  const [wordTexts, setWordTexts] = useState<Record<string, string>>({});

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

  const loadCategories = useCallback(async () => {
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
  }, [db]);

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

  const loadAllTranslations = useCallback(async () => {
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
  }, [db, from, to]);

  // Uppdatera kategorier och sökresultat när användaren återvänder hit.
  useFocusEffect(
    useCallback(() => {
      void loadCategories();
      void loadAllTranslations();
    }, [loadCategories, loadAllTranslations]),
  );

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

    setWordTexts({});
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

      // Kategorierna visas för alla språkpar, så namnet får inte
      // finnas i någon kategori alls, på något av språken.
      const existingCategory = await db.getFirstAsync<{ id: number }>(
        `
          SELECT id
          FROM tags
          WHERE LOWER(name) = LOWER(?)
            OR (? <> '' AND LOWER(name_sv) = LOWER(?))
            OR (? <> '' AND LOWER(name_en) = LOWER(?))
            OR (? <> '' AND LOWER(name_es) = LOWER(?))
          `,
        internalName,
        categorySv,
        categorySv,
        categoryEn,
        categoryEn,
        categoryEs,
        categoryEs,
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

    const fromCode = String(from ?? "").toLowerCase();
    const toCode = String(to ?? "").toLowerCase();
    if (
      !languageNames[fromCode] ||
      !languageNames[toCode] ||
      fromCode === toCode
    ) {
      setWordError(t("languagesNotFound"));
      return;
    }

    // Man fyller i minst två språk, vilka som helst. Tomma fält sparas inte.
    const entries = getFilledLanguages(wordTexts, fromCode, toCode);
    if (entries.length < 2) {
      setWordError(t("fillTwoLanguages"));
      return;
    }

    setSavingWord(true);
    setWordError("");

    try {
      // Ordets namn är texten i det första ifyllda fältet.
      const wordName = entries[0].text;

      // Namnet måste vara unikt. Finns det redan, sparas ingenting,
      // annars skulle de nya översättningarna försvinna utan fel.
      const existingWord = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM words WHERE LOWER(name) = LOWER(?)",
        wordName,
      );
      if (existingWord) {
        setWordError(t("wordExists"));
        return;
      }

      // Alla databasändringar för ett ord sparas tillsammans.
      // Om något steg misslyckas ångras hela sparningen automatiskt.
      await db.withExclusiveTransactionAsync(async (transaction) => {
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

      setWordTexts({});
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
        automaticallyAdjustKeyboardInsets
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
          {/* ScrollView gör att man kan skrolla förbi tangentbordet
              ner till knapparna. */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <View style={styles.categoryModal}>
              <Text style={styles.modalTitle}>{t("addCategory")}</Text>

              {orderedLanguageCodes.map((code, index) => (
                <Fragment key={code}>
                  <Text style={styles.languageLabel}>{languageNames[code]}</Text>
                  <AppTextInput
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
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL: LÄGG TILL ORD */}
      <AddWordModal
        visible={showAddWord}
        from={String(from ?? "")}
        to={String(to ?? "")}
        wordTexts={wordTexts}
        information={wordInformation}
        categories={categories
          .filter((item) => item.name !== "Övrigt")
          .map((item) => ({
            key: item.name,
            name: getCategoryName(item),
          }))}
        selectedCategories={selectedCategories}
        error={wordError}
        saving={savingWord}
        onWordTextChange={(code, value) => {
          setWordTexts((current) => ({ ...current, [code]: value }));
          setWordError("");
        }}
        onInformationChange={(value) => {
          setWordInformation(value);
          setWordError("");
        }}
        onToggleCategory={toggleCategory}
        onSave={addWord}
        onClose={closeAddWord}
      />
    </SafeAreaView>
  );
}
