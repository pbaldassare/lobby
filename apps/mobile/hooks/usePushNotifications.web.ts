/**
 * Sul web le notifiche push di Expo non esistono: importare
 * `expo-notifications` serve solo a far comparire un avviso in console a ogni
 * caricamento. Metro sceglie questo file al posto di quello nativo.
 */
export function usePushNotifications(): {
  expoPushToken: string | null;
  permission: null;
  requestPermission: () => Promise<void>;
} {
  return { expoPushToken: null, permission: null, requestPermission: async () => undefined };
}
