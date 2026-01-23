import mapboxgl from 'mapbox-gl';
import { COLORS } from '@/src/shared/config/colors';

export const useZoneCapture = (map: Ref<mapboxgl.Map | null>) => {
  const captureAnimationData = ref<{
    center: [number, number] | null;
    radius: number;
    opacity: number;
  } | null>(null);

  const initCaptureLayer = () => {
    if (!map.value) return;

    if (!map.value.getSource('capture-animation')) {
      map.value.addSource('capture-animation', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
    }

    if (!map.value.getLayer('capture-wave')) {
      map.value.addLayer({
        id: 'capture-wave',
        type: 'circle',
        source: 'capture-animation',
        paint: {
          'circle-color': COLORS.PRIMARY,
          'circle-radius': ['get', 'radius'],
          'circle-opacity': ['get', 'opacity'],
          'circle-stroke-width': 2,
          'circle-stroke-color': COLORS.WHITE
        }
      });
    }
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

  const startAnimation = (center: [number, number]) => {
    captureAnimationData.value = {
        center,
        radius: 0,
        opacity: 1
      };
      animateCaptureWave();
  };

  return { initCaptureLayer, startAnimation };
};
