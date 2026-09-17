import type { HeatmapPoint, WeatherVariable } from '../../types';
import { interpolateWeather, weatherColor } from '../../services/weatherLayers';

// Precomputed RGBA field raster. Instead of running a 39-station IDW for every
// pixel of every map tile (the old approach), the whole interpolated field is
// painted once into a small geographic raster and tiles then sample it with a
// cheap bilinear read. Rebuilt only when (model, variable, hour) changes.

export interface FieldRaster {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  bounds: { south: number; north: number; west: number; east: number };
}

interface Region {
  south: number;
  north: number;
  west: number;
  east: number;
}

// Padded well beyond the reference stations (the interpolation radius is 300 km)
// so the coverage fade-out is preserved. Two regions keep the empty ocean gap
// between the mainland and the Canaries from wasting raster resolution.
const REGIONS: Region[] = [
  { south: 33.0, north: 46.8, west: -13.0, east: 7.8 },
  { south: 25.3, north: 31.2, west: -20.2, east: -10.8 },
];

// ~22 km per cell: the 39-point, 300 km-radius IDW field carries no detail
// finer than ~50 km, so a coarse grid plus bilinear sampling is visually
// identical while staying cheap enough to rebuild in a few milliseconds.
const DEGREES_PER_PIXEL = 0.2;

const buildRegion = (region: Region, points: readonly HeatmapPoint[], variable: WeatherVariable): FieldRaster => {
  const dLon = (region.east - region.west) / Math.max(1, Math.round((region.east - region.west) / DEGREES_PER_PIXEL));
  const dLat = (region.north - region.south) / Math.max(1, Math.round((region.north - region.south) / DEGREES_PER_PIXEL));
  const width = Math.max(2, Math.round((region.east - region.west) / dLon));
  const height = Math.max(2, Math.round((region.north - region.south) / dLat));
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    const lat = region.north - (y + 0.5) * dLat;
    for (let x = 0; x < width; x++) {
      const lon = region.west + (x + 0.5) * dLon;
      const sample = interpolateWeather(points, lat, lon);
      if (!sample) continue;
      const color = weatherColor(variable, sample.value);
      const index = (y * width + x) * 4;
      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = Math.round(color[3] * sample.coverage);
    }
  }

  return { width, height, data, bounds: region };
};

// Bilinear sample into `out` ([r, g, b, a]). Returns false when the point falls
// outside this raster (fully transparent there anyway).
export const sampleField = (raster: FieldRaster, lat: number, lng: number, out: number[]): boolean => {
  const { bounds, width, height, data } = raster;
  if (lat < bounds.south || lat > bounds.north || lng < bounds.west || lng > bounds.east) return false;

  const fx = ((lng - bounds.west) / (bounds.east - bounds.west)) * width - 0.5;
  const fy = ((bounds.north - lat) / (bounds.north - bounds.south)) * height - 0.5;

  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;

  const x0c = x0 < 0 ? 0 : x0 > width - 1 ? width - 1 : x0;
  const x1c = x0 + 1 < 0 ? 0 : x0 + 1 > width - 1 ? width - 1 : x0 + 1;
  const y0c = y0 < 0 ? 0 : y0 > height - 1 ? height - 1 : y0;
  const y1c = y0 + 1 < 0 ? 0 : y0 + 1 > height - 1 ? height - 1 : y0 + 1;

  const row0 = y0c * width;
  const row1 = y1c * width;
  const i00 = (row0 + x0c) * 4;
  const i10 = (row0 + x1c) * 4;
  const i01 = (row1 + x0c) * 4;
  const i11 = (row1 + x1c) * 4;

  const w00 = (1 - tx) * (1 - ty);
  const w10 = tx * (1 - ty);
  const w01 = (1 - tx) * ty;
  const w11 = tx * ty;

  out[0] = data[i00] * w00 + data[i10] * w10 + data[i01] * w01 + data[i11] * w11;
  out[1] = data[i00 + 1] * w00 + data[i10 + 1] * w10 + data[i01 + 1] * w01 + data[i11 + 1] * w11;
  out[2] = data[i00 + 2] * w00 + data[i10 + 2] * w10 + data[i01 + 2] * w01 + data[i11 + 2] * w11;
  out[3] = data[i00 + 3] * w00 + data[i10 + 3] * w10 + data[i01 + 3] * w01 + data[i11 + 3] * w11;
  return true;
};

// Small LRU so scrubbing the timeline back and forth (and autoplay loops)
// rarely pays the rebuild cost twice.
const MAX_CACHED = 12;
const cache = new Map<string, FieldRaster[]>();

export const getFieldRasters = (
  key: string,
  points: readonly HeatmapPoint[],
  variable: WeatherVariable
): FieldRaster[] => {
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const rasters = REGIONS.map((region) => buildRegion(region, points, variable));
  cache.set(key, rasters);
  if (cache.size > MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return rasters;
};