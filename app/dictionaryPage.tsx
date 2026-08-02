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
    from: "es",
    to: "sv",
    textFrom: "Derecho de migración",
    textTo: "Migrationsrätt",
  },
  {
    id: 3,
    category: "Migration",
    from: "sv",
    to: "en",
    textFrom: "Migrationsrätt",
    textTo: "Migration law",
  },
  {
    id: 4,
    category: "Migration",
    from: "en",
    to: "sv",
    textFrom: "Migration law",
    textTo: "Migrationsrätt",
  },
  {
    id: 5,
    category: "Migration",
    from: "es",
    to: "en",
    textFrom: "Derecho de migración",
    textTo: "Migration law",
  },
  {
    id: 6,
    category: "Migration",
    from: "en",
    to: "es",
    textFrom: "Migration law",
    textTo: "Derecho de migración",
  },
  {
    id: 7,
    category: "Migration",
    from: "sv",
    to: "es",
    textFrom: "Utlänningslagen",
    textTo: "La ley de extranjería",
  },
  {
    id: 8,
    category: "Migration",
    from: "es",
    to: "sv",
    textFrom: "La ley de extranjería",
    textTo: "Utlänningslagen",
  },
  {
    id: 9,
    category: "Migration",
    from: "sv",
    to: "en",
    textFrom: "Utlänningslagen",
    textTo: "The Aliens Act",
  },
  {
    id: 10,
    category: "Migration",
    from: "en",
    to: "sv",
    textFrom: "The Aliens Act",
    textTo: "Utlänningslagen",
  },
  {
    id: 11,
    category: "Migration",
    from: "es",
    to: "en",
    textFrom: "La ley de extranjería",
    textTo: "The Aliens Act",
  },
  {
    id: 12,
    category: "Migration",
    from: "en",
    to: "es",
    textFrom: "The Aliens Act",
    textTo: "La ley de extranjería",
  },
  {
    id: 13,
    category: "Healthcare",
    from: "sv",
    to: "es",
    textFrom: "Navelsträng",
    textTo: "Cordón umbilical",
  },
  {
    id: 14,
    category: "Healthcare",
    from: "es",
    to: "sv",
    textFrom: "Cordón umbilical",
    textTo: "Navelsträng",
  },
  {
    id: 15,
    category: "Healthcare",
    from: "sv",
    to: "en",
    textFrom: "Navelsträng",
    textTo: "Umbilical cord",
  },
  {
    id: 16,
    category: "Healthcare",
    from: "en",
    to: "sv",
    textFrom: "Umbilical cord",
    textTo: "Navelsträng",
  },
  {
    id: 17,
    category: "Healthcare",
    from: "es",
    to: "en",
    textFrom: "Cordón umbilical",
    textTo: "Umbilical cord",
  },
  {
    id: 18,
    category: "Healthcare",
    from: "en",
    to: "es",
    textFrom: "Umbilical cord",
    textTo: "Cordón umbilical",
  },
  {
    id: 19,
    category: "Healthcare",
    from: "sv",
    to: "es",
    textFrom: "Moderkaka",
    textTo: "Placenta",
  },
  {
    id: 20,
    category: "Healthcare",
    from: "es",
    to: "sv",
    textFrom: "Placenta",
    textTo: "Moderkaka",
  },
  {
    id: 21,
    category: "Healthcare",
    from: "sv",
    to: "en",
    textFrom: "Moderkaka",
    textTo: "Placenta",
  },
  {
    id: 22,
    category: "Healthcare",
    from: "en",
    to: "sv",
    textFrom: "Placenta",
    textTo: "Moderkaka",
  },
  {
    id: 23,
    category: "Healthcare",
    from: "es",
    to: "en",
    textFrom: "Placenta",
    textTo: "Placenta",
  },
  {
    id: 24,
    category: "Healthcare",
    from: "en",
    to: "es",
    textFrom: "Placenta",
    textTo: "Placenta",
  },
  {
    id: 25,
    category: "Law",
    from: "sv",
    to: "es",
    textFrom: "Rättspraxis",
    textTo: "Jurisprudencia",
  },
  {
    id: 26,
    category: "Law",
    from: "es",
    to: "sv",
    textFrom: "Jurisprudencia",
    textTo: "Rättspraxis",
  },
  {
    id: 27,
    category: "Law",
    from: "sv",
    to: "en",
    textFrom: "Rättspraxis",
    textTo: "Case law",
  },
  {
    id: 28,
    category: "Law",
    from: "en",
    to: "sv",
    textFrom: "Case law",
    textTo: "Rättspraxis",
  },
  {
    id: 29,
    category: "Law",
    from: "es",
    to: "en",
    textFrom: "Jurisprudencia",
    textTo: "Case law",
  },
  {
    id: 30,
    category: "Law",
    from: "en",
    to: "es",
    textFrom: "Case law",
    textTo: "Jurisprudencia",
  },
  {
    id: 31,
    category: "Law",
    from: "sv",
    to: "es",
    textFrom: "Brottsbalken",
    textTo: "El código penal",
  },
  {
    id: 32,
    category: "Law",
    from: "es",
    to: "sv",
    textFrom: "El código penal",
    textTo: "Brottsbalken",
  },
  {
    id: 33,
    category: "Law",
    from: "sv",
    to: "en",
    textFrom: "Brottsbalken",
    textTo: "The Criminal Code",
  },
  {
    id: 34,
    category: "Law",
    from: "en",
    to: "sv",
    textFrom: "The Criminal Code",
    textTo: "Brottsbalken",
  },
  {
    id: 35,
    category: "Law",
    from: "es",
    to: "en",
    textFrom: "El código penal",
    textTo: "The Criminal Code",
  },
  {
    id: 36,
    category: "Law",
    from: "en",
    to: "es",
    textFrom: "The Criminal Code",
    textTo: "El código penal",
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
    const selectedFrom = String(from ?? "").toLowerCase();
    const selectedTo = String(to ?? "").toLowerCase();
    const matchesLanguage = word.from === selectedFrom && word.to === selectedTo;
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
