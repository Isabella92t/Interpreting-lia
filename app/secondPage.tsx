import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const categories = ["Migration", "Healthcare", "Law"];

export default function SecondPage() {
  const router = useRouter();
  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchText}>
        <FontAwesome name="search" size={32} color="#111827" />
      </View>

      <Text style={styles.title}>Categories</Text>

      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={styles.box}
          onPress={() =>
            router.push({
              pathname: "/dictionaryPage",
              params: { from, to, category },
            })
          }
        >
          <Text>{category}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: "/dictionaryPage",
            params: { from, to },
          })
        }
      >
        <FontAwesome name="book" size={32} color="#111827" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    paddingTop: 40,
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
  searchText: {
    color: "#9ca3af",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    marginBottom: 32,
    width: "60%",
    alignSelf: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 18,
    marginLeft: "18%",
    alignSelf: "flex-start",
    textAlign: "left",
  },
  box: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 14,
    marginBottom: 18,
    alignSelf: "center",
    width: "42%",
    alignItems: "center",
  },
  button: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 14,
    marginTop: 42,
    alignSelf: "center",
    width: "50%",
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "700",
  },
});
