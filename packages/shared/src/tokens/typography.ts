/**
 * Tipografia dal mockup:
 * - Display: Space Grotesk
 * - Body: Inter
 * - Wordmark: Poppins (letter-spacing ampio)
 */
export const fontFamily = {
  display: 'SpaceGrotesk',
  body: 'Inter',
  wordmark: 'Poppins',
  /** Fallback nativi se i font custom non sono ancora caricati */
  displayFallback: 'System',
  bodyFallback: 'System',
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Scala tipografica (px) allineata a title / sm / tiny / btn / match / wordmark.
 */
export const typography = {
  wordmark: {
    fontFamily: fontFamily.wordmark,
    fontSize: 34,
    fontWeight: fontWeight.medium,
    letterSpacing: 6.8,
    lineHeight: 40,
  },
  displayLg: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  displayMd: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  displaySm: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  displayXs: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 19,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  projectName: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  match: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: fontWeight.bold,
    letterSpacing: 0,
    lineHeight: 16,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
    lineHeight: 22,
  },
  button: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
    lineHeight: 20,
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    lineHeight: 20,
  },
  labelStrong: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
    lineHeight: 20,
  },
  sm: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    lineHeight: 18,
  },
  smStrong: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0,
    lineHeight: 18,
  },
  chip: {
    fontFamily: fontFamily.body,
    fontSize: 11.5,
    fontWeight: fontWeight.medium,
    letterSpacing: 0,
    lineHeight: 16,
  },
  tiny: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    lineHeight: 15,
  },
  kicker: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.1,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  tab: {
    fontFamily: fontFamily.body,
    fontSize: 9.5,
    fontWeight: fontWeight.medium,
    letterSpacing: 0,
    lineHeight: 12,
  },
} as const;

export type Typography = typeof typography;
export type TypographyKey = keyof typeof typography;
