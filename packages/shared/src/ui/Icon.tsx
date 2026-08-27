import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { icons, type IconDef, type IconName } from './icons/paths';

export type { IconName };

/**
 * Icona vettoriale.
 *
 * `react-native-svg` è già dipendenza diretta dell'app (arriva con
 * `react-native-qrcode-svg`), quindi non serve né un modulo nativo nuovo né
 * una ricompilazione. Sostituisce i caratteri usati come icone — la spunta
 * del sigillo era un `'✓'` letterale.
 */
export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}): React.JSX.Element {
  const def: IconDef = icons[name];

  return (
    <Svg width={size} height={size} viewBox={def.viewBox} accessibilityRole="image">
      {def.paths.map((d) => (
        <Path
          key={d}
          d={d}
          fill={def.filled ? color : 'none'}
          stroke={def.filled ? 'none' : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
