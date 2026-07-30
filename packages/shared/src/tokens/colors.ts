/**
 * Palette estratta da Lobby_mockup_final.html (:root + trattamenti gold/glass).
 * Fonte unica — non inventare tonalità fuori da questo set.
 */
export const colors = {
  bg: {
    /** --bg */
    base: '#070809',
    /** --bg2 */
    elevated: '#0C0E11',
    /** sheet / toast deep panels */
    sheet: '#15171A',
    /** --panel2 */
    panelSolid: '#161616',
    /** bizcard / toast mid */
    panelMid: '#16181C',
    black: '#000000',
  },

  ink: {
    /** --ink */
    primary: '#F3EEE3',
    /** --mut */
    muted: '#9BA6B6',
    /** --mut2 */
    muted2: '#6B7686',
    /** hint / reset secondary */
    soft: '#8A93A3',
  },

  gold: {
    /** --gold */
    base: '#E7C684',
    /** --a1 */
    light: '#F4D58D',
    /** mid stop for CTA gradient (#D2A856) */
    mid: '#D2A856',
    /** --a2 */
    deep: '#C9A24A',
    /** poster kick accent */
    bronze: '#C99B4C',
    /** --aInk — testo su CTA gold */
    onGold: '#241A08',
    /** logo gradient stops */
    logoLight: '#F7DE9C',
    logoMid: '#E0BA68',
    logoDeep: '#AE7D2B',
  },

  green: {
    /** --green — live / match / connected */
    base: '#5FE0A6',
    /** check mark ink on seal */
    onGreen: '#04241A',
  },

  accent: {
    /** “Building now” cool variant */
    cool: '#8FC0FF',
    coolSoft: 'rgba(110, 170, 255, 0.16)',
    coolBorder: 'rgba(120, 175, 255, 0.32)',
  },

  /** Superfici glass / linee (RGBA come nel mockup) */
  surface: {
    /** --panel */
    panel: 'rgba(255, 255, 255, 0.04)',
    panelHover: 'rgba(255, 255, 255, 0.05)',
    field: 'rgba(255, 255, 255, 0.03)',
    toggleOff: 'rgba(255, 255, 255, 0.13)',
    grab: 'rgba(255, 255, 255, 0.18)',
    tabBar: 'rgba(0, 0, 0, 0.7)',
    scrim: 'rgba(0, 0, 0, 0.65)',
  },

  border: {
    /** --line */
    subtle: 'rgba(255, 255, 255, 0.07)',
    /** --line2 */
    strong: 'rgba(255, 255, 255, 0.14)',
    gold: 'rgba(231, 198, 132, 0.3)',
    goldStrong: 'rgba(231, 198, 132, 0.45)',
    goldSoft: 'rgba(231, 198, 132, 0.22)',
    goldMid: 'rgba(231, 198, 132, 0.28)',
    goldSpotlight: 'rgba(231, 198, 132, 0.4)',
    green: 'rgba(95, 224, 166, 0.35)',
    greenLive: 'rgba(95, 224, 166, 0.4)',
    greenSoft: 'rgba(95, 224, 166, 0.25)',
    greenMatch: 'rgba(95, 224, 166, 0.28)',
  },

  fill: {
    /** --goldsoft */
    goldSoft: 'rgba(231, 198, 132, 0.13)',
    goldWash: 'rgba(231, 198, 132, 0.1)',
    goldWashFaint: 'rgba(231, 198, 132, 0.02)',
    goldIce: 'rgba(231, 198, 132, 0.11)',
    goldIceFaint: 'rgba(231, 198, 132, 0.03)',
    goldPoster: 'rgba(231, 198, 132, 0.05)',
    goldRadial: 'rgba(231, 198, 132, 0.14)',
    goldBiz: 'rgba(231, 198, 132, 0.16)',
    /** --greensoft */
    greenSoft: 'rgba(95, 224, 166, 0.13)',
    greenBrief: 'rgba(95, 224, 166, 0.12)',
    greenBriefFaint: 'rgba(95, 224, 166, 0.03)',
    greenMatch: 'rgba(95, 224, 166, 0.09)',
    /** ambient glow */
    glowTop: 'rgba(231, 198, 132, 0.1)',
    glowAmbient: 'rgba(231, 198, 132, 0.07)',
  },
} as const;

export type Colors = typeof colors;

/** Stop del gradiente CTA gold (120deg nel mockup) */
export const goldGradient = {
  colors: [colors.gold.light, colors.gold.mid] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0.35 },
} as const;

/** Stop del gradiente sigillo (135deg) */
export const sealGradient = {
  colors: [colors.gold.light, colors.gold.deep] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

/** Stop del logo mark */
export const logoGradient = {
  colors: [colors.gold.logoLight, colors.gold.logoMid, colors.gold.logoDeep] as const,
} as const;
