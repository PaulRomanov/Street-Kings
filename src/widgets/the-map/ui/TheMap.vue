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


import { useUserStore } from '@/src/stores/useUserStore';
import { useZoneStore } from '@/src/stores/useZoneStore';
import { COLORS } from '@/src/shared/config/colors';
import { calculateLiveStorage } from '@/src/shared/lib/useEconomy';

const { allZones, fetchZones, subscribeToZones } = useZones();
const { captureHex, loading: captureLoading } = useCapture();
const { coords, startTracking, stopTracking } = useGeolocation();
const { getHexBoundary, getHexId } = useHexgrid();
const { token, style } = useMapboxConfig();
const user = useSupabaseUser();
const userStore = useUserStore();

const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<mapboxgl.Map | null>(null);
const userMarker = shallowRef<mapboxgl.Marker | null>(null);
const authUserId = ref<string | null>(null);
const showZoneModal = ref(false);
const selectedHexForModal = ref<string | null>(null);
const terminalRef = ref<InstanceType<typeof TerminalLog> | null>(null);

// Тикер для живого обновления IP на карте
const currentTime = ref(Date.now());
let mapTicker: any = null;

onMounted(() => {
  mapTicker = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (mapTicker) clearInterval(mapTicker);
});

const zonesGeoJson = computed(() => ({
  type: 'FeatureCollection' as const,
  features: allZones.value.map(zone => ({
    type: 'Feature' as const,
    id: zone.id,
    geometry: {
      type: 'Polygon' as const,
      coordinates: getHexBoundary(zone.id)
    },
    properties: {
      id: zone.id,
      owner: zone.owner_id,
      color: zone.profiles?.color || COLORS.GRAY,
      username: zone.profiles?.username || 'ANONYMOUS',
      storage: calculateLiveStorage(zone.storage || 0, zone.last_income_at, currentTime.value)
    }
  }))
}));

// Принудительно обновляем данные на карте при изменении GeoJSON (включая тики времени)
watch(zonesGeoJson, (newGeoJson) => {
  if (map.value && map.value.getSource('captured-zones')) {
    (map.value.getSource('captured-zones') as mapboxgl.GeoJSONSource).setData(newGeoJson);
  }
}, { deep: true });

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

watch(coords, (newCoords) => {
  if (newCoords) {
    userStore.currentHexId = getHexId(newCoords.lat, newCoords.lng);
  }
});

const syncUser = async () => {
  const supabase = useSupabaseClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();
  
  if (authUser) {
    authUserId.value = authUser.id;
  } else if (error) {
    console.warn('Auth check info:', error.message);
  }
};

const supabase = useSupabaseClient();

// Следим за статусом захвата и владельцем текущей зоны
watch([() => userStore.currentHexId, allZones], ([hexId, zones]) => {
  const myId = authUserId.value;
  if (!hexId || !myId) {
    userStore.isZoneCapturedByMe = false;
    userStore.currentZoneOwner = null;
    return;
  }
  const zone = zones.find(z => z.id === hexId);
  userStore.currentZoneOwner = zone?.owner_id || null;
  userStore.isZoneCapturedByMe = zone ? String(zone.owner_id) === String(myId) : false;
}, { immediate: true });

const handleCapture = async () => {
  if (!authUserId.value) await syncUser();
  
  if (!authUserId.value || !userStore.currentHexId || !coords.value) {
    console.error('Capture aborted: Missing user, hex or coords');
    return;
  }

  terminalRef.value?.addLog(`Initializing scan for sector ${userStore.currentHexId}...`);

  startAnimation([coords.value.lng, coords.value.lat]);

  if (navigator.vibrate) navigator.vibrate(100); 

  try {
    const result = await captureHex(userStore.currentHexId!);
    
    if (result?.success) {
      await fetchZones();
      terminalRef.value?.addLog(`Sector ${userStore.currentHexId?.substring(0, 8)}... localized.`, 'success');
      terminalRef.value?.addLog(`Domain override complete. Node secured. Total cost: ${result.price} IP`, 'success');
    } else {
      terminalRef.value?.addLog(`Breach failed: ${result?.message || 'insufficient resources'}`, 'error');
    }
  } catch (error) {
    terminalRef.value?.addLog(`Critical system failure during breach.`, 'error');
    console.error('Failed to capture zone:', error);
  }
};

const handleHexClick = (hexId: string) => {
    openZoneModal(hexId);
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

watch(() => userStore.currentHexId, (newHexId) => {
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

    const onMapClick = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
        const feature = e.features?.[0];
        const clickedHexId = feature?.properties?.id || feature?.id?.toString();
        if (clickedHexId) handleHexClick(clickedHexId);
    };

    map.value.on('click', 'captured-fill', onMapClick);
    map.value.on('click', 'neutral-hex-outline', onMapClick);

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
        :currentHexId="userStore.currentHexId"
        :isZoneCapturedByMe="userStore.isZoneCapturedByMe"
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