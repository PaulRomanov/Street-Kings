import * as h3 from 'h3-js';
import { latLngToCell, cellToBoundary, gridDisk } from 'h3-js';

export const useHexgrid = () => {
  const GRID_CONFIG = {
    MIN_ZOOM: 14.0,     
    RESOLUTION: 9,    
    DISK_RADIUS: 12   
  };

  const getVisibleHexIds = (map: mapboxgl.Map, zoom: number): string[] => {
    if (!map || zoom < GRID_CONFIG.MIN_ZOOM) return [];
    
    try {
      const center = map.getCenter();
      
      const centerHex = h3.latLngToCell(center.lat, center.lng, GRID_CONFIG.RESOLUTION);

      return h3.gridDisk(centerHex, GRID_CONFIG.DISK_RADIUS);
    } catch (e) {
      console.error('[GRID ERROR]:', e);
      return [];
    }
  };

  const getHexId = (lat: number, lng: number): string => {
    return h3.latLngToCell(lat, lng, GRID_CONFIG.RESOLUTION); // Всегда 9
  }

  return {
    getVisibleHexIds,
    getHexId,
    getHexBoundary: (hexId: string) => {
      const boundary = h3.cellToBoundary(hexId);
      const lngLat = boundary.map(([lat, lng]) => [lng, lat]);
      lngLat.push(lngLat[0]);
      return [lngLat];
    },
    GRID_MIN_ZOOM: GRID_CONFIG.MIN_ZOOM 
  };
};