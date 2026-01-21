<script setup lang="ts">
import mapboxgl from 'mapbox-gl';
import { useGeolocation } from '@/src/shared/lib/useGeolocation';
import { useHexgrid } from '@/src/shared/lib/useHexgrid'; // Создай этот файл (код ниже)

const { coords, startTracking, stopTracking } = useGeolocation();
const { getHexId, getHexBoundary } = useHexgrid();

const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<mapboxgl.Map | null>(null);
const userMarker = shallowRef<mapboxgl.Marker | null>(null);
const { token, style } = useMapboxConfig();

const currentHexId = computed(() => 
  coords.value ? getHexId(coords.value.lat, coords.value.lng) : null
);

watch(coords, (newCoords) => {
  if (!newCoords || !map.value) return;

  if (!userMarker.value) {
    const el = document.createElement('div');
    el.className = 'custom-user-marker'; 
    userMarker.value = new mapboxgl.Marker(el)
      .setLngLat([newCoords.lng, newCoords.lat])
      .addTo(map.value);
  } else {
    userMarker.value.setLngLat([newCoords.lng, newCoords.lat]);
  }

  map.value.flyTo({
    center: [newCoords.lng, newCoords.lat],
    speed: 0.5,
    curve: 1,
    essential: true
  });
});

watch(currentHexId, (newHexId) => {
  if (!newHexId || !map.value) return;

  const source = map.value.getSource('current-hex') as mapboxgl.GeoJSONSource;
  if (source) {
    source.setData({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: getHexBoundary(newHexId)
      },
      properties: {}
    });
  }
});

onMounted(() => {
  if (!mapContainer.value) return;
  mapboxgl.accessToken = token;

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: style,
    center: [19.8335, 45.2671], 
    zoom: 16,
    pitch: 60,
    antialias: true
  });

  map.value.on('load', () => {
    if (!map.value) return;

    map.value.addSource('current-hex', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Слой заливки гексагона
    map.value.addLayer({
      id: 'hex-fill',
      type: 'fill',
      source: 'current-hex',
      paint: {
        'fill-color': '#00f2ff',
        'fill-opacity': 0.2
      }
    });

    // Слой светящейся границы
    map.value.addLayer({
      id: 'hex-outline',
      type: 'line',
      source: 'current-hex',
      paint: {
        'line-color': '#00f2ff',
        'line-width': 3,
        'line-blur': 1
      }
    });

    startTracking();
  });
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
      <div v-if="currentHexId" class="hex-info">
        <span class="hex-info__label">ZONE:</span>
        <span class="hex-info__id">{{ currentHexId }}</span>
      </div>
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
    position: absolute;
    inset: 0;
    z-index: $z-ui;
    pointer-events: none;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    
    & > * {
      pointer-events: auto; 
    }
  }
}

.hex-info {
  background: rgba($color-bg, 0.8);
  backdrop-filter: blur(10px);
  border-left: 4px solid $color-primary;
  padding: 12px 20px;
  width: fit-content;
  font-family: monospace;
  
  &__label {
    color: rgba($color-text, 0.5);
    font-size: 10px;
    display: block;
  }
  
  &__id {
    color: $color-primary;
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 1px;
  }
}


</style>