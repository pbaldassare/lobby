/**
 * Tracciati delle icone — neutri rispetto alla piattaforma.
 *
 * Nessun import da react-native, così anche il backoffice può renderli con un
 * `<svg>` normale. Un'unica fonte, due legami: la stessa idea delle custom
 * property CSS generate dai token.
 *
 * Tutte su griglia 24×24, tratto uniforme, estremità arrotondate.
 */

export type IconDef = {
  viewBox: string;
  paths: string[];
  /** Riempito invece che tracciato (il pallino della presenza). */
  filled?: boolean;
};

const V = '0 0 24 24';

export const icons = {
  room: {
    viewBox: V,
    paths: [
      'M9 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z',
      'M2.5 20a6.5 6.5 0 0 1 13 0',
      'M17 7.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z',
      'M17.5 15a5 5 0 0 1 4 4.6',
    ],
  },
  matches: {
    viewBox: V,
    paths: [
      'M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1-5.1-1.9 5.1-1.9 1.9-5.1Z',
      'M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z',
    ],
  },
  showcase: {
    viewBox: V,
    paths: [
      'M4 7.5h16a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z',
      'M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5',
      'M2.5 12.5h19',
    ],
  },
  card: {
    viewBox: V,
    paths: [
      'M4 5h16a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4 5Z',
      'M8.5 9a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z',
      'M5 17a3.75 3.75 0 0 1 7 0',
      'M14.5 10h4',
      'M14.5 13.5h4',
    ],
  },
  signals: {
    viewBox: V,
    paths: ['M21 3.5 10.5 14', 'M21 3.5 14.5 21 10.5 14 3.5 10Z'],
  },
  check: {
    viewBox: V,
    paths: ['M4.5 12.5 9.5 17.5 19.5 6.5'],
  },
  chevronRight: {
    viewBox: V,
    paths: ['M9.5 5 16.5 12 9.5 19'],
  },
  live: {
    viewBox: V,
    paths: ['M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z'],
    filled: true,
  },
  scan: {
    viewBox: V,
    paths: [
      'M4 8V5h3',
      'M17 5h3v3',
      'M20 16v3h-3',
      'M7 19H4v-3',
      'M8 8.5h3.5V12H8Z',
      'M12.5 8.5H16V12h-3.5Z',
      'M8 12.5h3.5V16H8Z',
      'M12.5 12.5H16V16h-3.5Z',
    ],
  },
  lock: {
    viewBox: V,
    paths: [
      'M8 11V8a4 4 0 1 1 8 0v3',
      'M6.5 11h11A1.5 1.5 0 0 1 19 12.5v7A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-7A1.5 1.5 0 0 1 6.5 11Z',
    ],
  },
  memory: {
    viewBox: V,
    paths: [
      'M12 7v5l3 2',
      'M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z',
      'M12 3v1.5',
    ],
  },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof icons;
