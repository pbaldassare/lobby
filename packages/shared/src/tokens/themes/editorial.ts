/**
 * Direzione A — editoriale sobrio.
 *
 * Serif in display, oro degradato ad accento invece che tinta d'ambiente.
 * Lobby vende discrezione: l'oro spalmato su sfondi, bordi, kicker e spinner
 * diceva il contrario. Ridotto ad accento, il sigillo del venue torna a essere
 * l'elemento che si nota — che è il suo compito, visto che lo rilascia il locale.
 */

import type { ThemeContract, ThemeSet, ThemeType } from '../contract';

const face = {
  displaySemi: 'PlayfairDisplay-SemiBold',
  displayBold: 'PlayfairDisplay-Bold',
  bodyRegular: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemi: 'Inter-SemiBold',
} as const;

/** Scala tipografica condivisa dalle due varianti.
 *  Dimensioni intere: le frazionarie ereditate dal mockup (12,5 / 11,5 / 9,5)
 *  arrotondavano in modo diverso tra densità di schermo. */
const type: ThemeType = {
  kicker: {
    fontFamily: face.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  titleLg: { fontFamily: face.displayBold, fontSize: 26, lineHeight: 32, letterSpacing: -0.2 },
  titleSm: { fontFamily: face.displaySemi, fontSize: 18, lineHeight: 24 },
  name: { fontFamily: face.bodySemi, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: face.bodyRegular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: face.bodySemi, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: face.bodyRegular, fontSize: 13, lineHeight: 18 },
  tiny: { fontFamily: face.bodyRegular, fontSize: 11, lineHeight: 15 },
  /** 11px è il minimo leggibile: la tab bar stava a 9,5. */
  tab: { fontFamily: face.bodyMedium, fontSize: 11, lineHeight: 14 },
  score: { fontFamily: face.bodySemi, fontSize: 13, lineHeight: 16 },
};

const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

const dark: ThemeContract = {
  name: 'editorial',
  scheme: 'dark',
  color: {
    bg: { canvas: '#0E0D0C', raised: '#1A1917', sunken: '#141312' },
    text: {
      primary: '#F2EDE4',
      secondary: '#A39C90',
      tertiary: '#6B655C',
      onAccent: '#241A08',
    },
    accent: {
      default: '#C9A227',
      subtleBg: '#1F1B12',
      subtleBorder: '#4A3F22',
      on: '#241A08',
    },
    signal: { default: '#6FBF8B', subtleBg: '#12211A', border: '#2C4A3B' },
    border: { subtle: '#232120', strong: '#2C2926' },
    status: {
      danger: '#E8836F',
      dangerSubtleBg: '#241512',
      warning: '#D9A441',
      positive: '#6FBF8B',
    },
  },
  radius,
  type,
};

const light: ThemeContract = {
  name: 'editorial',
  scheme: 'light',
  color: {
    bg: { canvas: '#FAF7F2', raised: '#FFFFFF', sunken: '#F2EDE4' },
    text: {
      primary: '#1A1917',
      secondary: '#6B6459',
      tertiary: '#8F887C',
      onAccent: '#FFFFFF',
    },
    accent: {
      default: '#8A6D1F',
      subtleBg: '#FBF3DF',
      subtleBorder: '#DFCFA4',
      on: '#FFFFFF',
    },
    signal: { default: '#2F7D53', subtleBg: '#E8F4EC', border: '#A8D0BA' },
    border: { subtle: '#E4DDD1', strong: '#D6CCBB' },
    status: {
      danger: '#B3402A',
      dangerSubtleBg: '#FBECE8',
      warning: '#8A6212',
      positive: '#2F7D53',
    },
  },
  radius,
  type,
};

export const editorial: ThemeSet = { light, dark };
