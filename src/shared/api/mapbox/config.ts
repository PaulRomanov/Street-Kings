export const useMapboxConfig = () => {
  const config = useRuntimeConfig();
  return {
    token: config.public.mapboxToken as string,
    style: 'mapbox://styles/mapbox/dark-v11', // Позже заменим на кастомный стиль
  };
};