/**
 * Notification Service — Expo Push Notifications
 * Platform-safe implementation
 */
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure default notification behavior (Native only)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Register for push notifications and get Expo push token
 */
export const registerForPushNotifications = async () => {
  if (Platform.OS === 'web') return null;

  try {
    let token;

    // Check if running on a physical device
    if (!Constants.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get the Expo push token
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

    // Android-specific notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('roadrescue', {
        name: 'RoadRescue',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
      });
    }

    return token;
  } catch (error) {
    console.log('Notification registration failed:', error);
    return null;
  }
};

/**
 * Schedule a local notification
 */
export const sendLocalNotification = async (title, body, data = {}) => {
  if (Platform.OS === 'web') {
    console.log('Local Notification (Web):', title, body);
    return;
  }
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Immediately
    });
  } catch (error) {
    console.log('Error sending local notification:', error);
  }
};

/**
 * Listen for incoming notifications
 */
export const addNotificationListener = (callback) => {
  if (Platform.OS === 'web') return () => {};
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Listen for notification taps
 */
export const addNotificationResponseListener = (callback) => {
  if (Platform.OS === 'web') return () => {};
  return Notifications.addNotificationResponseReceivedListener(callback);
};
