import { styles } from "@/components/flashcards/flashcards-styles";
import type { Card } from "@/components/flashcards/flashcards-types";
import { useUiLanguage } from "@/context/ui-language-context";
import { Text, TouchableOpacity, View } from "react-native";

type FlashcardsResultProps = {
  correctCount: number;
  wrongCards: Card[];
  onPractiseWrong: () => void;
  onPractiseAll: () => void;
  t: ReturnType<typeof useUiLanguage>["t"];
};

export function FlashcardsResult({
  correctCount,
  wrongCards,
  onPractiseWrong,
  onPractiseAll,
  t,
}: FlashcardsResultProps) {
  return (
    <View>
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>{t("finished")}</Text>

        <View style={styles.resultRow}>
          <View style={styles.resultBox}>
            <Text style={styles.resultNumberCorrect}>{correctCount}</Text>
            <Text style={styles.resultLabel}>{t("correct")}</Text>
          </View>

          <View style={styles.resultBox}>
            <Text style={styles.resultNumberWrong}>{wrongCards.length}</Text>
            <Text style={styles.resultLabel}>{t("wrong")}</Text>
          </View>
        </View>
      </View>

      {wrongCards.length > 0 && (
        <TouchableOpacity
          style={styles.fullPrimaryButton}
          onPress={onPractiseWrong}
        >
          <Text style={styles.primaryButtonText}>
            {t("practiseWrong")} ({wrongCards.length})
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.fullSecondaryButton}
        onPress={onPractiseAll}
      >
        <Text style={styles.secondaryButtonText}>{t("practiseAll")}</Text>
      </TouchableOpacity>
    </View>
  );
}
