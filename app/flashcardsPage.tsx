import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { LanguagePicker } from "@/components/language-picker";
import { useUiLanguage } from "@/context/ui-language-context";

const languageNames: Record<string, string> = {
  sv: "Svenska",
  en: "English",
  es: "Español",
};

// Hur manga kort "Slumpa 20" valjer.
const RANDOM_COUNT = 20;

type Category = {
  id: number;
  name: string;
  name_sv: string | null;
  name_en: string | null;
  name_es: string | null;
};

type Card = {
  word_id: number;
  text_from: string;
  text_to: string;
  // Kategorierna ordet ligger i, t.ex. "Juridik|Migration".
  // Ett ord kan ligga i flera. Tomt om det saknar kategori.
  tag_names?: string | null;
};

// En egen ordlista som man skapat sjalv.
type Deck = {
  id: number;
  name: string;
};

// Sidan har fyra steg. Ett steg i taget visas.
type Step = "categories" | "words" | "practice" | "result";

export default function FlashcardsPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { t, language } = useUiLanguage();

  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();

  const [step, setStep] = useState<Step>("categories");

  const [categories, setCategories] = useState<Category[]>([]);

  // Egna listor.
  const [decks, setDecks] = useState<Deck[]>([]);

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

  // Oppna en sparad lista. startNow = true ovar direkt.
  async function openDeck(deck: Deck, startNow: boolean) {
    const words = await loadAllWords();

    const rows = await db.getAllAsync<{ word_id: number }>(
      "SELECT word_id FROM deck_words WHERE deck_id = ?",
      deck.id,
    );

    const ids = rows.map((row) => row.word_id);
    const deckCards = words.filter((word) => ids.includes(word.word_id));

    setEditingDeck(true);
    setEditingDeckId(deck.id);
    setDeckName(deck.name);
    setChosenCategory(null);
    setCategoryWords(words);
    setSelectedIds(ids);
    setSearch("");
    setFilterCategory(null);

    if (startNow && deckCards.length > 0) {
      startRound(deckCards);
    } else {
      setStep("words");
    }
  }

  async function saveDeck() {
    const name = deckName.trim() || t("newList");

    let deckId = editingDeckId;

    if (deckId === null) {
      await db.runAsync(
        "INSERT INTO decks (name, created_at) VALUES (?, ?)",
        name,
        new Date().toISOString(),
      );

      const row = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM decks ORDER BY id DESC LIMIT 1",
      );

      if (!row) {
        return;
      }

      deckId = row.id;
    } else {
      await db.runAsync("UPDATE decks SET name = ? WHERE id = ?", name, deckId);
    }

    // Enklast: ta bort alla rader och lagg in de valda igen.
    await db.runAsync("DELETE FROM deck_words WHERE deck_id = ?", deckId);

    for (const wordId of selectedIds) {
      await db.runAsync(
        "INSERT OR IGNORE INTO deck_words (deck_id, word_id) VALUES (?, ?)",
        deckId,
        wordId,
      );
    }

    await loadDecks();
    setStep("categories");
  }

  async function confirmDeleteDeck() {
    if (editingDeckId === null) {
      return;
    }

    await db.runAsync(
      "DELETE FROM deck_words WHERE deck_id = ?",
      editingDeckId,
    );

    await db.runAsync("DELETE FROM decks WHERE id = ?", editingDeckId);

    await loadDecks();
    setConfirmDelete(false);
    setStep("categories");
  }

  // Samma regel som pa andra sidan: visa kategorin pa appens sprak.
  function getCategoryName(category: Category) {
    const currentLanguage = String(language).toLowerCase();

    const svenska = category.name_sv?.trim() || "";
    const engelska = category.name_en?.trim() || "";
    const spanska = category.name_es?.trim() || "";

    if (currentLanguage === "en") {
      return engelska || svenska || spanska || category.name;
    }

    if (currentLanguage === "es") {
      return spanska || svenska || engelska || category.name;
    }

    return svenska || engelska || spanska || category.name;
  }

  // Fran kategorilistan. startNow = true betyder att man tryckte pa
  // kategorin och ovar direkt. startNow = false betyder att man tryckte
  // pa pennan och vill valja ord forst.
  async function openCategory(categoryName: string | null, startNow: boolean) {
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
    setSelectedIds(words.map((word) => word.word_id));

    // Vi skickar med orden direkt. State hinner inte uppdateras
    // innan omgangen startar.
    // Ar kategorin tom sa visar vi ordlistan, som sager att den ar tom.
    if (startNow && words.length > 0) {
      startRound(words);
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
    const shuffled = shuffle(visibleWords);

    setSelectedIds(shuffled.slice(0, RANDOM_COUNT).map((word) => word.word_id));
  }

  // Blandar korten sa att ordningen inte blir likadan varje gang.
  function shuffle(items: Card[]) {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
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

  const fromLanguageName = languageNames[String(from ?? "").toLowerCase()];
  const toLanguageName = languageNames[String(to ?? "").toLowerCase()];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Samma topprad som pa de andra sidorna */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <LanguagePicker />
        </View>

        <Text style={styles.sectionTitle}>{t("flashcards")}</Text>

        {/* STEG 1: valj kategori eller en egen lista */}
        {step === "categories" && (
          <View>
            <Text style={styles.listHeading}>{t("myLists")}</Text>

            {decks.length === 0 && (
              <Text style={styles.helpText}>{t("noLists")}</Text>
            )}

            {decks.map((deck) => (
              <TouchableOpacity
                key={deck.id}
                style={styles.featureCard}
                onPress={() => openDeck(deck, true)}
                activeOpacity={0.8}
              >
                <View style={styles.featureIcon}>
                  <FontAwesome name="list-ul" size={20} color="#2563EB" />
                </View>

                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{deck.name}</Text>
                </View>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openDeck(deck, false)}
                >
                  <FontAwesome name="pencil" size={15} color="#64748B" />
                </TouchableOpacity>

                <Text style={styles.featureArrow}>›</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.newListButton} onPress={newDeck}>
              <FontAwesome name="plus" size={14} color="#2563EB" />
              <Text style={styles.newListButtonText}>{t("newList")}</Text>
            </TouchableOpacity>

            <Text style={styles.listHeading}>{t("chooseCategory")}</Text>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => openCategory(null, true)}
              activeOpacity={0.8}
            >
              <View style={styles.featureIcon}>
                <FontAwesome name="th-large" size={20} color="#2563EB" />
              </View>

              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{t("allWords")}</Text>
              </View>

              {/* Pennan oppnar ordlistan istallet for att starta. */}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openCategory(null, false)}
              >
                <FontAwesome name="pencil" size={15} color="#64748B" />
              </TouchableOpacity>

              <Text style={styles.featureArrow}>›</Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.featureCard}
                onPress={() => openCategory(category.name, true)}
                activeOpacity={0.8}
              >
                <View style={styles.featureIcon}>
                  <FontAwesome name="clone" size={20} color="#2563EB" />
                </View>

                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>
                    {getCategoryName(category)}
                  </Text>
                </View>

                {/* Pennan oppnar ordlistan istallet for att starta. */}
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openCategory(category.name, false)}
                >
                  <FontAwesome name="pencil" size={15} color="#64748B" />
                </TouchableOpacity>

                <Text style={styles.featureArrow}>›</Text>
              </TouchableOpacity>
            ))}
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
              {editingDeck ? t("myLists") : categoryLabel} · {t("chooseWords")} (
              {selectedIds.length} / {categoryWords.length})
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
                      {getCategoryName(category)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TextInput
              style={styles.searchInput}
              placeholder={t("searchPlaceholder")}
              value={search}
              onChangeText={setSearch}
            />

            {/* Snabbval. "Slumpa 20" gor stora kategorier hanterbara. */}
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

              <TouchableOpacity style={styles.chip} onPress={selectRandom}>
                <Text style={styles.chipText}>{t("randomTwenty")}</Text>
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

            {selectedIds.length > 0 && (
              <TouchableOpacity
                style={styles.fullPrimaryButton}
                onPress={startFromSelection}
              >
                <Text style={styles.primaryButtonText}>
                  {t("practise")} ({selectedIds.length})
                </Text>
              </TouchableOpacity>
            )}

            {/* Spara och ta bort hor bara till egna listor. */}
            {editingDeck && (
              <TouchableOpacity
                style={styles.fullSecondaryButton}
                onPress={saveDeck}
              >
                <Text style={styles.secondaryButtonText}>{t("save")}</Text>
              </TouchableOpacity>
            )}

            {editingDeck && editingDeckId !== null && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => setConfirmDelete(true)}
              >
                <Text style={styles.deleteButtonText}>{t("delete")}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* STEG 3: ova */}
        {step === "practice" && currentCard && (
          <View>
            <Text style={styles.counter}>
              {cardIndex + 1} / {cards.length}
            </Text>

            {/* Vit framsida, bla baksida, sa man ser vilken sida man ar pa. */}
            <TouchableOpacity
              style={showAnswer ? styles.cardBack : styles.cardFront}
              onPress={() => setShowAnswer(!showAnswer)}
              activeOpacity={0.9}
            >
              <Text style={styles.cardLanguage}>
                {showAnswer ? toLanguageName : fromLanguageName}
              </Text>

              <Text style={styles.cardWord}>
                {showAnswer ? currentCard.text_to : currentCard.text_from}
              </Text>

              {!showAnswer && (
                <Text style={styles.cardHint}>{t("tapToFlip")}</Text>
              )}
            </TouchableOpacity>

            {/* Knapparna syns hela tiden, aven innan man vant kortet. */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.wrongButton}
                onPress={() => answerCard(false)}
              >
                <Text style={styles.wrongButtonText}>{t("iDidNotKnow")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.correctButton}
                onPress={() => answerCard(true)}
              >
                <Text style={styles.correctButtonText}>{t("iKnew")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEG 4: resultatet */}
        {step === "result" && (
          <View>
            <View style={styles.cardFront}>
              <Text style={styles.resultTitle}>{t("finished")}</Text>

              <View style={styles.resultRow}>
                <View style={styles.resultBox}>
                  <Text style={styles.resultNumberCorrect}>{correctCount}</Text>
                  <Text style={styles.resultLabel}>{t("correct")}</Text>
                </View>

                <View style={styles.resultBox}>
                  <Text style={styles.resultNumberWrong}>
                    {wrongCards.length}
                  </Text>
                  <Text style={styles.resultLabel}>{t("wrong")}</Text>
                </View>
              </View>
            </View>

            {/* Bara om man hade nagot fel */}
            {wrongCards.length > 0 && (
              <TouchableOpacity
                style={styles.fullPrimaryButton}
                onPress={() => startRound(wrongCards)}
              >
                <Text style={styles.primaryButtonText}>
                  {t("practiseWrong")} ({wrongCards.length})
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.fullSecondaryButton}
              onPress={startFromSelection}
            >
              <Text style={styles.secondaryButtonText}>{t("practiseAll")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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

            <Text style={styles.modalMessage}>{t("deleteNoteMessage")}</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 38,
    paddingBottom: 50,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  backButtonText: {
    fontSize: 21,
    fontWeight: "400",
    color: "#334155",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },

  helpText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 14,
  },

  /* Kategorilistan, samma kort som pa andra sidan */

  featureCard: {
    minHeight: 76,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    fontWeight: "600",
    color: "#0F172A",
  },

  // Pennknappen inuti kategorikortet.
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  featureArrow: {
    fontSize: 26,
    fontWeight: "300",
    color: "#94A3B8",
    marginLeft: 8,
  },

  listHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 18,
    marginBottom: 10,
  },

  newListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  newListButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },

  /* Kategorifiltret */

  filterRow: {
    gap: 8,
    paddingBottom: 12,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  filterChipActive: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "#2563EB",
  },

  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },

  filterChipTextActive: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  /* Ordlistan */

  nameInput: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 15,
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },

  searchInput: {
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 12,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 22,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  modalMessage: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
    marginBottom: 6,
  },

  deleteButton: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  deleteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
  },

  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },

  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
  },

  wordRowSelected: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
  },

  wordText: {
    flex: 1,
    marginLeft: 12,
  },

  wordFrom: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  wordTo: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  /* Ova-vyn */

  counter: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 14,
  },

  cardFront: {
    minHeight: 230,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
  },

  // Baksidan ar bla, sa man ser direkt att det ar svaret.
  cardBack: {
    minHeight: 230,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
  },

  cardLanguage: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 12,
    textTransform: "uppercase",
  },

  cardWord: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },

  cardHint: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 16,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  /* Svarsknapparna */

  wrongButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
  },

  wrongButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
  },

  correctButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
  },

  correctButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#16A34A",
  },

  /* Resultatet */

  resultTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 22,
  },

  resultRow: {
    flexDirection: "row",
    gap: 40,
  },

  resultBox: {
    alignItems: "center",
  },

  resultNumberCorrect: {
    fontSize: 34,
    fontWeight: "700",
    color: "#16A34A",
  },

  resultNumberWrong: {
    fontSize: 34,
    fontWeight: "700",
    color: "#DC2626",
  },

  resultLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  fullPrimaryButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  fullSecondaryButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
});
