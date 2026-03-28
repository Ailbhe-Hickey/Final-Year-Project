import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export async function registerForPushNotificationsAsync() {     // adapted from https://docs.expo.dev/push-notifications/overview/ and https://docs.expo.dev/push-notifications/sending-notifications/
  // Must be physical device for push notifications
  if (!Device.isDevice) {
    alert('Must use physical device');
    return;
  }

  // Get permissions
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }

  // Permission not granted
  if (status !== 'granted') {
    alert('Permission not granted!');
    return;
  }

  // Get the token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  // Log and return the token
  console.log('PUSH TOKEN:', token.data);
  return token.data;
}
