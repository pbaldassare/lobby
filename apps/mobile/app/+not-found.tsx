import { makeStyles } from '@lobby/shared/theme';
import { Button, Text } from '@lobby/shared/ui';
import { Link, Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function NotFoundScreen(): React.JSX.Element {
  const styles = useStyles();

  return (
    <>
      <Stack.Screen options={{ title: 'Pagina non trovata' }} />
      <View style={styles.container}>
        <Text variant="titleLg">Qui non c'è niente</Text>
        <Text variant="body" tone="secondary" style={styles.body}>
          Il link che hai seguito non porta a nessuna schermata.
        </Text>
        <Link href="/" asChild>
          <Button label="Torna all'inizio" />
        </Link>
      </View>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.color.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  body: { textAlign: 'center' },
}));
