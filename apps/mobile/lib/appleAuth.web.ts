/** Web stub: the native Apple sheet does not exist here; AuthProvider uses OAuth. */
export async function signInWithNativeApple(): Promise<
  'ok' | 'canceled' | 'unavailable' | { error: string }
> {
  return 'unavailable';
}
