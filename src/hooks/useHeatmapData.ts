import { useMemo } from 'react';
import { HeatmapPoint, SpainStation, WeatherModelId, WeatherVariable } from '../types';

export const useHeatmapData = (
  stations: SpainStation[],
  activeModel: WeatherModelId,
  activeVariable: WeatherVariable,
  hourIndex: number
) => useMemo(() => {
  const points: HeatmapPoint[] = [];
  const field = activeVariable === 'temperature' ? 'temp' : activeVariable === 'precipitation' ? 'precip' : 'wind';
  for (const station of stations) {
    const value = station.models[activeModel]?.[field][hourIndex];
    if (typeof value === 'number' && Number.isFinite(value)) {
      points.push({ lat: station.lat, lon: station.lon, value });
    }
  }
  return points;
}, [stations, activeModel, activeVariable, hourIndex]);
