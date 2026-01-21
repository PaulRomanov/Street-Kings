import { latLngToCell, cellToBoundary } from 'h3-js';

export const useHexgrid = () => {
  // Уровень детализации (9 — примерно 170 метров между центрами гексагонов)
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

  return { getHexId, getHexBoundary, RESOLUTION };
};