import { makeStyles } from '@lobby/shared/theme';
import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

/** Il QR resta SEMPRE scuro su bianco, in entrambi i temi.
 *  I lettori si aspettano moduli scuri su fondo chiaro: invertirli — o anche
 *  solo abbassare il contrasto per intonarli alla palette — fa fallire la
 *  scansione su parecchi telefoni. La cornice segue il tema, il codice no. */
const QR_LIGHT = '#FFFFFF';
const QR_DARK = '#0B0B0C';

export function QrCard({
  value,
  size = 180,
}: {
  value: string;
  size?: number;
}): React.JSX.Element {
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <QRCode value={value} size={size} backgroundColor={QR_LIGHT} color={QR_DARK} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: {
    alignSelf: 'center',
    padding: 14,
    borderRadius: t.radius.lg,
    backgroundColor: QR_LIGHT,
    borderWidth: 1,
    borderColor: t.color.border.strong,
  },
}));
