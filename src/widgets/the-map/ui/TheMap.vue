<script setup lang="ts">
import mapboxgl from 'mapbox-gl';
import { useGeolocation } from '@/src/shared/lib/useGeolocation';

const { coords, startTracking, stopTracking } = useGeolocation();
const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<mapboxgl.Map | null>(null);
const userMarker = shallowRef<mapboxgl.Marker | null>(null);
const { token, style } = useMapboxConfig();

// Следим за изменением координат и двигаем маркер/карту
watch(coords, (newCoords) => {
  if (!newCoords || !map.value) return;

  // Если маркера еще нет — создаем его
  if (!userMarker.value) {
    const el = document.createElement('div');
    el.className = 'custom-user-marker';

    userMarker.value = new mapboxgl.Marker(el)
      .setLngLat([newCoords.lng, newCoords.lat])
      .addTo(map.value);
  } else {
    userMarker.value.setLngLat([newCoords.lng, newCoords.lat]);
  }

  // Плавно перемещаем камеру за игроком
  map.value.flyTo({
    center: [newCoords.lng, newCoords.lat],
    speed: 0.5
  });
});

onMounted(() => {
  if (!mapContainer.value) return;
  mapboxgl.accessToken = token;

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: style,
    center: [19.8335, 45.2671], 
    zoom: 15, 
    pitch: 60
  });

  startTracking();
});

onUnmounted(() => {
  stopTracking();
  map.value?.remove();
});
</script>

<template>
  <div class="the-map">
    <div ref="mapContainer" class="the-map__container" />
    <div class="the-map__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.the-map {
  position: relative;
  width: 100%;
  height: 100vh;

  &__container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  &__content {
    position: relative;
    z-index: $z-ui;
    pointer-events: none; 
    
    & > * {
      pointer-events: auto; 
    }
  }
}
</style>