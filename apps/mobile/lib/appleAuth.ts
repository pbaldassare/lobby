/** Android: native Apple sheet is unavailable; AuthProvider falls back to OAuth. */
export async function signInWithNativeApple(): Promise<
  'ok' | 'canceled' | 'unavailable' | { error: string }
> {
  return 'unavailable';
}
