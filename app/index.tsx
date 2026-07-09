import { Button, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You are logged in</Text>
      <Text>{user?.email ?? user?.name}</Text>
      <Button title="Log out" onPress={signOut} />
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
});