import axios from 'axios';
import { ForecastResponse, LocationItem, NowcastData, SpainOverviewResponse, SpainStation, WeatherModelId } from '../types';
import { currentHourStartIndex } from '../lib/madridTime';
import { buildSevenDayForecast } from '../lib/sevenDayForecast';

const API_BASE = '/api';

// Weather models served by Open-Meteo (free for non-commercial use, no API key):
// - ecmwf_aifs025_single: ECMWF AIFS 0.25° (Artificial Intelligence Forecasting System, single run)
// - ncep_aigfs025: NOAA NCEP AIGFS 0.25° (AI Global Forecast System, GraphCast-based)
// - google_weathernext2_ensemble: Google DeepMind WeatherNext 2 (64-member ensemble, 15 días)
// - meteofrance_arome_france_hd: Météo-France AROME HD 1.3 km (referencia de alta resolución, ~2 días)
export const AI_MODELS: Array<{
  id: WeatherModelId;
  om: string;
  name: string;
  developer: string;
  architecture: string;
  badge: string;
  color: string;
}> = [
  {
    id: 'ecmwf_aifs',
    om: 'ecmwf_aifs025_single',
    name: 'ECMWF AIFS 0.25°',
    developer: 'Centro Europeo (ECMWF)',
    architecture: 'Artificial Intelligence Forecasting System (single run)',
    badge: 'ECMWF AIFS',
    color: '#10b981',
  },
  {
    id: 'ncep_aigfs',
    om: 'ncep_aigfs025',
    name: 'NCEP AIGFS 0.25°',
    developer: 'NOAA (basado en GraphCast)',
    architecture: 'AI Global Forecast System (GraphCast-derived)',
    badge: 'NOAA AIGFS',
    color: '#8b5cf6',
  },
  {
    id: 'google_weathernext2',
    om: 'google_weathernext2_ensemble',
    name: 'Google WeatherNext 2',
    developer: 'Google DeepMind',
    architecture: 'FGN (ensemble de 64 miembros) · horizonte 15 días',
    badge: 'Google WN2',
    color: '#f59e0b',
  },
  {
    id: 'arome',
    om: 'meteofrance_arome_france_hd',
    name: 'AROME France HD',
    developer: 'Météo-France',
    architecture: 'Modelo físico de alta resolución (1.3 km)',
    badge: 'AROME HD',
    color: '#ec4899',
  },
];

// The Spain map serves the four AI models (see server/index.js): AIFS + AIGFS + AROME
// come from /v1/forecast, while WeatherNext 2 only exists on the ensemble endpoint,
// where the response carries all 64 members, so it is fetched in separate chunks
// (only the ensemble-mean base keys are read).
const WEATHERNEXT2 = AI_MODELS.find((m) => m.id === 'google_weathernext2')!;
const FORECAST_MODELS = AI_MODELS.filter((m) => m.id !== 'google_weathernext2');
const FORECAST_MODELS_PARAM = ['best_match', ...FORECAST_MODELS.map((m) => m.om)].join(',');
const WN2_CHUNK_SIZE = 13;
const HOURLY_VARS = 'temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code';
const DAILY_VARS = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max';

// Open-Meteo returns one shared time axis per request. With multiple models each
// variable is suffixed with the model name, e.g. temperature_2m_ecmwf_aifs025_single.
const pickSeries = (hourly: any, variable: string, omModel?: string): number[] => {
  const key = omModel ? `${variable}_${omModel}` : variable;
  const alt = omModel ? `${variable}_best_match` : `${variable}_best_match`;
  const series = hourly?.[key] ?? (omModel ? undefined : hourly?.[alt]);
  return Array.isArray(series) ? series : [];
};

const buildModelSeries = (hourly: any, omModel?: string) => ({
  temperature: pickSeries(hourly, 'temperature_2m', omModel),
  precip: pickSeries(hourly, 'precipitation', omModel),
  wind: pickSeries(hourly, 'wind_speed_10m', omModel),
});

// In-memory cache for the client-side fallback (e.g. static hosting without backend)
let cachedOverview: SpainOverviewResponse | null = null;
let cachedOverviewTime = 0;
const forecastCache = new Map<string, { data: ForecastResponse; time: number }>();
const nowcastCache = new Map<string, { data: NowcastData; time: number }>();
const CACHE_TTL = 15 * 60 * 1000;
const NOWCAST_CACHE_TTL = 10 * 60 * 1000;

const num = (value: any, fallback: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

const sliceAt = <T,>(arr: T[] | undefined, idx: number): T[] => (Array.isArray(arr) ? arr.slice(idx) : []);

// Direct client fallback for single location detailed forecast
export const getForecastDirect = async (lat: number, lon: number): Promise<ForecastResponse> => {
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = forecastCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${HOURLY_VARS}&daily=${DAILY_VARS}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code&models=${FORECAST_MODELS_PARAM}&forecast_days=7&timezone=Europe%2FMadrid`;

  const omRes = await axios.get(openMeteoUrl, { timeout: 12000 });
  const omData = omRes.data;

  // WeatherNext 2 comes from the dedicated ensemble endpoint (base keys, no suffix)
  let wn2Hourly: any = {};
  try {
    const ensUrl = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${lat}&longitude=${lon}&hourly=${HOURLY_VARS}&forecast_days=7&models=${WEATHERNEXT2.om}&timezone=Europe%2FMadrid`;
    wn2Hourly = (await axios.get(ensUrl, { timeout: 12000 })).data?.hourly || {};
  } catch (err) {
    console.error('Error fetching WeatherNext 2:', err);
  }

  // Trim the hourly axis so the forecast begins at the current hour instead
  // of 00:00 of the day (index 0 = "ahora"). All hourly arrays share it.
  const rawTimes: string[] = omData.hourly?.time || [];
  const startIdx = currentHourStartIndex(rawTimes);
  const trim = <T,>(arr: T[] | undefined): T[] => sliceAt(arr, startIdx);

  const baseTimes = trim(rawTimes);
  const baseTemp = trim(pickSeries(omData.hourly, 'temperature_2m'));
  const basePrecip = trim(pickSeries(omData.hourly, 'precipitation'));
  const baseWind = trim(pickSeries(omData.hourly, 'wind_speed_10m'));
  const baseCodes = trim(pickSeries(omData.hourly, 'weather_code'));
  const baseWindDir = trim(pickSeries(omData.hourly, 'wind_direction_10m'));

  const current = omData.current || {};
  const currentTemp = num(current.temperature_2m, 22);

  const models = Object.fromEntries(
    AI_MODELS.map((m) => {
      const sourceHourly = m.id === WEATHERNEXT2.id ? wn2Hourly : omData.hourly;
      const suffix = m.id === WEATHERNEXT2.id ? undefined : m.om;
      const series = buildModelSeries(sourceHourly, suffix as string);
      const windDirection = pickSeries(sourceHourly, 'wind_direction_10m', suffix);
      return [
        m.id,
        {
          id: m.id,
          name: m.name,
          developer: m.developer,
          architecture: m.architecture,
          badge: m.badge,
          isLive: true,
          color: m.color,
          hourly: {
            temperature: trim(series.temperature),
            precipitation: trim(series.precip),
            precipitation_probability: [],
            wind_speed: trim(series.wind),
            wind_direction: windDirection.length ? trim(windDirection) : baseWindDir,
          },
        },
      ];
    })
  ) as Record<WeatherModelId, any>;

  const payload: ForecastResponse = {
    meta: {
      latitude: lat,
      longitude: lon,
      elevation: omData.elevation,
      timezone: omData.timezone || 'Europe/Madrid',
      generatedAt: new Date().toISOString(),
    },
    current: {
      temperature: currentTemp,
      feelsLike: num(current.apparent_temperature, currentTemp),
      windSpeed: num(current.wind_speed_10m, 12),
      windDirection: num(current.wind_direction_10m, 180),
      precipitation: num(current.precipitation, 0),
      humidity: num(current.relative_humidity_2m, 55),
      weatherCode: num(current.weather_code, 0),
    },
    times: baseTimes,
    models,
    sevenDayForecast: buildSevenDayForecast(omData, baseTemp, baseTimes, basePrecip, baseWind, baseCodes),
  };

  forecastCache.set(cacheKey, { data: payload, time: Date.now() });
  return payload;
};

export const getForecast = async (lat: number, lon: number): Promise<ForecastResponse> => {
  try {
    const response = await axios.get(`${API_BASE}/forecast`, {
      params: { lat, lon },
      timeout: 6000,
    });
    if (response.data && response.data.models) {
      return response.data;
    }
  } catch (error) {
    // Backend unavailable -> direct Open-Meteo fallback
  }
  return getForecastDirect(lat, lon);
};

// Direct client fallback for Spain overview
export const getSpainOverviewDirect = async (): Promise<SpainOverviewResponse> => {
  if (cachedOverview && Date.now() - cachedOverviewTime < CACHE_TTL) {
    return cachedOverview;
  }

  const { SPAIN_STATIONS } = await import('./stations');

  const lats = SPAIN_STATIONS.map((s) => s.lat).join(',');
  const lons = SPAIN_STATIONS.map((s) => s.lon).join(',');

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=${HOURLY_VARS}&models=${FORECAST_MODELS_PARAM}&forecast_days=7&timezone=Europe%2FMadrid`;

  const response = await axios.get(url, { timeout: 20000 });
  const dataList = Array.isArray(response.data) ? response.data : [response.data];
  const rawTimes: string[] = dataList[0]?.hourly?.time || [];

  // Trim the hourly axis so the forecast/map begins at the current hour,
  // keeping every per-station array aligned with `times`.
  const startIdx = currentHourStartIndex(rawTimes);
  const times = sliceAt(rawTimes, startIdx);
  const trim = <T,>(arr: T[] | undefined): T[] => sliceAt(arr, startIdx);
  const buildTrimmedSeries = (sourceHourly: any, omModel?: string) => {
    const s = buildModelSeries(sourceHourly, omModel);
    return { temperature: trim(s.temperature), precip: trim(s.precip), wind: trim(s.wind) };
  };

  // WeatherNext 2 via the ensemble endpoint in chunks (each batch response
  // carries all 64 members, so chunking keeps every request small). Only the
  // ensemble-mean base keys are read.
  const wn2ByStation: Record<string, any>[] = SPAIN_STATIONS.map(() => ({}));
  await Promise.all(
    Array.from({ length: Math.ceil(SPAIN_STATIONS.length / WN2_CHUNK_SIZE) }, (_, c) => {
      const slice = SPAIN_STATIONS.slice(c * WN2_CHUNK_SIZE, (c + 1) * WN2_CHUNK_SIZE);
      const ensUrl = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${slice.map((s) => s.lat).join(',')}&longitude=${slice.map((s) => s.lon).join(',')}&hourly=${HOURLY_VARS}&forecast_days=7&models=${WEATHERNEXT2.om}&timezone=Europe%2FMadrid`;
      return axios.get(ensUrl, { timeout: 25000 }).then((ensRes) => {
        const list = Array.isArray(ensRes.data) ? ensRes.data : [ensRes.data];
        list.forEach((d: any, i: number) => { wn2ByStation[c * WN2_CHUNK_SIZE + i] = d?.hourly || {}; });
      });
    })
  ).catch((err) => console.error('Error fetching WeatherNext 2 overview:', err.message));

  const stations: SpainStation[] = SPAIN_STATIONS.map((station, idx) => {
    const item = dataList[idx] || {};
    const hourly = item.hourly || {};
    const wn2Hourly = wn2ByStation[idx] || {};

    return {
      id: station.id,
      name: station.name,
      admin: station.admin,
      lat: station.lat,
      lon: station.lon,
      weatherCodes: trim(pickSeries(hourly, 'weather_code')),
      windDirections: trim(pickSeries(hourly, 'wind_direction_10m')),
      models: Object.fromEntries([
        ...FORECAST_MODELS.map((m) => [m.id, buildTrimmedSeries(hourly, m.om)]),
        [WEATHERNEXT2.id, buildTrimmedSeries(wn2Hourly, undefined)],
      ]) as unknown as SpainStation['models'],
    };
  });

  const payload: SpainOverviewResponse = {
    times,
    stations,
    generatedAt: new Date().toISOString(),
  };

  cachedOverview = payload;
  cachedOverviewTime = Date.now();
  return payload;
};

export const getSpainOverview = async (): Promise<SpainOverviewResponse> => {
  try {
    const response = await axios.get(`${API_BASE}/spain-overview`, { timeout: 6000 });
    if (response.data && response.data.stations?.length) {
      return response.data;
    }
  } catch (error) {
    // Backend unavailable or 404 (static hosting) -> direct Open-Meteo fallback
  }
  return getSpainOverviewDirect();
};

// Direct client fallback for the 15-minute precipitation nowcast (radar/satellite
// extrapolation, refreshed ~5-10 min by Open-Meteo)
export const getNowcastDirect = async (lat: number, lon: number): Promise<NowcastData> => {
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = nowcastCache.get(cacheKey);
  if (cached && Date.now() - cached.time < NOWCAST_CACHE_TTL) {
    return cached.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation&forecast_minutely_15=120&timezone=Europe%2FMadrid`;
  const response = await axios.get(url, { timeout: 10000 });
  const minutely = response.data?.minutely_15 || {};

  const payload: NowcastData = {
    times: Array.isArray(minutely.time) ? minutely.time : [],
    precipitation: Array.isArray(minutely.precipitation) ? minutely.precipitation : [],
    generatedAt: new Date().toISOString(),
  };

  nowcastCache.set(cacheKey, { data: payload, time: Date.now() });
  return payload;
};

export const getNowcast = async (lat: number, lon: number): Promise<NowcastData> => {
  try {
    const response = await axios.get(`${API_BASE}/nowcast`, {
      params: { lat, lon },
      timeout: 6000,
    });
    if (response.data && Array.isArray(response.data.times)) {
      return response.data;
    }
  } catch (error) {
    // Backend unavailable -> direct Open-Meteo fallback
  }
  return getNowcastDirect(lat, lon);
};

// Direct client fallback for location search
export const searchLocationsDirect = async (query: string): Promise<LocationItem[]> => {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=12&language=es&format=json`;
    const response = await axios.get(url, { timeout: 6000 });
    const rawResults = response.data?.results || [];

    const spainResults = rawResults.filter((item: any) => item.country_code === 'ES');
    const otherResults = rawResults.filter((item: any) => item.country_code !== 'ES');

    return [...spainResults, ...otherResults].map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      elevation: item.elevation,
      country: item.country,
      countryCode: item.country_code,
      admin1: item.admin1 || '',
      admin2: item.admin2 || '',
      timezone: item.timezone || 'Europe/Madrid',
    }));
  } catch (err) {
    console.error('Direct geocoding error:', err);
    return [];
  }
};

export const searchLocations = async (query: string): Promise<LocationItem[]> => {
  if (!query || query.trim().length < 2) return [];
  try {
    const response = await axios.get(`${API_BASE}/search`, {
      params: { q: query.trim() },
      timeout: 4000,
    });
    if (response.data?.results?.length) {
      return response.data.results;
    }
  } catch (error) {
    // Backend unavailable or 404 (e.g. on static deployments) -> Fallback directly
  }
  return searchLocationsDirect(query);
};

export const getWeatherDescription = (code: number): { text: string; icon: string } => {
  switch (code) {
    case 0:
      return { text: 'Despejado', icon: '☀️' };
    case 1:
      return { text: 'Mayormente despejado', icon: '🌤️' };
    case 2:
      return { text: 'Parcialmente nublado', icon: '⛅' };
    case 3:
      return { text: 'Nublado', icon: '☁️' };
    case 45:
    case 48:
      return { text: 'Niebla o bruma', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { text: 'Llovizna', icon: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { text: 'Lluvia', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { text: 'Nieve', icon: '🌨️' };
    case 80:
    case 81:
    case 82:
      return { text: 'Chubascos', icon: '🌧️' };
    case 95:
    case 96:
    case 99:
      return { text: 'Tormenta eléctrica', icon: '⛈️' };
    default:
      return { text: 'Variable', icon: '🌥️' };
  }
};
