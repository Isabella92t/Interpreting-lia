import {
  getCategoryName as getCategoryNameHelper,
  shuffle,
} from "@/components/flashcards/flashcards-helpers";
import { FlashcardsPractice } from "@/components/flashcards/flashcards-practice";
import { FlashcardsResult } from "@/components/flashcards/flashcards-result";
import { styles } from "@/components/flashcards/flashcards-styles";
import {
  getDeckErrorTexts,
  getPracticeLabels,
} from "@/components/flashcards/flashcards-translations";

import type {
  Card,
  Category,
  Deck,
  Source,
  Step,
} from "@/components/flashcards/flashcards-types";
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { LanguagePicker } from "@/components/language-picker";
import { SearchBar } from "@/components/search-bar";
import { colors } from "@/constants/colors";
import { useUiLanguage } from "@/context/ui-language-context";

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

export default function FlashcardsPage() {
  const router = useRouter();
  const db = useSQLiteContext();
  const mainScrollRef = useRef<ScrollView>(null);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const { t, language } = useUiLanguage();

  // Felmeddelanden följer appens språk, inte tolkspråkparet.

  const deckErrorTexts = getDeckErrorTexts(language);

  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();

  const [step, setStep] = useState<Step>("categories");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryPage, setCategoryPage] = useState(0);
  const [categoryCarouselWidth, setCategoryCarouselWidth] = useState(0);
  const categoryCarouselRef = useRef<ScrollView>(null);

  // Egna listor.
  const [decks, setDecks] = useState<Deck[]>([]);
  const deckOperationInProgress = useRef(false);
  const [deckPage, setDeckPage] = useState(0);
  const deckCarouselRef = useRef<ScrollView>(null);

  // Det man valt att öva på, och hur många ord det innehåller.
  const [source, setSource] = useState<Source>({ kind: "all" });
  const [sourceCount, setSourceCount] = useState(0);
  const justSavedDeckId = useRef<number | null>(null);

  // Redigerar vi en egen lista, eller bara en kategori?
  // editingDeckId = null betyder en ny lista som inte sparats an.
  const [editingDeck, setEditingDeck] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<number | null>(null);
  const [deckName, setDeckName] = useState("");

  // Sokruta i ordlistan, sa man hittar bland manga ord.
  const [search, setSearch] = useState("");

  // Filtrerar ordlistan pa en kategori nar man bygger en egen lista.
  // null betyder att alla ord visas.
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Egen fraga innan man tar bort en lista.
  // Vi anvander inte Alert, for den gor ingenting pa webben.
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRandomPicker, setShowRandomPicker] = useState(false);
  const [randomPickerMode, setRandomPickerMode] = useState<
    "practice" | "selection"
  >("selection");
  const [randomAmount, setRandomAmount] = useState("");

  // Kategorins riktiga namn i databasen. null betyder alla ord.
  const [chosenCategory, setChosenCategory] = useState<string | null>(null);

  // Alla ord i kategorin, och vilka man kryssat i.
  const [categoryWords, setCategoryWords] = useState<Card[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Korten i omgangen man ovar just nu.
  const [cards, setCards] = useState<Card[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Hur manga man kunde, och vilka kort man inte kunde.
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCards, setWrongCards] = useState<Card[]>([]);

  useEffect(() => {
    loadCategories();
    loadDecks();
  }, []);

  // Raknar orden i det man valt, sa att man ser hur stort det ar
  // innan man borjar.
  useEffect(() => {
    // Efter Spara är antalet redan känt. Låt inte en ny asynkron
    // databasfråga ersätta det med 0 innan användaren klickar igen.
    if (source.kind === "deck" && justSavedDeckId.current === source.deck.id) {
      justSavedDeckId.current = null;
      return;
    }
    let active = true;
    countWords(source)
      .then((count) => {
        if (active) setSourceCount(count);
      })
      .catch((error) => console.error("Kunde inte räkna ord:", error));
    return () => {
      active = false;
    };
  }, [source, from, to]);

  async function loadCategories() {
    const result = await db.getAllAsync<Category>(
      `
      SELECT id, name, name_sv, name_en, name_es
      FROM tags
      ORDER BY name ASC
      `,
    );

    setCategories(result);
  }

  async function loadDecks() {
    const result = await db.getAllAsync<Deck>(
      "SELECT id, name FROM decks ORDER BY created_at DESC",
    );

    setDecks(result);
  }

  // Hamtar alla ord i de valda spraken. Anvands nar man bygger
  // en egen lista, for da far man valja ur alla kategorier.
  async function loadAllWords() {
    const fromLanguage = languageNames[String(from ?? "").toLowerCase()];
    const toLanguage = languageNames[String(to ?? "").toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      return [];
    }

    return db.getAllAsync<Card>(
      `
      SELECT DISTINCT
        from_translation.text AS text_from,
        to_translation.text AS text_to,
        from_translation.word_id,
        (SELECT GROUP_CONCAT(tags.name, '|')
           FROM word_tags
           INNER JOIN tags ON word_tags.tag_id = tags.id
           WHERE word_tags.word_id = from_translation.word_id) AS tag_names
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
  }

  // Ny egen lista. Man far valja ur alla ord.
  async function newDeck() {
    const words = await loadAllWords();

    setEditingDeck(true);
    setEditingDeckId(null);
    setDeckName("");
    setChosenCategory(null);
    setCategoryWords(words);
    setSelectedIds([]);
    setSearch("");
    setFilterCategory(null);
    setStep("words");
  }

  // Sparade listor kan övas på samma tre sätt som kategorier.
  async function openDeck(
    deck: Deck,
    mode: "all" | "random" | "pick" | "edit",
    randomCount = 1,
  ) {
    const words = await loadAllWords();
    const rows = await db.getAllAsync<{ word_id: number }>(
      "SELECT word_id FROM deck_words WHERE deck_id = ?",
      deck.id,
    );
    const ids = new Set(rows.map((row) => row.word_id));
    const deckCards = words.filter((word) => ids.has(word.word_id));

    setEditingDeck(mode === "edit");
    setEditingDeckId(mode === "edit" ? deck.id : null);
    setDeckName(deck.name);
    setChosenCategory(null);
    setCategoryWords(mode === "edit" ? words : deckCards);
    const roundCards =
      mode === "random" ? shuffle(deckCards).slice(0, randomCount) : deckCards;
    setSelectedIds(roundCards.map((word) => word.word_id));
    setSearch("");
    setFilterCategory(null);

    if (mode === "all" && deckCards.length > 0) startRound(deckCards);
    else if (mode === "random" && deckCards.length > 0) startRound(roundCards);
    else setStep("words");
  }

  async function saveDeck() {
    if (deckOperationInProgress.current) return;
    deckOperationInProgress.current = true;
    const name = deckName.trim() || t("newList");

    try {
      // Alla ändringar i listan sparas tillsammans, eller inte alls.
      const savedDeck = { id: editingDeckId as number | null };
      await db.withExclusiveTransactionAsync(async (tx) => {
        let id = savedDeck.id;
        if (id === null) {
          const inserted = await tx.runAsync(
            "INSERT INTO decks (name, created_at) VALUES (?, ?)",
            name,
            new Date().toISOString(),
          );
          id = inserted.lastInsertRowId;
        } else {
          await tx.runAsync("UPDATE decks SET name = ? WHERE id = ?", name, id);
        }

        await tx.runAsync("DELETE FROM deck_words WHERE deck_id = ?", id);
        for (const wordId of selectedIds) {
          await tx.runAsync(
            "INSERT OR IGNORE INTO deck_words (deck_id, word_id) VALUES (?, ?)",
            id,
            wordId,
          );
        }
        savedDeck.id = id;
      });

      if (savedDeck.id === null) {
        throw new Error("Kunde inte hämta listans ID.");
      }
      const deckId = savedDeck.id;

      await loadDecks();
      // Visa rätt antal direkt utan att användaren behöver välja listan igen.
      justSavedDeckId.current = deckId;
      setSourceCount(new Set(selectedIds).size);
      setSource({ kind: "deck", deck: { id: deckId, name } });
      setStep("categories");
    } catch (error) {
      console.error("Kunde inte spara ordlistan:", error);
      Alert.alert(deckErrorTexts.title, deckErrorTexts.save);
    } finally {
      deckOperationInProgress.current = false;
    }
  }

  async function confirmDeleteDeck() {
    if (editingDeckId === null || deckOperationInProgress.current) return;
    deckOperationInProgress.current = true;
    try {
      const deckId = editingDeckId;
      await db.withExclusiveTransactionAsync(async (tx) => {
        await tx.runAsync("DELETE FROM deck_words WHERE deck_id = ?", deckId);
        await tx.runAsync("DELETE FROM decks WHERE id = ?", deckId);
      });
      await loadDecks();
      setSource({ kind: "all" });
      setConfirmDelete(false);
      setStep("categories");
    } catch (error) {
      console.error("Kunde inte radera ordlistan:", error);
      Alert.alert(deckErrorTexts.title, deckErrorTexts.delete);
    } finally {
      deckOperationInProgress.current = false;
    }
  }

  // Raknar orden i en kategori, i en egen lista, eller alla ord.
  async function countWords(src: Source) {
    const fromLanguage = languageNames[String(from ?? "").toLowerCase()];
    const toLanguage = languageNames[String(to ?? "").toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      return 0;
    }

    let join = "";
    let filter = "";
    const params: (string | number)[] = [fromLanguage, toLanguage];

    if (src.kind === "category") {
      join = `INNER JOIN word_tags
                ON from_translation.word_id = word_tags.word_id
              INNER JOIN tags
                ON word_tags.tag_id = tags.id`;
      filter = "AND tags.name = ?";
      params.push(src.name);
    }

    if (src.kind === "deck") {
      join = `INNER JOIN deck_words
                ON from_translation.word_id = deck_words.word_id`;
      filter = "AND deck_words.deck_id = ?";
      params.push(src.deck.id);
    }

    const row = await db.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(DISTINCT from_translation.word_id) AS count
      FROM translations AS from_translation
      INNER JOIN translations AS to_translation
        ON from_translation.word_id = to_translation.word_id
      INNER JOIN languages AS from_language
        ON from_translation.language_id = from_language.id
      INNER JOIN languages AS to_language
        ON to_translation.language_id = to_language.id
      ${join}
      WHERE from_language.name = ?
        AND to_language.name = ?
        ${filter}
      `,
      ...params,
    );

    return row?.count ?? 0;
  }

  // En unik nyckel for varje val, sa att vi kan se vilket som ar markerat.
  function sourceKey(src: Source) {
    if (src.kind === "deck") {
      return `deck-${src.deck.id}`;
    }

    if (src.kind === "category") {
      return `category-${src.name}`;
    }

    return "all";
  }

  function sourceLabel(src: Source) {
    if (src.kind === "deck") {
      return src.deck.name;
    }

    if (src.kind === "category") {
      const category = categories.find((item) => item.name === src.name);
      return category ? getCategoryNameHelper(category, language) : src.name;
    }

    return t("allWords");
  }

  // Namnet på den valda kategorin, eller null om man valt alla ord.
  function chosenCategoryName() {
    return source.kind === "category" ? source.name : null;
  }

  // Ett val som en knapp i form av en "chip". Det valda är blått.
  function renderChip(option: Source) {
    const isChosen = sourceKey(option) === sourceKey(source);

    return (
      <TouchableOpacity
        key={sourceKey(option)}
        style={isChosen ? styles.categoryBoxActive : styles.categoryBox}
        onPress={() => setSource(option)}
        activeOpacity={0.8}
      >
        <Text
          style={isChosen ? styles.filterChipTextActive : styles.filterChipText}
        >
          {sourceLabel(option)}
        </Text>
      </TouchableOpacity>
    );
  }

  // Samma regel som pa andra sidan: visa kategorin pa appens sprak.

  // Fran kategorilistan. startNow = true betyder att man tryckte pa
  // kategorin och ovar direkt. startNow = false betyder att man tryckte
  // pa pennan och vill valja ord forst.
  // Vad som ska hända när man öppnar en kategori:
  // "all"    = öva på alla ord direkt
  // "random" = öva på valfritt antal slumpade ord direkt
  // "pick"   = öppna ordlistan och välj ord själv
  async function openCategory(
    categoryName: string | null,
    mode: "all" | "random" | "pick",
    randomCount = 1,
  ) {
    const fromLanguage = languageNames[String(from ?? "").toLowerCase()];
    const toLanguage = languageNames[String(to ?? "").toLowerCase()];

    if (!fromLanguage || !toLanguage) {
      return;
    }

    const categoryJoin = categoryName
      ? `INNER JOIN word_tags
           ON from_translation.word_id = word_tags.word_id
         INNER JOIN tags
           ON word_tags.tag_id = tags.id`
      : "";

    const categoryFilter = categoryName ? "AND tags.name = ?" : "";

    const query = `
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
      ${categoryJoin}
      WHERE from_language.name = ?
        AND to_language.name = ?
        ${categoryFilter}
      ORDER BY LOWER(text_from) ASC
    `;

    const words = categoryName
      ? await db.getAllAsync<Card>(
          query,
          fromLanguage,
          toLanguage,
          categoryName,
        )
      : await db.getAllAsync<Card>(query, fromLanguage, toLanguage);

    setEditingDeck(false);
    setEditingDeckId(null);
    setSearch("");
    setFilterCategory(null);
    setChosenCategory(categoryName);
    setCategoryWords(words);
    // Med "random" blir bara de slumpade orden ikryssade, så att
    // "Öva alla igen" efteråt övar på samma urval.
    const chosen =
      mode === "random" ? shuffle(words).slice(0, randomCount) : words;

    setSelectedIds(chosen.map((word) => word.word_id));

    // Är kategorin tom så visar vi ordlistan, som säger att den är tom.
    if (mode !== "pick" && chosen.length > 0) {
      startRound(chosen);
    } else {
      setStep("words");
    }
  }

  function toggleWord(wordId: number) {
    if (selectedIds.includes(wordId)) {
      setSelectedIds(selectedIds.filter((id) => id !== wordId));
    } else {
      setSelectedIds([...selectedIds, wordId]);
    }
  }

  function selectRandom() {
    const amount = Number(randomAmount);
    const maxAmount =
      randomPickerMode === "practice" ? sourceCount : visibleWords.length;
    if (!Number.isInteger(amount) || amount < 1 || amount > maxAmount) {
      return;
    }
    setShowRandomPicker(false);
    if (randomPickerMode === "practice") {
      if (source.kind === "deck") openDeck(source.deck, "random", amount);
      else openCategory(chosenCategoryName(), "random", amount);
      return;
    }
    const shuffled = shuffle(visibleWords);
    setSelectedIds(shuffled.slice(0, amount).map((word) => word.word_id));
  }

  // STEG 2 -> 3: starta en omgang med de kort man skickar in.
  function startRound(newCards: Card[]) {
    setCards(shuffle(newCards));
    setCardIndex(0);
    setShowAnswer(false);
    setCorrectCount(0);
    setWrongCards([]);
    setStep("practice");
  }

  function startFromSelection() {
    startRound(
      categoryWords.filter((word) => selectedIds.includes(word.word_id)),
    );
  }

  // Man trycker pa "Jag kunde" eller "Jag kunde inte".
  // Sedan gar vi till nasta kort, eller visar resultatet.
  function answerCard(knewIt: boolean) {
    if (knewIt) {
      setCorrectCount((count) => count + 1);
    } else {
      setWrongCards((wrong) => [...wrong, cards[cardIndex]]);
    }

    if (cardIndex === cards.length - 1) {
      setStep("result");
      return;
    }

    setShowAnswer(false);
    setCardIndex((index) => index + 1);
  }

  // Tillbaka-pilen gar alltid till kategorilistan.
  // Ar man redan dar sa lamnar man sidan.
  function goBack() {
    if (step === "categories") {
      router.dismissTo({ pathname: "/secondPage", params: { from, to } });
      return;
    }

    setStep("categories");
  }

  const currentCard = cards[cardIndex];

  const categoryLabel = chosenCategory ?? t("allWords");

  // Soktexten filtrerar ordlistan. Tom sokruta visar alla ord.
  const searchText = search.trim().toLowerCase();

  const visibleWords = categoryWords.filter((word) => {
    // Kategorifiltret. Ett ord kan ligga i flera kategorier.
    const wordCategories = (word.tag_names ?? "").split("|");

    const matchesCategory =
      filterCategory === null || wordCategories.includes(filterCategory);

    const matchesSearch =
      searchText === "" ||
      word.text_from.toLowerCase().includes(searchText) ||
      word.text_to.toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });

  // Tre kategorier per sida, precis som på föregående sida.
  const categoryPages: Category[][] = [];
  for (let i = 0; i < categories.length; i += 3) {
    categoryPages.push(categories.slice(i, i + 3));
  }
  const deckPages: Deck[][] = [];
  for (let i = 0; i < decks.length; i += 3) {
    deckPages.push(decks.slice(i, i + 3));
  }

  const categoryGap = 8;
  const categoryBoxWidth =
    categoryCarouselWidth > 0
      ? (categoryCarouselWidth - categoryGap * 2) / 3
      : 0;

  function goToCategoryPage(nextPage: number) {
    if (nextPage < 0 || nextPage >= categoryPages.length) return;
    setCategoryPage(nextPage);
    categoryCarouselRef.current?.scrollTo({
      x: nextPage * categoryCarouselWidth,
      animated: true,
    });
  }

  function goToDeckPage(nextPage: number) {
    if (nextPage < 0 || nextPage >= deckPages.length) return;
    setDeckPage(nextPage);
    deckCarouselRef.current?.scrollTo({
      x: nextPage * categoryCarouselWidth,
      animated: true,
    });
  }

  // Tydliga, konsekventa val för kategorier och egna listor.
  const practiceLabels = getPracticeLabels(language);

  const fromLanguageName = languageNames[String(from ?? "").toLowerCase()];
  const toLanguageName = languageNames[String(to ?? "").toLowerCase()];

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        persistentScrollbar
        onContentSizeChange={(_, height) => setScrollHeight(height)}
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
      >
        {/* Samma topprad som pa de andra sidorna */}
        <View style={styles.topRow}>
          <BackButton onPress={goBack} />

          <LanguagePicker />
        </View>

        <Text style={styles.sectionTitle}>{t("flashcards")}</Text>

        {/* STEG 1: välj vad man vill öva på */}
        {step === "categories" && (
          <View>
            {/* Alla val syns direkt, som knappar man kan trycka på. */}
            <Text style={styles.label}>{t("categories")}</Text>

            <View style={styles.categoryCarouselRow}>
              <TouchableOpacity
                style={styles.categoryArrowButton}
                onPress={() => goToCategoryPage(categoryPage - 1)}
                disabled={categoryPage === 0}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    categoryPage > 0
                      ? styles.categoryArrowText
                      : styles.categoryArrowDisabled
                  }
                >
                  ‹
                </Text>
              </TouchableOpacity>

              <View
                style={styles.categoryCarousel}
                onLayout={(event) =>
                  setCategoryCarouselWidth(event.nativeEvent.layout.width)
                }
              >
                <ScrollView
                  ref={categoryCarouselRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScroll={(event) => {
                    if (categoryCarouselWidth > 0) {
                      setCategoryPage(
                        Math.round(
                          event.nativeEvent.contentOffset.x /
                            categoryCarouselWidth,
                        ),
                      );
                    }
                  }}
                >
                  {categoryCarouselWidth > 0 &&
                    categoryPages.map((items, index) => (
                      <View
                        key={index}
                        style={[
                          styles.categoryCarouselPage,
                          { width: categoryCarouselWidth },
                        ]}
                      >
                        {items.map((category) => (
                          <View
                            key={category.id}
                            style={{ width: categoryBoxWidth }}
                          >
                            {renderChip({
                              kind: "category",
                              name: category.name,
                            })}
                          </View>
                        ))}
                      </View>
                    ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={styles.categoryArrowButton}
                onPress={() => goToCategoryPage(categoryPage + 1)}
                disabled={categoryPage >= categoryPages.length - 1}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    categoryPage < categoryPages.length - 1
                      ? styles.categoryArrowText
                      : styles.categoryArrowDisabled
                  }
                >
                  ›
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsRow}>
              <View style={{ width: categoryBoxWidth || 100 }}>
                {renderChip({ kind: "all" })}
              </View>
              <TouchableOpacity
                style={[styles.newListChip, { width: categoryBoxWidth || 100 }]}
                onPress={newDeck}
                activeOpacity={0.8}
              >
                <FontAwesome name="plus" size={12} color={colors.primary} />
                <Text style={styles.newListChipText}>
                  {String(language).toLowerCase() === "es"
                    ? "Crear\nlista"
                    : String(language).toLowerCase() === "en"
                      ? "Create\nlist"
                      : "Skapa\nlista"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{t("myLists")}</Text>

            <View style={styles.categoryCarouselRow}>
              <TouchableOpacity
                style={styles.categoryArrowButton}
                onPress={() => goToDeckPage(deckPage - 1)}
                disabled={deckPage === 0}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    deckPage > 0
                      ? styles.categoryArrowText
                      : styles.categoryArrowDisabled
                  }
                >
                  ‹
                </Text>
              </TouchableOpacity>

              <View style={styles.categoryCarousel}>
                <ScrollView
                  ref={deckCarouselRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScroll={(event) => {
                    if (categoryCarouselWidth > 0) {
                      setDeckPage(
                        Math.round(
                          event.nativeEvent.contentOffset.x /
                            categoryCarouselWidth,
                        ),
                      );
                    }
                  }}
                >
                  {categoryCarouselWidth > 0 &&
                    deckPages.map((items, index) => (
                      <View
                        key={index}
                        style={[
                          styles.categoryCarouselPage,
                          { width: categoryCarouselWidth },
                        ]}
                      >
                        {items.map((deck) => (
                          <View
                            key={deck.id}
                            style={{ width: categoryBoxWidth }}
                          >
                            {renderChip({ kind: "deck", deck })}
                          </View>
                        ))}
                      </View>
                    ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={styles.categoryArrowButton}
                onPress={() => goToDeckPage(deckPage + 1)}
                disabled={deckPage >= deckPages.length - 1}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    deckPage < deckPages.length - 1
                      ? styles.categoryArrowText
                      : styles.categoryArrowDisabled
                  }
                >
                  ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* Kortet visar vad man valt, och vad man kan göra med det.
                Knapparna säger exakt vad de gör. */}
            <View style={styles.choiceCard}>
              <Text style={styles.choiceTitle}>{sourceLabel(source)}</Text>

              <Text style={styles.sourceCount}>
                {sourceCount} {t("words")}
              </Text>

              <TouchableOpacity
                style={[
                  styles.fullPrimaryButton,
                  sourceCount === 0 && styles.buttonDisabled,
                ]}
                disabled={sourceCount === 0}
                onPress={() =>
                  source.kind === "deck"
                    ? openDeck(source.deck, "all")
                    : openCategory(chosenCategoryName(), "all")
                }
              >
                <Text style={styles.primaryButtonText}>
                  {practiceLabels.all} ({sourceCount})
                </Text>
                <Text style={styles.primaryActionHelp}>
                  {practiceLabels.allHelp}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.fullSecondaryButton,
                  sourceCount === 0 && styles.actionDisabled,
                ]}
                disabled={sourceCount === 0}
                onPress={() => {
                  setRandomPickerMode("practice");
                  setRandomAmount("");
                  setShowRandomPicker(true);
                }}
              >
                <Text style={styles.secondaryButtonText}>
                  {practiceLabels.random}
                </Text>
                <Text style={styles.actionHelp}>
                  {practiceLabels.randomHelp}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.editSourceButton,
                  sourceCount === 0 && styles.actionDisabled,
                ]}
                disabled={sourceCount === 0}
                onPress={() =>
                  source.kind === "deck"
                    ? openDeck(source.deck, "pick")
                    : openCategory(chosenCategoryName(), "pick")
                }
              >
                <View style={styles.actionTextGroup}>
                  <Text style={styles.secondaryButtonText}>
                    {practiceLabels.pick}
                  </Text>
                  <Text style={styles.actionHelp}>
                    {practiceLabels.pickHelp}
                  </Text>
                </View>
              </TouchableOpacity>

              {source.kind === "deck" && (
                <View style={styles.editListSection}>
                  <TouchableOpacity
                    style={styles.editListLink}
                    onPress={() => openDeck(source.deck, "edit")}
                    accessibilityRole="button"
                  >
                    <FontAwesome name="pencil" size={13} color="#64748B" />
                    <Text style={styles.editListLinkText}>
                      {practiceLabels.edit}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.editListHelp}>
                    {practiceLabels.editHelp}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* STEG 2: valj vilka ord man vill ova pa */}
        {step === "words" && (
          <View>
            {/* Namnet visas bara nar man bygger en egen lista. */}
            {editingDeck && (
              <TextInput
                style={styles.nameInput}
                placeholder={t("listName")}
                value={deckName}
                onChangeText={setDeckName}
              />
            )}

            <Text style={styles.helpText}>
              {editingDeck ? t("myLists") : categoryLabel} · {t("chooseWords")}{" "}
              ({selectedIds.length} / {categoryWords.length})
            </Text>

            {/* Filtrera pa kategori, sa listan blir kortare. */}
            {editingDeck && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                <TouchableOpacity
                  style={
                    filterCategory === null
                      ? styles.filterChipActive
                      : styles.filterChip
                  }
                  onPress={() => setFilterCategory(null)}
                >
                  <Text
                    style={
                      filterCategory === null
                        ? styles.filterChipTextActive
                        : styles.filterChipText
                    }
                  >
                    {t("selectAll")}
                  </Text>
                </TouchableOpacity>

                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={
                      filterCategory === category.name
                        ? styles.filterChipActive
                        : styles.filterChip
                    }
                    onPress={() => setFilterCategory(category.name)}
                  >
                    <Text
                      style={
                        filterCategory === category.name
                          ? styles.filterChipTextActive
                          : styles.filterChipText
                      }
                    >
                      {getCategoryNameHelper(category, language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <SearchBar
              value={search}
              onChangeText={setSearch}
              style={styles.search}
            />

            {/* Snabbval för att välja ord. */}
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={styles.chip}
                onPress={() =>
                  setSelectedIds([
                    ...selectedIds,
                    ...visibleWords
                      .map((word) => word.word_id)
                      .filter((id) => !selectedIds.includes(id)),
                  ])
                }
              >
                <Text style={styles.chipText}>{t("selectAll")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chip}
                onPress={() => setSelectedIds([])}
              >
                <Text style={styles.chipText}>{t("selectNone")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chip}
                onPress={() => {
                  setRandomPickerMode("selection");
                  setRandomAmount("");
                  setShowRandomPicker(true);
                }}
              >
                <Text style={styles.chipText}>
                  {String(language).toLowerCase() === "es"
                    ? "Aleatorio"
                    : String(language).toLowerCase() === "en"
                      ? "Random"
                      : "Slumpa"}
                </Text>
              </TouchableOpacity>
            </View>

            {categoryWords.length === 0 && (
              <Text style={styles.helpText}>{t("noWordsHere")}</Text>
            )}

            {visibleWords.map((word) => {
              const isSelected = selectedIds.includes(word.word_id);

              return (
                <TouchableOpacity
                  key={word.word_id}
                  style={isSelected ? styles.wordRowSelected : styles.wordRow}
                  onPress={() => toggleWord(word.word_id)}
                  activeOpacity={0.8}
                >
                  <FontAwesome
                    name={isSelected ? "check-square" : "square-o"}
                    size={18}
                    color={isSelected ? "#2563EB" : "#CBD5E1"}
                  />

                  <View style={styles.wordText}>
                    <Text style={styles.wordFrom}>{word.text_from}</Text>
                    <Text style={styles.wordTo}>{word.text_to}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {!editingDeck && selectedIds.length > 0 && (
              <TouchableOpacity
                style={styles.fullPrimaryButton}
                onPress={startFromSelection}
              >
                <Text style={styles.primaryButtonText}>
                  {t("practise")} ({selectedIds.length})
                </Text>
              </TouchableOpacity>
            )}

            {/* Spara-knappen ligger fast längst ner på skärmen. */}
          </View>
        )}
        {/* STEG 3: ova */}
        {step === "practice" && currentCard && (
          <FlashcardsPractice
            currentCard={currentCard}
            cardIndex={cardIndex}
            totalCards={cards.length}
            showAnswer={showAnswer}
            fromLanguageName={fromLanguageName}
            toLanguageName={toLanguageName}
            onFlip={() => setShowAnswer(!showAnswer)}
            onAnswer={answerCard}
            t={t}
          />
        )}

        {/* STEG 4: resultatet */}

        {step === "result" && (
          <FlashcardsResult
            correctCount={correctCount}
            wrongCards={wrongCards}
            onPractiseWrong={() => startRound(wrongCards)}
            onPractiseAll={startFromSelection}
            t={t}
          />
        )}
      </ScrollView>

      {/* Snabbnavigering och Spara är alltid åtkomliga i ordlistan. */}
      {step === "words" && (
        <View style={styles.stickyActions}>
          <View style={styles.scrollNavigation}>
            <TouchableOpacity
              style={styles.scrollNavigationButton}
              accessibilityRole="button"
              accessibilityLabel={
                String(language).toLowerCase() === "es"
                  ? "Ir arriba"
                  : String(language).toLowerCase() === "en"
                    ? "Scroll to top"
                    : "Scrolla högst upp"
              }
              onPress={() =>
                mainScrollRef.current?.scrollTo({ y: 0, animated: true })
              }
            >
              <FontAwesome name="arrow-up" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scrollNavigationButton}
              accessibilityRole="button"
              accessibilityLabel={
                String(language).toLowerCase() === "es"
                  ? "Ir abajo del todo"
                  : String(language).toLowerCase() === "en"
                    ? "Scroll to bottom"
                    : "Scrolla längst ner"
              }
              onPress={() =>
                mainScrollRef.current?.scrollTo({
                  y: Math.max(0, scrollHeight - viewportHeight),
                  animated: true,
                })
              }
            >
              <FontAwesome name="arrow-down" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {editingDeck && (
            <View style={styles.stickyEditButtons}>
              {editingDeckId !== null && (
                <TouchableOpacity
                  style={styles.stickyDeleteButton}
                  onPress={() => setConfirmDelete(true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.deleteButtonText}>{t("delete")}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.stickySaveButton, styles.stickyEditButtonFlex]}
                onPress={saveDeck}
              >
                <Text style={styles.primaryButtonText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Välj själv hur många ord som ska slumpas. */}
      <Modal
        visible={showRandomPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRandomPicker(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {String(language).toLowerCase() === "es"
                ? "Elegir cantidad"
                : String(language).toLowerCase() === "en"
                  ? "Choose number of words"
                  : "Hur många ord vill du slumpa?"}
            </Text>
            <Text style={styles.modalMessage}>
              {String(language).toLowerCase() === "es"
                ? `Puedes elegir entre 1 y ${randomPickerMode === "practice" ? sourceCount : visibleWords.length} palabras.`
                : String(language).toLowerCase() === "en"
                  ? `Choose between 1 and ${randomPickerMode === "practice" ? sourceCount : visibleWords.length} words.`
                  : `Välj mellan 1 och ${randomPickerMode === "practice" ? sourceCount : visibleWords.length} ord.`}
            </Text>
            <TextInput
              style={styles.randomAmountInput}
              value={randomAmount}
              onChangeText={(value) =>
                setRandomAmount(value.replace(/[^0-9]/g, ""))
              }
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
              accessibilityLabel={
                String(language).toLowerCase() === "es"
                  ? "Número de palabras"
                  : String(language).toLowerCase() === "en"
                    ? "Number of words"
                    : "Antal ord"
              }
            />
            <TouchableOpacity
              style={[
                styles.fullPrimaryButton,
                (!Number.isInteger(Number(randomAmount)) ||
                  Number(randomAmount) < 1 ||
                  Number(randomAmount) >
                    (randomPickerMode === "practice"
                      ? sourceCount
                      : visibleWords.length)) &&
                  styles.buttonDisabled,
              ]}
              disabled={
                !Number.isInteger(Number(randomAmount)) ||
                Number(randomAmount) < 1 ||
                Number(randomAmount) >
                  (randomPickerMode === "practice"
                    ? sourceCount
                    : visibleWords.length)
              }
              onPress={selectRandom}
            >
              <Text style={styles.primaryButtonText}>
                {String(language).toLowerCase() === "es"
                  ? "Aleatorio"
                  : String(language).toLowerCase() === "en"
                    ? "Random"
                    : "Slumpa"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fullSecondaryButton}
              onPress={() => setShowRandomPicker(false)}
            >
              <Text style={styles.secondaryButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Fraga innan vi tar bort listan. */}
      <Modal
        visible={confirmDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("deleteListTitle")}</Text>

            <Text style={styles.modalMessage}>
              {String(language).toLowerCase() === "es"
                ? "¿Seguro que quieres eliminar esta lista?"
                : String(language).toLowerCase() === "en"
                  ? "Are you sure you want to delete this list?"
                  : "Vill du verkligen radera den här ordlistan?"}
            </Text>

            <TouchableOpacity
              style={styles.fullSecondaryButton}
              onPress={() => setConfirmDelete(false)}
            >
              <Text style={styles.secondaryButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={confirmDeleteDeck}
            >
              <Text style={styles.deleteButtonText}>{t("delete")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
