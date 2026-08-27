/**
 * Dai token TypeScript alle custom property CSS.
 *
 * Il backoffice ricopiava a mano un sottoinsieme della palette in
 * `globals.css`, con un commento che diceva da dove veniva. I valori
 * combaciavano, ma niente impediva che divergessero: bastava ritoccare i
 * token e dimenticarsi del CSS.
 *
 * Generarle a ogni render elimina la copia invece di sorvegliarla. Uno script
 * di build la reintrodurrebbe, e dipenderebbe da qualcuno che si ricorda di
 * rilanciarlo — che è esattamente come `globals.css` è finito così.
 *
 * IMPORTANTE: questo file non deve importare nulla da react-native, o il
 * build di Next si rompe.
 */

import type { ThemeContract, ThemeSet } from './contract';

/** `color.bg.canvas` → `--lobby-color-bg-canvas`.
 *  La corrispondenza è meccanica di proposito: rende i due lati verificabili
 *  con un grep, che è il sostituto pratico dell'autocompletamento. */
function flatten(obj: unknown, path: string[] = []): [string, string][] {
  if (obj === null || typeof obj !== 'object') {
    return [[`--lobby-${path.join('-')}`, String(obj)]];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, [...path, k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()]),
  );
}

function block(selector: string, theme: ThemeContract): string {
  const vars = [
    ...flatten(theme.color, ['color']),
    ...flatten(theme.radius, ['radius']).map(
      ([k, v]) => [k, `${v}px`] as [string, string],
    ),
  ];

  const body = vars.map(([k, v]) => `  ${k}: ${v};`).join('\n');
  return `${selector} {\n${body}\n}`;
}

/**
 * Emette entrambe le varianti: `:root` per il chiaro, `[data-theme="dark"]`
 * più `prefers-color-scheme` per lo scuro.
 */
export function toCssVars(theme: ThemeSet): string {
  return [
    block(':root', theme.light),
    `@media (prefers-color-scheme: dark) {\n${block(':root:not([data-theme="light"])', theme.dark)}\n}`,
    block(':root[data-theme="dark"]', theme.dark),
  ].join('\n');
}
