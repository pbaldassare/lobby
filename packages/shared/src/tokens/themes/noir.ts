/**
 * Palette storica, mappata sui ruoli del contratto.
 *
 * Serve a due cose: dimostrare che il livello semantico non ha cambiato nulla
 * (con questo tema la schermata deve restare identica a prima), e dare una via
 * di ritorno se la direzione nuova non convince.
 *
 * Non esiste variante chiara: l'app era dark-only. `light` qui è una
 * derivazione onesta ma non progettata — se serve davvero un tema chiaro,
 * si usa `editorial`.
 */

import type { ThemeContract, ThemeSet, ThemeType } from '../contract';

const face = {
  displaySemi: 'SpaceGrotesk-SemiBold',
  displayBold: 'SpaceGrotesk-Bold',
  bodyRegular: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemi: 'Inter-SemiBold',
} as const;

const type: ThemeType = {
  kicker: {
    fontFamily: face.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  titleLg: { fontFamily: face.displayBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  titleSm: { fontFamily: face.displayBold, fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  name: { fontFamily: face.displayBold, fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: face.bodyRegular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: face.bodySemi, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: face.bodyRegular, fontSize: 13, lineHeight: 18 },
  tiny: { fontFamily: face.bodyRegular, fontSize: 11, lineHeight: 15 },
  tab: { fontFamily: face.bodyMedium, fontSize: 11, lineHeight: 14 },
  score: { fontFamily: face.displayBold, fontSize: 13, lineHeight: 16 },
};

const radius = { sm: 11, md: 16, lg: 18, pill: 999 };

const dark: ThemeContract = {
  name: 'noir',
  scheme: 'dark',
  color: {
    bg: { canvas: '#070809', raised: '#161616', sunken: '#0C0E11' },
    text: {
      primary: '#F3EEE3',
      secondary: '#9BA6B6',
      tertiary: '#6B7686',
      onAccent: '#241A08',
    },
    accent: {
      default: '#E7C684',
      subtleBg: 'rgba(231,198,132,0.13)',
      subtleBorder: 'rgba(231,198,132,0.30)',
      on: '#241A08',
    },
    signal: {
      default: '#5FE0A6',
      subtleBg: 'rgba(95,224,166,0.13)',
      border: 'rgba(95,224,166,0.35)',
    },
    border: { subtle: 'rgba(255,255,255,0.07)', strong: 'rgba(255,255,255,0.14)' },
    status: {
      danger: '#EE8888',
      dangerSubtleBg: 'rgba(238,136,136,0.12)',
      warning: '#FFBE64',
      positive: '#5FE0A6',
    },
  },
  radius,
  type,
};

const light: ThemeContract = {
  ...dark,
  scheme: 'light',
  color: {
    bg: { canvas: '#F7F5F1', raised: '#FFFFFF', sunken: '#EDEAE3' },
    text: {
      primary: '#16181C',
      secondary: '#5A6472',
      tertiary: '#828C9A',
      onAccent: '#241A08',
    },
    accent: {
      default: '#8A6B21',
      subtleBg: '#FAF2DF',
      subtleBorder: '#DFC98F',
      on: '#FFFFFF',
    },
    signal: { default: '#1F7A55', subtleBg: '#E6F4EE', border: '#A5D4C1' },
    border: { subtle: '#E3E0D9', strong: '#CFCBC2' },
    status: {
      danger: '#B03A3A',
      dangerSubtleBg: '#FBEDED',
      warning: '#8A5E12',
      positive: '#1F7A55',
    },
  },
};

export const noir: ThemeSet = { light, dark };
