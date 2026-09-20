/** Misure della tab bar flottante: una sola fonte per layout e padding. */
export const TAB_BAR_HEIGHT = 62;
export const TAB_BAR_SIDE = 14;
export const TAB_BAR_BOTTOM = 12;

/** Spazio da lasciare in fondo alle schermate sopra la pastiglia. */
export function tabBarReserve(insetsBottom: number): number {
  return TAB_BAR_HEIGHT + Math.max(insetsBottom, TAB_BAR_BOTTOM) + 12;
}
