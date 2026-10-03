import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Permissions + Expo push token. No-op on the member PWA (web). */
export function usePushNotifications(): {
  expoPushToken: string | null;
  permission: Notifications.PermissionStatus | null;
  requestPermission: () => Promise<void>;
} {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<Notifications.PermissionStatus | null>(null);
  const received = useRef<Notifications.EventSubscription | null>(null);
  const response = useRef<Notifications.EventSubscription | null>(null);

  const requestPermission = async () => {
    if (Platform.OS === 'web') return;
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    setPermission(status);
    if (status !== 'granted') return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const projectId =
      Constants.easConfig?.projectId ??
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    try {
      const token = await Notifications.getExpoPushTokenAsync(
        projectId && projectId !== 'replace-with-eas-project-id' ? { projectId } : undefined,
      );
      setExpoPushToken(token.data);
    } catch (e) {
      console.warn('push token', e);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void requestPermission();
    received.current = Notifications.addNotificationReceivedListener((n) => {
      console.log('notification received', n.request.content.title);
    });
    response.current = Notifications.addNotificationResponseReceivedListener((r) => {
      console.log('notification response', r.notification.request.content.data);
    });
    return () => {
      received.current?.remove();
      response.current?.remove();
    };
  }, []);

  return { expoPushToken, permission, requestPermission };
}
