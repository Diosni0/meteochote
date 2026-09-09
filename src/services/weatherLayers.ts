import type { HeatmapPoint, WeatherVariable } from '../types';

type ColorStop = { value: number; color: [number, number, number] };

export const WEATHER_SCALES: Record<WeatherVariable, { label: string; unit: string; stops: ColorStop[] }> = {
  temperature: {
    label: 'Temperatura', unit: '\u00b0C',
    stops: [
      { value: -10, color: [103, 64, 174] },
      { value: 0, color: [61, 109, 216] },
      { value: 10, color: [38, 185, 205] },
      { value: 20, color: [115, 204, 132] },
      { value: 30, color: [250, 208, 87] },
      { value: 40, color: [237, 98, 63] },
      { value: 50, color: [168, 36, 101] },
    ],
  },
  precipitation: {
    label: 'Precipitacion', unit: 'mm / 1 h',
    stops: [
      { value: 0, color: [65, 122, 193] },
      { value: 1, color: [49, 178, 223] },
      { value: 2, color: [55, 199, 156] },
      { value: 5, color: [226, 215, 68] },
      { value: 10, color: [241, 136, 49] },
      { value: 20, color: [215, 53, 87] },
      { value: 40, color: [166, 66, 191] },
    ],
  },
  wind_speed: {
    label: 'Velocidad del viento', unit: 'km/h',
    stops: [
      { value: 0, color: [58, 83, 150] },
      { value: 10, color: [45, 159, 186] },
      { value: 20, color: [82, 198, 164] },
      { value: 40, color: [213, 220, 93] },
      { value: 60, color: [246, 153, 64] },
      { value: 80, color: [224, 73, 91] },
      { value: 100, color: [155, 66, 180] },
    ],
  },
};

// Bounded inverse-distance interpolation: never bridge the mainland and islands,
// or paint distant areas as if there were observations there.
export function interpolateWeather(points: HeatmapPoint[], lat: number, lon: number) {
  let sum = 0;
  let weights = 0;
  let nearest = Infinity;
  const longitudeScale = Math.cos(lat * Math.PI / 180);
  for (const point of points) {
    if (!Number.isFinite(point.value) || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) continue;
    const dx = (lon - point.lon) * longitudeScale * 111.32;
    const dy = (lat - point.lat) * 111.32;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.001) return { value: point.value, coverage: 1 };
    if (distance >= 250) continue;
    nearest = Math.min(nearest, distance);
    const weight = (1 - distance / 250) ** 2 / distance ** 2;
    sum += point.value * weight;
    weights += weight;
  }
  if (!weights) return null;
  return { value: sum / weights, coverage: Math.min(1, (250 - nearest) / 100) };
}

export function weatherColor(variable: WeatherVariable, value: number): [number, number, number, number] {
  const stops = WEATHER_SCALES[variable].stops;
  const clamped = Math.max(stops[0].value, Math.min(stops[stops.length - 1].value, value));
  const upper = stops.findIndex(stop => stop.value >= clamped);
  const start = stops[Math.max(0, upper - 1)];
  const end = stops[upper];
  const fraction = end.value === start.value ? 0 : (clamped - start.value) / (end.value - start.value);
  const rgb = start.color.map((channel, index) => Math.round(channel + (end.color[index] - channel) * fraction));
  // Dry areas remain transparent; small accumulations fade in rather than look like rain everywhere.
  const alpha = variable === 'precipitation' ? Math.min(1, Math.max(0, value) / 0.5) : 1;
  return [rgb[0], rgb[1], rgb[2], Math.round(alpha * 255)];
}
