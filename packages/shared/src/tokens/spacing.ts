/**
 * Scala spaziatura derivata dal mockup (padding body 18, gap chip 7, person 13/15/11, …).
 */
export const spacing = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 9,
  6: 10,
  7: 11,
  8: 12,
  9: 13,
  10: 14,
  11: 15,
  12: 16,
  13: 18,
  14: 20,
  15: 22,
  16: 24,
  17: 28,
  18: 30,
  19: 36,
  20: 46,
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof typeof spacing;

/** Alias semantici usati dalle primitive UI */
export const space = {
  xxs: spacing[1],
  xs: spacing[2],
  sm: spacing[4],
  md: spacing[8],
  lg: spacing[10],
  xl: spacing[12],
  '2xl': spacing[13],
  '3xl': spacing[16],
  screenX: spacing[13],
  personGap: spacing[9],
  personPad: spacing[11],
  chipGap: 7,
  sheetPad: spacing[13],
} as const;
