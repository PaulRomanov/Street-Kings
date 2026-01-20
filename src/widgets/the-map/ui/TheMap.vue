<script setup lang="ts">
import mapboxgl from 'mapbox-gl';


const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<mapboxgl.Map | null>(null);
const { token, style } = useMapboxConfig();

onMounted(() => {
  if (!mapContainer.value) return;

  mapboxgl.accessToken = token;

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: style,
    center: [27.5615, 53.9045], // Центр (например, Минск)
    zoom: 12,
    pitch: 45
  });

  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right');
});


onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
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