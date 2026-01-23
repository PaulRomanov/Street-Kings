import { latLngToCell, cellToBoundary, gridDisk } from 'h3-js';

export const useHexgrid = () => {
  const RESOLUTION = 9; 

  const getHexId = (lat: number, lng: number) => {
    return latLngToCell(lat, lng, RESOLUTION);
  };

  const getHexBoundary = (hexId: string) => {
    const boundary = cellToBoundary(hexId);
    const lngLatBoundary = boundary.map(([lat, lng]) => [lng, lat]);
    lngLatBoundary.push(lngLatBoundary[0]); 
    return [lngLatBoundary];
  };

  const getVisibleHexIds = (map: mapboxgl.Map, zoom: number): string[] => {
    if (!map) return [];
  
    try {
      const center = map.getCenter();
      const res = getResolutionFromZoom(zoom);
      
      // Используем уже импортированную в начале файла функцию latLngToCell
      const centerHex = latLngToCell(center.lat, center.lng, res);
      
      // Используем уже импортированную функцию gridDisk
      // Радиус 12 гексагонов покроет весь экран на зуме 16
      return gridDisk(centerHex, 12); 
    } catch (e) {
      console.warn('H3 Grid Disk error:', e);
      return [];
    }
  };

  const getResolutionFromZoom = (zoom: number): number => {
    if (!zoom && zoom !== 0) return 9;
    const z = Math.round(zoom);
    if (z >= 15) return 9;
    if (z >= 13) return 8;
    return 7;
  };

  return { getHexId, getHexBoundary, getVisibleHexIds, getResolutionFromZoom, RESOLUTION };
};