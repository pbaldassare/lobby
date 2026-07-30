import { StyleSheet, Text, View } from 'react-native';

/** Minimal scaffold screen — domain UI comes later. */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lobby</Text>
      <Text style={styles.subtitle}>Mobile scaffold is ready.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555555',
  },
});
