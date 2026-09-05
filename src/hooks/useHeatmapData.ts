import { useMemo } from 'react';
import { SpainStation, WeatherModelId, WeatherVariable } from '../types';

/**
 * Interpolate weather data from stations to a grid for heatmap rendering
 */
export const useHeatmapData = (
  stations: SpainStation[],
  activeModel: WeatherModelId,
  activeVariable: WeatherVariable,
  hourIndex: number
) => {
  return useMemo(() => {
    if (!stations.length) return [];

    // Get the bounds of all stations
    const lats = stations.map(s => s.lat);
    const lons = stations.map(s => s.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Convert lat/lon to pixel coordinates for heatmap
    // Use Spain's approximate bounds: 36°N to 44°N, -10°W to 4°E
    const spainBounds = {
      minLat: 35.5,
      maxLat: 44.5,
      minLon: -10.0,
      maxLon: 5.0,
    };

    // Generate a grid of points covering Spain
    const gridPoints: Array<{ x: number; y: number; value: number }> = [];
    
    // Resolution: 1 point every ~25km (roughly 0.25 degrees)
    const step = 0.25;
    
    for (let lat = spainBounds.minLat; lat <= spainBounds.maxLat; lat += step) {
      for (let lon = spainBounds.minLon; lon <= spainBounds.maxLon; lon += step) {
        // Find nearest stations and interpolate
        const value = interpolateValue(stations, activeModel, activeVariable, hourIndex, lat, lon);
        
        // Convert to heatmap coordinates (0-1 normalized)
        const x = (lon - spainBounds.minLon) / (spainBounds.maxLon - spainBounds.minLon);
        const y = 1 - (lat - spainBounds.minLat) / (spainBounds.maxLat - spainBounds.minLat);
        
        gridPoints.push({ x, y, value });
      }
    }

    return gridPoints;
  }, [stations, activeModel, activeVariable, hourIndex]);
};

/**
 * Simple inverse distance weighting interpolation
 */
const interpolateValue = (
  stations: SpainStation[],
  activeModel: WeatherModelId,
  activeVariable: WeatherVariable,
  hourIndex: number,
  targetLat: number,
  targetLon: number
): number => {
  let sum = 0;
  let weightSum = 0;
  let foundData = false;

  stations.forEach(station => {
    const modelData = station.models[activeModel] || station.models.weathernext3;
    let value = 0;
    let weight = 0;

    if (activeVariable === 'temperature') {
      value = modelData.temp[hourIndex] ?? 20;
    } else if (activeVariable === 'precipitation') {
      value = modelData.precip[hourIndex] ?? 0;
    } else {
      value = modelData.wind[hourIndex] ?? 10;
    }

    // Calculate distance (simplified Euclidean for small area)
    const dist = Math.sqrt(
      Math.pow(targetLat - station.lat, 2) +
      Math.pow(targetLon - station.lon, 2)
    );

    // Weight by inverse distance squared
    if (dist < 0.1) {
      weight = 1 / (dist * dist);
      sum += value * weight;
      weightSum += weight;
      foundData = true;
    }
  });

  return foundData ? sum / weightSum : 0;
};
