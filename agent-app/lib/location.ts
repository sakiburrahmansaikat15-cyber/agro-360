import * as Location from 'expo-location';

export async function startBackgroundLocationUpdates() {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    console.log('Permission to access location was denied');
    return;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    console.log('Permission to access background location was denied');
    return;
  }

  await Location.startLocationUpdatesAsync('BACKGROUND_LOCATION_TASK', {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5 * 60 * 1000, // 5 minutes
    distanceInterval: 100, // 100 meters
    showsBackgroundLocationIndicator: true,
  });
}

export async function stopBackgroundLocationUpdates() {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync('BACKGROUND_LOCATION_TASK');
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync('BACKGROUND_LOCATION_TASK');
  }
}
