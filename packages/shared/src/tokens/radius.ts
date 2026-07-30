/**
 * Raggi dal mockup: glass 18, btn 13, chip/pill 999, sheet 26, field 11, …
 */
export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 9,
  field: 11,
  spark: 11,
  btn: 13,
  member: 14,
  bub: 15,
  card: 16,
  ice: 16,
  glass: 18,
  bizcard: 22,
  sheet: 26,
  phone: 36,
  full: 999,
} as const;

export type Radius = typeof radius;
export type RadiusKey = keyof typeof radius;
