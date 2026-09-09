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
    const modelData = station.models[activeModel];
    if (!modelData) continue;
    const value = modelData[field]?.[hourIndex];
    if (typeof value === 'number' && Number.isFinite(value)) {
      const windSpeed = modelData.wind?.[hourIndex] ?? 0;
      const windDir = station.windDirections?.[hourIndex] ?? 0;
      points.push({
        lat: station.lat,
        lon: station.lon,
        value,
        windDir,
        windSpeed,
      });
    }
  }
  return points;
}, [stations, activeModel, activeVariable, hourIndex]);
