<script setup lang="ts">
import mapboxgl from 'mapbox-gl';
import { useGeolocation } from '@/src/shared/lib/useGeolocation';
import { useHexgrid } from '@/src/shared/lib/useHexgrid';
import { useMapboxConfig } from '@/src/shared/api/mapbox/config'
import { useCapture } from '@/src/features/capture-zone/model/useCapture';
import { useZones } from '@/src/entities/zone/model/useZones';
import ZoneInfoModal from '@/src/widgets/zone-info/ui/ZoneInfoModal.vue';
import TerminalLog from '@/src/widgets/terminal/ui/TerminalLog.vue';
import MapOverlay from './MapOverlay.vue';
import { useMapLayers } from '../model/useMapLayers';
import { useZoneCapture } from '../model/useZoneCapture';


const { allZones, fetchZones, subscribeToZones } = useZones();
const { captureHex, loading: captureLoading } = useCapture();
const { coords, startTracking, stopTracking } = useGeolocation();
const { getHexBoundary, getHexId } = useHexgrid();
const { token, style } = useMapboxConfig();
const user = useSupabaseUser();

const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<mapboxgl.Map | null>(null);
const userMarker = shallowRef<mapboxgl.Marker | null>(null);
const authUserId = ref<string | null>(null);
const showZoneModal = ref(false);
const selectedHexForModal = ref<string | null>(null);
const terminalRef = ref<InstanceType<typeof TerminalLog> | null>(null);

const zonesGeoJson = computed(() => ({
  type: 'FeatureCollection',
  features: allZones.value.map(zone => ({
    type: 'Feature',
    id: zone.id,
    geometry: {
      type: 'Polygon',
      coordinates: getHexBoundary(zone.id)
    },
    properties: {
      owner: zone.owner_id,
      color: zone.profiles?.color || '#808080'
    }
  }))
}));

const { initLayers, updateNeutralLayer, neutralHexGeoJson } = useMapLayers(map, zonesGeoJson);
const { initCaptureLayer, startAnimation } = useZoneCapture(map);

const openZoneModal = (hexId: string) => {
  selectedHexForModal.value = hexId;
  showZoneModal.value = true;
};

const closeZoneModal = () => {
  showZoneModal.value = false;
  selectedHexForModal.value = null;
};

const currentHexId = computed(() => 
  coords.value ? getHexId(coords.value.lat, coords.value.lng) : null
);

const syncUser = async () => {
  const supabase = useSupabaseClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();
  
  if (authUser) {
    authUserId.value = authUser.id;
  } else if (error) {
    console.warn('Auth check info:', error.message);
  }
};

const isZoneCapturedByMe = computed(() => {
  const myId = authUserId.value;
  const hexId = currentHexId.value;
  
  if (!hexId || !myId) return false;
  
  const zone = allZones.value.find(z => z.id === hexId);
  return zone ? String(zone.owner_id) === String(myId) : false;
});

const handleCapture = async () => {
  if (!authUserId.value) await syncUser();
  
  if (!authUserId.value || !currentHexId.value || !coords.value) {
    console.error('Capture aborted: Missing user, hex or coords');
    return;
  }

  terminalRef.value?.addLog(`Initializing scan for sector ${currentHexId.value}...`);

  startAnimation([coords.value.lng, coords.value.lat]);

  if (navigator.vibrate) navigator.vibrate(100); 

  try {
    await captureHex(currentHexId.value);
    await fetchZones();
    
    terminalRef.value?.addLog(`Sector ${currentHexId.value.substring(0, 8)}... localized.`, 'success');
    terminalRef.value?.addLog(`Domain override complete. Node secured.`, 'success');

    console.log(`Sector ${currentHexId.value} captured successfully!`);
  } catch (error) {
    terminalRef.value?.addLog(`Breach failed: security protocol active.`, 'error');
    console.error('Failed to capture zone:', error);
  }
};

const onColorUpdated = async () => {
  await fetchZones();
  updateNeutralLayer();
};

watch(allZones, () => {
  updateNeutralLayer();
}, { deep: true });

watch(user, async (newUser) => {
  if (process.client && newUser) {
    await syncUser();
    fetchZones();
  }
}, { immediate: true });

watch(user, (val) => {
  if (val) {
    terminalRef.value?.addLog(`User linked: ${val.email?.split('@')[0]}`, 'success');
  }
});

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

watch(zonesGeoJson, (newGeoJson) => {
  if (!map.value) return;
  const source = map.value.getSource('captured-zones') as mapboxgl.GeoJSONSource;
  if (source) source.setData(newGeoJson);
}, { deep: true });


onMounted(async () => {
  await syncUser();
  
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

  map.value.on('load', async () => {
    if (!map.value) return;

    await fetchZones();
    subscribeToZones();
    startTracking();
    initLayers();
    initCaptureLayer();

    let timer: any = null;
    const debouncedUpdate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        updateNeutralLayer();
      }, 150);
    };

    map.value.on('moveend', debouncedUpdate);
    map.value.on('zoomend', debouncedUpdate);
    
    map.value.on('zoomend', () => {
      const zoom = map.value?.getZoom().toFixed(1);
    });

    const handleHexClick = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
        const clickedHexId = e.features?.[0]?.id?.toString();
        if (clickedHexId) openZoneModal(clickedHexId);
    };

    map.value.on('click', 'captured-fill', handleHexClick);
    map.value.on('click', 'neutral-hex-outline', handleHexClick);

    const setPointer = () => { if (map.value) map.value.getCanvas().style.cursor = 'pointer'; };
    const resetPointer = () => { if (map.value) map.value.getCanvas().style.cursor = ''; };

    map.value.on('mouseenter', ['captured-fill', 'neutral-hex-outline'], setPointer);
    map.value.on('mouseleave', ['captured-fill', 'neutral-hex-outline'], resetPointer);

    updateNeutralLayer();
  });
});

onUnmounted(() => {
  stopTracking();
  map.value?.remove();
});
</script>

<template>
  <ClientOnly>
    <div class="the-map">
      <TerminalLog ref="terminalRef" />
      <div ref="mapContainer" class="the-map__container" />
      
      <MapOverlay
        :user="user"
        :currentHexId="currentHexId"
        :isZoneCapturedByMe="isZoneCapturedByMe"
        :captureLoading="captureLoading"
        @colorUpdated="onColorUpdated"
        @capture="handleCapture"
      >
        <slot />
      </MapOverlay>

      <ZoneInfoModal 
        :hexId="selectedHexForModal" 
        :isVisible="showZoneModal" 
        @close="closeZoneModal" 
      />
    </div>
  </ClientOnly>
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
}
</style>