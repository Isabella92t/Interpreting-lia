import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { signIn, isLoading, isConfigured, error } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interpreter App</Text>
      <Text>Log in or create an account to continue.</Text>

      {isConfigured ? (
        isLoading ? (
          <ActivityIndicator />
        ) : (
          <Button title="Log in or create account" onPress={signIn} />
        )
      ) : (
        <Text>
          Auth0 is not configured. Set EXPO_PUBLIC_AUTH0_DOMAIN and EXPO_PUBLIC_AUTH0_CLIENT_ID in
          .env and restart the dev server.
        </Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});