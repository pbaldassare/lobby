export { colors, goldGradient, sealGradient, logoGradient } from './colors';
export type { Colors } from './colors';

export { spacing, space } from './spacing';
export type { Spacing, SpacingKey } from './spacing';

export { radius } from './radius';
export type { Radius, RadiusKey } from './radius';

export { fontFamily, fontWeight, typography } from './typography';
export type { Typography, TypographyKey } from './typography';

import { colors } from './colors';
import { spacing, space } from './spacing';
import { radius } from './radius';
import { fontFamily, fontWeight, typography } from './typography';

/** Bundle token pronto per theme provider / import unico */
export const tokens = {
  colors,
  spacing,
  space,
  radius,
  fontFamily,
  fontWeight,
  typography,
} as const;

export type Tokens = typeof tokens;

export type { ThemeContract, ThemeSet, ThemeColors, ThemeType, TypeStyle } from './contract';
export { editorial } from './themes/editorial';
export { noir } from './themes/noir';
export { toCssVars } from './css';
