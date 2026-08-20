import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Category = {
  id: number;
  name: string;
};

export default function SecondPage() {
  const router = useRouter();
  const db = useSQLiteContext();

  const { from, to } = useLocalSearchParams<{
    from?: string;
    to?: string;
  }>();

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const result = await db.getAllAsync<Category>(
      "SELECT id, name FROM tags ORDER BY name ASC",
    );

    setCategories(result);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.searchText}>
        <FontAwesome name="search" size={32} color="#111827" />
      </View>

      <Text style={styles.title}>Categories</Text>

      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={styles.box}
          onPress={() =>
            router.push({
              pathname: "/dictionaryPage",
              params: {
                from,
                to,
                category: category.name,
              },
            })
          }
        >
          <Text>{category.name}</Text>
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
        <Text>Dictionary</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: "/IdiomsPage",
            params: {
              from,
              to,
            },
          })
        }
      >
        <Text>Idiomer</Text>
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
    marginTop: 20,
    alignSelf: "center",
    width: "50%",
    alignItems: "center",
  },
});