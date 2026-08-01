import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const categories = ["Migration", "Healthcare", "Law"];

export default function SecondPage() {
  const router = useRouter();
  const { from, to } = useLocalSearchParams<{ from?: string; to?: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.searchText}>search word..</Text>

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
        <Text style={styles.buttonText}>DICTIONARY</Text>
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
  searchText: {
    color: "#9ca3af",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    marginBottom: 20,
    width: "60%",
    alignSelf: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: "18%",
    alignSelf: "flex-start",
    textAlign: "left",
  },
  box: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    marginBottom: 16,
    alignSelf: "center",
    width: "42%",
    alignItems: "center",
  },
  button: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    marginTop: 30,
    alignSelf: "center",
    width: "50%",
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "700",
  },
});
