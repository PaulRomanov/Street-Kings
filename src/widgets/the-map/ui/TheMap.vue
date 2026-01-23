<script setup lang="ts">
import mapboxgl from 'mapbox-gl';
import { useGeolocation } from '@/src/shared/lib/useGeolocation';
import { useHexgrid } from '@/src/shared/lib/useHexgrid';
import { useCapture } from '@/src/features/capture-zone/model/useCapture';
import { useZones } from '@/src/entities/zone/model/useZones'
import ColorPicker from '@/src/widgets/user-profile/ui/ColorPicker.vue';
import ZoneInfoModal from '@/src/widgets/zone-info/ui/ZoneInfoModal.vue';
import TerminalLog from '@/src/widgets/terminal/ui/TerminalLog.vue';

const { allZones, fetchZones, subscribeToZones } = useZones()
const { captureHex, loading: captureLoading } = useCapture();
const { coords, startTracking, stopTracking } = useGeolocation();
const { getHexBoundary, getVisibleHexIds, getHexId } = useHexgrid();
const { token, style } = useMapboxConfig();
const user = useSupabaseUser();

const mapContainer = ref<HTMLElement | null>(null);
const map = shallowRef<mapboxgl.Map | null>(null);
const userMarker = shallowRef<mapboxgl.Marker | null>(null);
const authUserId = ref<string | null>(null);
const captureAnimationData = ref<{
  center: [number, number] | null;
  radius: number;
  opacity: number;
} | null>(null);
const showZoneModal = ref(false);
const selectedHexForModal = ref<string | null>(null);
const terminalRef = ref<InstanceType<typeof TerminalLog> | null>(null);

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
}))

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
  const zones = allZones.value;

  if (!hexId || zones.length === 0 || !myId) return false;
  
  const zone = zones.find(z => z.id === hexId);
  
  if (zone) {
    const isOwner = String(zone.owner_id) === String(myId);
    return isOwner;
  }
  return false;
});

const handleCapture = async () => {
  if (!authUserId.value) {
    await syncUser();
  }
  
  if (!authUserId.value || !currentHexId.value || !coords.value) {
    console.error('Capture aborted: Missing user, hex or coords');
    return;
  }

  terminalRef.value?.addLog(`Initializing scan for sector ${currentHexId.value}...`);

  captureAnimationData.value = {
    center: [coords.value.lng, coords.value.lat],
    radius: 0,
    opacity: 1
  };

  animateCaptureWave(); 

  if (navigator.vibrate) {
    navigator.vibrate(100); 
  }

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
  captureAnimationData.value = null;
};

const updateNeutralLayer = () => {
  if (!map.value) return;

  const zoom = map.value.getZoom();
  const source = map.value.getSource('neutral-hexes') as mapboxgl.GeoJSONSource;
  
  if (!source) return;

  // 1. Получаем ID гексагонов. 
  // Хук useHexgrid сам вернет [], если zoom < 14, так что лишние проверки не нужны.
  const visibleHexIds = getVisibleHexIds(map.value, zoom);

  // 2. Если гексагонов нет (зум мал или ошибка), очищаем слой и выходим
  if (visibleHexIds.length === 0) {
    source.setData({ type: 'FeatureCollection', features: [] });
    return;
  }

  // 3. Оптимизированная фильтрация захваченных зон
  const capturedHexIds = new Set(allZones.value.map(z => z.id));
  
  const features = visibleHexIds
    .filter(id => !capturedHexIds.has(id))
    .map(hexId => ({
      type: 'Feature',
      id: hexId,
      geometry: {
        type: 'Polygon',
        coordinates: getHexBoundary(hexId)
      },
      properties: {
        resolution: 9 
      }
    }));

  // 4. Обновляем данные на карте
  source.setData({
    type: 'FeatureCollection',
    features: features
  } as any);

  console.log(`[GRID DEBUG]: Zoom: ${zoom.toFixed(2)} | Visible: ${visibleHexIds.length} | Neutral: ${features.length}`);
};

const onColorUpdated = async () => {
  await fetchZones();
  updateNeutralLayer();
};

const animateCaptureWave = () => {
  if (!map.value || !captureAnimationData.value) return;

  captureAnimationData.value.radius += 8; 
  captureAnimationData.value.opacity -= 0.02; 

  if (captureAnimationData.value.opacity <= 0) {
    captureAnimationData.value = null;
    const source = map.value.getSource('capture-animation') as mapboxgl.GeoJSONSource;
    if (source) source.setData({ type: 'FeatureCollection', features: [] });
    return;
  }

  const source = map.value.getSource('capture-animation') as mapboxgl.GeoJSONSource;
  if (source) {
    source.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: captureAnimationData.value.center
        },
        properties: {
          radius: captureAnimationData.value.radius,
          opacity: captureAnimationData.value.opacity
        }
      }]
    });
  }

  requestAnimationFrame(animateCaptureWave);
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
  if (!map.value) return
  const source = map.value.getSource('captured-zones') as mapboxgl.GeoJSONSource
  if (source) source.setData(newGeoJson)
}, { deep: true })

onMounted(async () => {
  // 1. Сначала синхронизируем пользователя
  await syncUser();
  
  if (!mapContainer.value) return;
  mapboxgl.accessToken = token;

  // 2. Инициализация карты
  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: style,
    center: [19.8335, 45.2671], 
    zoom: 16,
    pitch: 60,
    antialias: true
  });

  // 3. Настройка после загрузки стилей
  map.value.on('load', async () => {
    if (!map.value) return;

    // --- ИСТОЧНИКИ ДАННЫХ (SOURCES) ---
    
    // Текущий сектор игрока
    map.value.addSource('current-hex', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Захват данных и подписки
    await fetchZones();
    subscribeToZones();
    startTracking();

    // Захваченные зоны (всегда Res 9)
    map.value.addSource('captured-zones', {
      type: 'geojson',
      data: zonesGeoJson.value
    });

    // Нейтральные зоны (динамический Res)
    map.value.addSource('neutral-hexes', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Анимация захвата
    map.value.addSource('capture-animation', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // --- СЛОИ (LAYERS) ---

    map.value.addLayer({
      id: 'captured-fill',
      type: 'fill',
      source: 'captured-zones',
      paint: {
        'fill-color': ['get', 'color'], 
        'fill-opacity': 0.6,
        'fill-outline-color': '#ffffff'
      }
    });

    map.value.addLayer({
      id: 'hex-outline',
      type: 'line',
      source: 'current-hex',
      paint: {
        'line-color': '#00f2ff',
        'line-width': 3
      }
    });

    map.value.addLayer({
      id: 'neutral-hex-outline',
      type: 'line',
      source: 'neutral-hexes',
      paint: {
        'line-color': '#00f2ff',
        'line-width': 1,
        'line-dasharray': [2, 2],
        'line-opacity': 0.4
      }
    });

    map.value.addLayer({
      id: 'capture-wave',
      type: 'circle',
      source: 'capture-animation',
      paint: {
        'circle-color': '#00f2ff',
        'circle-radius': ['get', 'radius'],
        'circle-opacity': ['get', 'opacity'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // --- ЛОГИКА ОБНОВЛЕНИЯ (DEBOUNCE) ---

    let timer: any = null;
    const debouncedUpdate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        updateNeutralLayer();
      }, 150); // Небольшая задержка, чтобы H3 не считал на каждом кадре зума
    };

    // Слушаем окончание движения и зума
    map.value.on('moveend', debouncedUpdate);
    map.value.on('zoomend', debouncedUpdate);

    // --- ИНТЕРАКТИВ ---

    map.value.on('click', 'captured-fill', (e) => {
      const clickedHexId = e.features?.[0]?.id?.toString();
      if (clickedHexId) openZoneModal(clickedHexId);
    });

    map.value.on('click', 'neutral-hex-outline', (e) => {
      const clickedHexId = e.features?.[0]?.id?.toString();
      if (clickedHexId) openZoneModal(clickedHexId);
    });

    map.value.on('mouseenter', ['captured-fill', 'neutral-hex-outline'], () => {
      map.value!.getCanvas().style.cursor = 'pointer';
    });
    
    map.value.on('mouseleave', ['captured-fill', 'neutral-hex-outline'], () => {
      map.value!.getCanvas().style.cursor = '';
    });

    // Первый запуск отрисовки
    updateNeutralLayer();
    requestAnimationFrame(animateCaptureWave);
  });
});

onUnmounted(() => {
  stopTracking();
  map.value?.remove();
});

</script>

<template>
  <div class="the-map">
    <TerminalLog ref="terminalRef" />
    <div ref="mapContainer" class="the-map__container" />
    
    <div v-if="user" class="the-map__content">
      <div v-if="currentHexId" class="hex-info">
        <span class="hex-info__label">CURRENT SECTOR</span>
        <span class="hex-info__id">{{ currentHexId }}</span>
        
        <div class="zone-status" :class="{ 'zone-status--captured': isZoneCapturedByMe }">
          {{ isZoneCapturedByMe ? 'AREA CONTROLLED' : 'NEUTRAL TERRITORY' }}
        </div>
      </div>

      <div v-if="user" class="actions-panel">
        <ColorPicker @colorChanged="onColorUpdated" />

        <button 
          v-if="currentHexId"
          class="capture-btn"
          :class="{ 'capture-btn--owner': isZoneCapturedByMe }"
          :disabled="captureLoading || isZoneCapturedByMe" 
          @click="handleCapture"
        >
          <template v-if="captureLoading">
            <span>SCANNING...</span>
          </template>
          <template v-else-if="isZoneCapturedByMe">
            <span>● SECTOR SECURED</span>
          </template>
          <template v-else>
            <span>CAPTURE ZONE</span>
          </template>
        </button>
      </div>
      
      <slot />
    </div>
    <ZoneInfoModal 
      :hexId="selectedHexForModal" 
      :isVisible="showZoneModal" 
      @close="closeZoneModal" 
    />
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

.actions-panel {
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.capture-btn {
  background: $color-primary;
  color: $color-bg;
  border: none;
  padding: 16px 40px;
  font-weight: 900;
  letter-spacing: 2px;
  clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 0 20px rgba($color-primary, 0.4);

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba($color-primary, 0.6);
  }

  &:disabled {
    opacity: 0.5;
    background: #666;
  }

  &--owner {
    background: rgba($color-primary, 0.1) !important;
    border: 1px solid $color-primary !important;
    color: $color-primary !important;
    box-shadow: inset 0 0 15px rgba($color-primary, 0.2);
    cursor: default;
    clip-path: none;
  }
}

.zone-status {
  margin-top: 8px;
  font-size: 11px;
  font-weight: bold;
  color: rgba($color-text, 0.4);
  text-transform: uppercase;

  &--captured {
    color: $color-primary;
    text-shadow: 0 0 8px rgba($color-primary, 0.5);
    
    &::before {
      content: '● ';
      animation: blink 1s infinite;
    }
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

</style>