import { styles } from "@/components/flashcards/flashcards-styles";
import type { Card } from "@/components/flashcards/flashcards-types";
import { useUiLanguage } from "@/context/ui-language-context";
import { Text, TouchableOpacity, View } from "react-native";

type FlashcardsPracticeProps = {
  currentCard: Card;
  cardIndex: number;
  totalCards: number;
  showAnswer: boolean;
  fromLanguageName: string;
  toLanguageName: string;
  onFlip: () => void;
  onAnswer: (knewIt: boolean) => void;
  t: ReturnType<typeof useUiLanguage>["t"];
};

export function FlashcardsPractice({
  currentCard,
  cardIndex,
  totalCards,
  showAnswer,
  fromLanguageName,
  toLanguageName,
  onFlip,
  onAnswer,
  t,
}: FlashcardsPracticeProps) {
  return (
    <View>
      <Text style={styles.counter}>
        {cardIndex + 1} / {totalCards}
      </Text>

      <TouchableOpacity
        style={showAnswer ? styles.cardBack : styles.cardFront}
        onPress={onFlip}
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

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.wrongButton}
          onPress={() => onAnswer(false)}
        >
          <Text style={styles.wrongButtonText}>{t("iDidNotKnow")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.correctButton}
          onPress={() => onAnswer(true)}
        >
          <Text style={styles.correctButtonText}>{t("iKnew")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}