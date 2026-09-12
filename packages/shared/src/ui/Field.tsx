import React, { useState } from 'react';
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { makeStyles, useTheme } from '../theme';
import { Text } from './Text';

export type FieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  /** Messaggio di errore mostrato sotto al campo, dove serve. */
  error?: string | null;
  hint?: string;
  /** Ritocchi all'input, es. altezza per i campi multiriga. */
  inputStyle?: StyleProp<TextStyle>;
};

/**
 * Campo di testo.
 *
 * Tre schermate si scrivevano a mano bordo, raggio e padding di un `TextInput`,
 * con `borderRadius: 11` cablato in due di esse. L'etichetta è visibile e non
 * affidata al solo placeholder, che sparisce appena inizi a scrivere.
 */
export function Field({
  label,
  error,
  hint,
  inputStyle,
  ...rest
}: FieldProps): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.root}>
      {label ? (
        <Text variant="tiny" tone="secondary">
          {label}
        </Text>
      ) : null}

      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor={theme.color.text.tertiary}
        style={[
          styles.input,
          rest.multiline && styles.multiline,
          focused && styles.focused,
          Boolean(error) && styles.invalid,
          inputStyle,
        ]}
      />

      {error ? (
        <Text variant="tiny" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="tiny" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: 5 },
  input: {
    borderWidth: 1,
    borderColor: t.color.border.subtle,
    backgroundColor: t.color.bg.raised,
    borderRadius: t.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    color: t.color.text.primary,
    ...t.type.body,
  },
  multiline: { borderRadius: t.radius.lg, minHeight: 88, paddingTop: 12 },
  focused: { borderColor: t.color.accent.default },
  invalid: { borderColor: t.color.status.danger },
}));
