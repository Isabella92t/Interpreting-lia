import { Redirect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/auth-context";
import { useUiLanguage } from "@/context/ui-language-context";

export default function LoginScreen() {
  const router = useRouter();
  const { user, signIn, isLoading, isConfigured, error } = useAuth();
  const { t } = useUiLanguage();

  if (user) return <Redirect href="/firstPage" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("appName")}</Text>
      <Text>{t("loginIntro")}</Text>

      {isConfigured ? (
        isLoading ? (
          <ActivityIndicator />
        ) : (
          <Button title={t("loginButton")} onPress={signIn} />
        )
      ) : (
        <Text>
          Auth0 is not configured. Set EXPO_PUBLIC_AUTH0_DOMAIN and
          EXPO_PUBLIC_AUTH0_CLIENT_ID in .env and restart the dev server.
        </Text>
      )}

      <Button title={t("skip")} onPress={() => router.replace("/firstPage")} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  error: {
    color: "red",
    textAlign: "center",
  },
});
