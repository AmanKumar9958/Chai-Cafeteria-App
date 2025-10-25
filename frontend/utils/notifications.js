import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import axios from 'axios';

// Normalize API base from EXPO_PUBLIC_API_URL
const RAW_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`) : null;

// Global notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureAndroidChannel() {
  if (Device.osName === 'Android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFFBF5',
    });
  }
}

export async function registerForPushNotificationsAsync() {
  try {
    const isPhysicalDevice = Device.isDevice;
    if (!isPhysicalDevice) {
      console.warn('Push notifications require a physical device.');
      return null;
    }

    await ensureAndroidChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Permission for notifications not granted');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token?.data || null;
  } catch (e) {
    console.error('Failed to register for push notifications', e?.message || e);
    return null;
  }
}

export async function sendPushTokenToBackend(expoPushToken, userToken) {
  if (!expoPushToken || !userToken || !API_URL) return false;
  try {
    await axios.post(
      `${API_URL}/users/push-token`,
      { expoPushToken },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    return true;
  } catch (e) {
    console.warn('Failed to send push token to backend (endpoint may not exist yet):', e?.response?.data || e?.message || e);
    return false;
  }
}

// helper removed (not needed for repeating triggers)

export async function scheduleRegularNotifications(times = [
  { hour: 11, minute: 0 },
  { hour: 18, minute: 0 },
]) {
  try {
    // Prevent duplicates on re-run by clearing all scheduled
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled?.length) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }

    for (const t of times) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Chai Cafeteria',
          body: 'Take a chai break ☕️ Check today’s specials and offers!',
          sound: 'default',
        },
        trigger: {
          hour: t.hour,
          minute: t.minute,
          repeats: true,
        },
      });
    }
    return true;
  } catch (e) {
    console.error('Failed to schedule regular notifications', e?.message || e);
    return false;
  }
}

export function subscribeForegroundNotification(callback) {
  // callback: (notification) => void
  const sub = Notifications.addNotificationReceivedListener(callback);
  return () => sub.remove();
}

export function subscribeNotificationResponse(callback) {
  // callback: (response) => void
  const sub = Notifications.addNotificationResponseReceivedListener(callback);
  return () => sub.remove();
}
