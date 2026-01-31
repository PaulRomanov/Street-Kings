import mapboxgl from 'mapbox-gl';
import { useHexgrid } from '@/src/shared/lib/useHexgrid';
import { useZones } from '@/src/entities/zone/model/useZones';
import { COLORS } from '@/src/shared/config/colors';
import { createPattern } from '@/src/shared/lib/patternGenerator';

export const useMapLayers = (map: Ref<mapboxgl.Map | null>, initialZonesGeoJson: Ref<any>) => {
  const { getHexBoundary, getVisibleHexIds } = useHexgrid();
  const { allZones } = useZones();
  
  const neutralHexGeoJson = ref({ type: 'FeatureCollection', features: [] });

  // Helper to generate patterns on canvas to avoid SVG issues
  // Implementation moved to @/src/shared/lib/patternGenerator

  const initLayers = () => {
    if (!map.value) return;
    
    // Generate and add patterns directly
    const patterns = ['stripes', 'dots', 'grid', 'horizontal', 'diamonds', 'waves', 'dashed'];
    patterns.forEach(pattern => {
       if (!map.value!.hasImage(pattern)) {
           const imageData = createPattern(pattern);
           if (imageData) {
             map.value!.addImage(pattern, imageData);
           }
       }
    });

    // --- SOURCES ---
    // Текущий сектор игрока
    if (!map.value.getSource('current-hex')) {
        map.value.addSource('current-hex', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
    }

    // Захваченные зоны (всегда Res 9)
    if (!map.value.getSource('captured-zones')) {
      map.value.addSource('captured-zones', {
        type: 'geojson',
        data: initialZonesGeoJson.value
      });
    }

    // Нейтральные зоны (динамический Res)
    if (!map.value.getSource('neutral-hexes')) {
      map.value.addSource('neutral-hexes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
    }

    // --- LAYERS ---
    if (!map.value.getLayer('captured-fill')) {
      map.value.addLayer({
        id: 'captured-fill',
        type: 'fill',
        source: 'captured-zones',
        paint: {
          'fill-color': ['get', 'color'], 
          'fill-opacity': 0.6,
          'fill-outline-color': COLORS.WHITE
        }
      });
    }

    if (!map.value.getLayer('captured-pattern')) {
      map.value.addLayer({
        id: 'captured-pattern',
        type: 'fill',
        source: 'captured-zones',
        paint: {
          'fill-pattern': ['get', 'pattern'], 
          'fill-opacity': 0.3
        }
      });
    }

    if (!map.value.getLayer('hex-outline')) {
      map.value.addLayer({
        id: 'hex-outline',
        type: 'line',
        source: 'current-hex',
        paint: {
          'line-color': COLORS.PRIMARY,
          'line-width': 3
        }
      });
    }

    if (!map.value.getLayer('neutral-hex-outline')) {
      map.value.addLayer({
        id: 'neutral-hex-outline',
        type: 'line',
        source: 'neutral-hexes',
        paint: {
          'line-color': COLORS.PRIMARY,
          'line-width': 1,
          'line-dasharray': [2, 2],
          'line-opacity': 0.4
        }
      });
    }

    if (!map.value.getLayer('captured-names')) {
      map.value.addLayer({
        id: 'captured-names',
        type: 'symbol',
        source: 'captured-zones',
        layout: {
          'text-field': [
            'concat',
            ['get', 'username'],
            '\n',
            ['get', 'storage'],
            ' IP'
          ],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-anchor': 'center',
          'text-line-height': 1.2,
          'text-allow-overlap': false
        },
        paint: {
          'text-color': COLORS.WHITE,
          'text-halo-color': COLORS.BLACK,
          'text-halo-width': 1
        }
      });
    }
  };



  const updateNeutralLayer = () => {
    if (!map.value) return;
  
    const zoom = map.value.getZoom();
    const source = map.value.getSource('neutral-hexes') as mapboxgl.GeoJSONSource;
    
    if (!source) return;
  
    const visibleHexIds = getVisibleHexIds(map.value, zoom);
  
    if (visibleHexIds.length === 0) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
  
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
  
    source.setData({
      type: 'FeatureCollection',
      features: features
    } as any);
  };

  return { initLayers, updateNeutralLayer, neutralHexGeoJson };
};

