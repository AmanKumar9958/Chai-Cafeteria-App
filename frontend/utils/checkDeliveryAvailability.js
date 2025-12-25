import * as Location from 'expo-location';
import axios from 'axios';
import { Alert } from 'react-native';

/**
 * Checks if delivery is available at the user's current location.
 * Requests location permission, fetches coordinates, and validates with backend.
 * @param {string} backendUrl - The backend endpoint for location validation
 * @param {function} setLoading - (optional) Set loading state
 * @returns {Promise<{allowed: boolean, distance?: number, message?: string}>}
 */
export async function checkDeliveryAvailability(backendUrl, setLoading) {
  if (setLoading) setLoading(true);
  try {
    // 1. Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      if (setLoading) setLoading(false);
      Alert.alert('Permission Denied', 'Location permission is required to check delivery availability.');
      return { allowed: false, message: 'Permission denied' };
    }

    // 2. Get current location
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const { latitude, longitude } = location.coords;

    // 3. Send to backend for validation
    const response = await axios.post(backendUrl, {
      userLatitude: latitude,
      userLongitude: longitude,
    });

    if (response.data.allowed) {
      if (setLoading) setLoading(false);
      return { allowed: true, distance: response.data.distance };
    } else {
      if (setLoading) setLoading(false);
      Alert.alert('Delivery Unavailable', response.data.message || 'We only deliver within 10km.');
      return { allowed: false, distance: response.data.distance, message: response.data.message };
    }
  } catch (err) {
    if (setLoading) setLoading(false);
    const msg = err?.response?.data?.message || err?.message || 'Could not check delivery availability.';
    Alert.alert('Error', msg);
    return { allowed: false, message: msg };
  }
}
