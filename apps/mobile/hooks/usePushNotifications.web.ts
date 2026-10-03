/** Web PWA: no Expo push. Native implementation is `usePushNotifications.ts`. */
export function usePushNotifications(): {
  expoPushToken: string | null;
  permission: string | null;
  requestPermission: () => Promise<void>;
} {
  return {
    expoPushToken: null,
    permission: null,
    requestPermission: async () => undefined,
  };
}
