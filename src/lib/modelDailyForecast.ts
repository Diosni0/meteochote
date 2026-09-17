import type { HourlyDetailPoint, HourlyModelSeries } from '../types.ts';

// Daily cards built from a single model's hourly series, so the forecast card
// follows the active AI model instead of always showing the best-match blend.
// Days beyond a model's horizon (e.g. AROME after ~48 h) are flagged with
// hasData: false instead of inventing values.

export interface ModelDayForecast {
  date: string;
  dayName: string;
  dayFormatted: string;
  isToday: boolean;
  tempMax: number | null;
  tempMin: number | null;
  precipitationSum: number;
  windSpeedMax: number | null;
  weatherCode: number | null;
  hourly: HourlyDetailPoint[];
  hasData: boolean;
}

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

// Dominant condition of the day (most frequent code; ties go to midday hours).
const dominantCode = (codes: number[]): number | null => {
  if (!codes.length) return null;
  const counts = new Map<number, number>();
  for (const code of codes) counts.set(code, (counts.get(code) ?? 0) + 1);
  let best = codes[Math.floor(codes.length / 2)];
  let bestCount = -1;
  for (const [code, count] of counts) {
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  }
  return best;
};

export const buildModelDailyForecast = (
  times: string[],
  hourly: HourlyModelSeries | undefined,
  maxDays = 7
): ModelDayForecast[] => {
  if (!hourly || !Array.isArray(times) || !times.length) return [];

  // Group hour indices by calendar date, preserving chronological order.
  const byDate = new Map<string, number[]>();
  times.forEach((t, i) => {
    const date = t.slice(0, 10);
    const list = byDate.get(date);
    if (list) list.push(i);
    else byDate.set(date, [i]);
  });

  return [...byDate.keys()].slice(0, maxDays).map((dateStr, dayIdx) => {
    const idxs = byDate.get(dateStr) ?? [];
    const dateObj = new Date(dateStr);

    const temps = idxs.map((i) => hourly.temperature[i]).filter(isFiniteNumber);
    const precips = idxs.map((i) => hourly.precipitation[i]).filter(isFiniteNumber);
    const winds = idxs.map((i) => hourly.wind_speed[i]).filter(isFiniteNumber);
    const codes = idxs
      .map((i) => (Array.isArray(hourly.weather_code) ? hourly.weather_code[i] : undefined))
      .filter(isFiniteNumber);

    const hasData = temps.length > 0;

    const hourlyDetail: HourlyDetailPoint[] = hasData
      ? idxs.map((i) => ({
          time: times[i].slice(11, 16),
          temp: isFiniteNumber(hourly.temperature[i]) ? hourly.temperature[i] : 0,
          precip: isFiniteNumber(hourly.precipitation[i]) ? hourly.precipitation[i] : 0,
          wind: isFiniteNumber(hourly.wind_speed[i]) ? hourly.wind_speed[i] : 0,
          // -1 renders as "Variable" (getWeatherDescription default), matching
          // the day header fallback when a model provides no condition codes.
          code: isFiniteNumber(hourly.weather_code?.[i]) ? (hourly.weather_code as number[])[i] : -1,
        }))
      : [];

    return {
      date: dateStr,
      dayName: dayNames[dateObj.getDay()],
      dayFormatted: `${dateObj.getDate()} de ${dateObj.toLocaleString('es-ES', { month: 'short' })}`,
      isToday: dayIdx === 0,
      tempMax: hasData ? Math.max(...temps) : null,
      tempMin: hasData ? Math.min(...temps) : null,
      precipitationSum: Number(precips.reduce((a, b) => a + b, 0).toFixed(1)),
      windSpeedMax: winds.length ? Math.max(...winds) : null,
      weatherCode: dominantCode(codes),
      hourly: hourlyDetail,
      hasData,
    };
  });
};