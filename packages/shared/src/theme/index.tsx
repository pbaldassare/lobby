/**
 * Tema a runtime per React Native.
 *
 * Vive fuori da `tokens/` di proposito: i token devono restare senza import da
 * react-native, perché li consuma anche il backoffice Next. Qui invece si usa
 * `StyleSheet`, quindi è codice solo-mobile.
 */

import React, { createContext, useContext, useMemo } from 'react';
import {
  StyleSheet,
  useColorScheme,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { ThemeContract, ThemeSet } from '../tokens/contract';
import { editorial } from '../tokens/themes/editorial';

const ThemeContext = createContext<ThemeContract>(editorial.dark);

export function ThemeProvider({
  children,
  theme = editorial,
  /** Forza uno schema invece di seguire il sistema. Utile per le verifiche. */
  scheme,
}: {
  children: React.ReactNode;
  theme?: ThemeSet;
  scheme?: 'light' | 'dark';
}): React.JSX.Element {
  const system = useColorScheme();
  const resolved = scheme ?? (system === 'light' ? 'light' : 'dark');
  const value = useMemo(() => theme[resolved], [theme, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContract {
  return useContext(ThemeContext);
}

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

/**
 * Costruisce gli stili dal tema attivo.
 *
 * Gli stili non sono più costanti di modulo, quindi verrebbe naturale
 * ricrearli a ogni render: la cache per `nome:schema` fa sì che
 * `StyleSheet.create` giri una volta per tema e non una volta per render.
 *
 *   const useStyles = makeStyles((t) => ({ card: { backgroundColor: t.color.bg.raised } }));
 *   const styles = useStyles();
 */
export function makeStyles<T extends NamedStyles>(
  build: (theme: ThemeContract) => T,
): () => T {
  const cache = new Map<string, T>();

  return function useStyles(): T {
    const theme = useTheme();
    const key = `${theme.name}:${theme.scheme}`;
    let styles = cache.get(key);
    if (!styles) {
      styles = StyleSheet.create(build(theme));
      cache.set(key, styles);
    }
    return styles;
  };
}

export type { ThemeContract, ThemeSet } from '../tokens/contract';
