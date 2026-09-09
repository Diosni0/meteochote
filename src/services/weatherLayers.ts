import type { HeatmapPoint, WeatherVariable } from '../types';

export type ColorStop = { value: number; color: [number, number, number] };

export const WEATHER_SCALES: Record<WeatherVariable, { label: string; unit: string; stops: ColorStop[] }> = {
  temperature: {
    label: 'Temperatura',
    unit: '°C',
    stops: [
      { value: -10, color: [103, 64, 174] },   // Violeta frío
      { value: 0, color: [61, 109, 216] },     // Azul invierno
      { value: 10, color: [38, 185, 205] },    // Turquesa suave
      { value: 20, color: [115, 204, 132] },   // Verde templado
      { value: 30, color: [250, 208, 87] },    // Amarillo cálido
      { value: 40, color: [237, 98, 63] },     // Naranja intenso
      { value: 50, color: [168, 36, 101] },    // Magenta extremo
    ],
  },
  precipitation: {
    label: 'Precipitación',
    unit: 'mm / 1 h',
    stops: [
      { value: 0, color: [65, 122, 193] },     // Azul cielo base
      { value: 1, color: [49, 178, 223] },     // Celeste lluvia ligera
      { value: 2, color: [55, 199, 156] },     // Verde esmeralda
      { value: 5, color: [226, 215, 68] },     // Amarillo moderado
      { value: 10, color: [241, 136, 49] },    // Naranja fuerte
      { value: 20, color: [215, 53, 87] },     // Rojo intenso
      { value: 40, color: [166, 66, 191] },    // Púrpura torrencial
    ],
  },
  wind_speed: {
    label: 'Velocidad del viento',
    unit: 'km/h',
    stops: [
      { value: 0, color: [58, 83, 150] },      // Azul calmo
      { value: 10, color: [45, 159, 186] },    // Turquesa brisa suave
      { value: 20, color: [82, 198, 164] },    // Menta brisa moderada
      { value: 40, color: [213, 220, 93] },    // Amarillo viento fresco
      { value: 60, color: [246, 153, 64] },    // Naranja temporal
      { value: 80, color: [224, 73, 91] },     // Rojo vendaval
      { value: 100, color: [155, 66, 180] },   // Violeta temporal duro
    ],
  },
};

const MAX_INTERPOLATION_RADIUS_KM = 300;

// Bounded inverse-distance interpolation: blends smoothly across the mainland and islands
// without creating artifacts over long oceanic gaps.
export function interpolateWeather(points: HeatmapPoint[], lat: number, lon: number) {
  let sum = 0;
  let weights = 0;
  let nearest = Infinity;
  const longitudeScale = Math.cos((lat * Math.PI) / 180);

  for (const point of points) {
    if (!Number.isFinite(point.value) || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) continue;
    const dx = (lon - point.lon) * longitudeScale * 111.32;
    const dy = (lat - point.lat) * 111.32;
    const distance = Math.hypot(dx, dy);

    if (distance < 0.001) return { value: point.value, coverage: 1 };
    if (distance >= MAX_INTERPOLATION_RADIUS_KM) continue;

    nearest = Math.min(nearest, distance);
    const weight = ((MAX_INTERPOLATION_RADIUS_KM - distance) / MAX_INTERPOLATION_RADIUS_KM) ** 2 / (distance ** 2 + 1e-4);
    sum += point.value * weight;
    weights += weight;
  }

  if (!weights) return null;
  const coverage = Math.min(1, Math.max(0, (MAX_INTERPOLATION_RADIUS_KM - nearest) / 100));
  return { value: sum / weights, coverage };
}

// Vector wind interpolation for particle streamlines (u: west-to-east, v: south-to-north)
export function interpolateWindVector(points: HeatmapPoint[], lat: number, lon: number) {
  let sumU = 0;
  let sumV = 0;
  let weights = 0;
  let nearest = Infinity;
  const longitudeScale = Math.cos((lat * Math.PI) / 180);

  for (const point of points) {
    const speed = point.windSpeed ?? point.value;
    const dir = point.windDir ?? 0;
    if (!Number.isFinite(speed) || !Number.isFinite(dir) || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) continue;

    const dx = (lon - point.lon) * longitudeScale * 111.32;
    const dy = (lat - point.lat) * 111.32;
    const distance = Math.hypot(dx, dy);

    if (distance >= MAX_INTERPOLATION_RADIUS_KM) continue;
    nearest = Math.min(nearest, distance);

    // Convert meteorological direction (angle from which wind blows) to cartesian vector (where it flows)
    const rad = (dir * Math.PI) / 180;
    const u = -speed * Math.sin(rad);
    const v = -speed * Math.cos(rad);

    const weight = ((MAX_INTERPOLATION_RADIUS_KM - distance) / MAX_INTERPOLATION_RADIUS_KM) ** 2 / (distance ** 2 + 1e-4);
    sumU += u * weight;
    sumV += v * weight;
    weights += weight;
  }

  if (!weights) return null;
  const avgU = sumU / weights;
  const avgV = sumV / weights;
  const speed = Math.hypot(avgU, avgV);
  let direction = (Math.atan2(-avgU, -avgV) * 180) / Math.PI;
  if (direction < 0) direction += 360;

  const coverage = Math.min(1, Math.max(0, (MAX_INTERPOLATION_RADIUS_KM - nearest) / 100));
  return { u: avgU, v: avgV, speed, direction, coverage };
}

export function weatherColor(variable: WeatherVariable, value: number): [number, number, number, number] {
  const stops = WEATHER_SCALES[variable].stops;
  const clamped = Math.max(stops[0].value, Math.min(stops[stops.length - 1].value, value));
  const upper = stops.findIndex((stop) => stop.value >= clamped);
  const start = stops[Math.max(0, upper - 1)];
  const end = stops[upper];
  const fraction = end.value === start.value ? 0 : (clamped - start.value) / (end.value - start.value);
  const rgb = start.color.map((channel, index) => Math.round(channel + (end.color[index] - channel) * fraction));

  // Dry areas remain transparent; small accumulations fade in smoothly rather than looking like rain everywhere
  const alpha = variable === 'precipitation' ? Math.min(1, Math.max(0, value) / 0.5) : 1;
  return [rgb[0], rgb[1], rgb[2], Math.round(alpha * 255)];
}
