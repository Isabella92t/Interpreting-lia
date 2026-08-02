import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const words = [
  {
    id: 1,
    category: "Migration",
    from: "sv",
    to: "es",
    textFrom: "Migrationsrätt",
    textTo: "Derecho de migración",
  },
  {
    id: 2,
    category: "Migration",
    from: "sv",
    to: "en",
    textFrom: "Migrationsrätt",
    textTo: "Migration law",
  },
  {
    id: 3,
    category: "Migration",
    from: "sv",
    to: "es",
    textFrom: "Utlänningslagen",
    textTo: "La ley de extranjería",
  },
  {
    id: 4,
    category: "Migration",
    from: "sv",
    to: "en",
    textFrom: "Utlänningslagen",
    textTo: "The Aliens Act",
  },
  {
    id: 5,
    category: "Healthcare",
    from: "sv",
    to: "es",
    textFrom: "Navelsträng",
    textTo: "Cordón umbilical",
  },
  {
    id: 6,
    category: "Healthcare",
    from: "sv",
    to: "en",
    textFrom: "Navelsträng",
    textTo: "Umbilical cord",
  },
  {
    id: 7,
    category: "Healthcare",
    from: "sv",
    to: "es",
    textFrom: "Moderkaka",
    textTo: "Placenta",
  },
  {
    id: 8,
    category: "Healthcare",
    from: "sv",
    to: "en",
    textFrom: "Moderkaka",
    textTo: "Placenta",
  },
  {
    id: 9,
    category: "Law",
    from: "sv",
    to: "es",
    textFrom: "Rättspraxis",
    textTo: "Jurisprudencia",
  },
  {
    id: 10,
    category: "Law",
    from: "sv",
    to: "en",
    textFrom: "Rättspraxis",
    textTo: "Case law",
  },
  {
    id: 11,
    category: "Law",
    from: "sv",
    to: "es",
    textFrom: "Brottsbalken",
    textTo: "El código penal",
  },
  {
    id: 12,
    category: "Law",
    from: "sv",
    to: "en",
    textFrom: "Brottsbalken",
    textTo: "The Criminal Code",
  },
];

export default function DictionaryPage() {
  const router = useRouter();
  const { from, to, category } = useLocalSearchParams<{
    from?: string;
    to?: string;
    category?: string;
  }>();

  const filteredWords = words.filter((word) => {
    const matchesLanguage = word.from === from && word.to === to;
    const normalizedCategory = category?.toLowerCase();
    const matchesCategory =
      !category ||
      word.category.toLowerCase() === normalizedCategory ||
      (word.category === "Healthcare" && normalizedCategory === "healthcare") ||
      (word.category === "Law" && normalizedCategory === "law") ||
      (word.category === "Migration" && normalizedCategory === "migration");

    return matchesLanguage && matchesCategory;
  });

  const title = category ? `${category}` : "Dictionary";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{title}</Text>

      {filteredWords.map((word) => (
        <View key={word.id} style={styles.row}>
          <Text style={styles.text}>{word.textFrom}</Text>
          <Text style={styles.text}>{word.textTo}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  header: {
    position: "absolute",
    top: 52,
    left: 20,
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
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 8,
    width: "75%",
    alignSelf: "center",
  },
  text: {
    fontSize: 16,
    color: "#111827",
  },
});
