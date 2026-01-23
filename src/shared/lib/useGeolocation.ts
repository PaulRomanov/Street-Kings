export const useGeolocation = () => {
  const coords = ref<{ lng: number; lat: number } | null>(null);
  const error = ref<string | null>(null);
  let watcher: number | null = null;

  const startTracking = () => {
    if (!process.client || !navigator.geolocation) {
      error.value = 'Геолокация не поддерживается вашим браузером';
      return;
    }

    watcher = navigator.geolocation.watchPosition(
      (position) => {
        coords.value = {
          lng: position.coords.longitude,
          lat: position.coords.latitude
        };
      },
      (err) => {
        error.value = err.message;
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const stopTracking = () => {
    if (watcher !== null) {
      navigator.geolocation.clearWatch(watcher);
    }
  };

  return { coords, error, startTracking, stopTracking };
};