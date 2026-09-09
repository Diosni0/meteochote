import axios from 'axios';
import { ForecastResponse, LocationItem, NowcastData, SpainOverviewResponse, SpainStation, WeatherModelId } from '../types';

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

// Models rendered on the Spain map (the 39-station overview). WeatherNext 2's 64
// ensemble members and AROME's short lead time make them unsuitable for the map
// batch: WN2 would multiply the response size ~65x per station and AROME covers
// only a few days. They stay available in the per-location comparison instead.
export const MAP_MODELS = AI_MODELS.filter((m) => m.id === 'ecmwf_aifs' || m.id === 'ncep_aigfs');
const MAP_MODELS_PARAM = ['best_match', ...MAP_MODELS.map((m) => m.om)].join(',');

// On /v1/forecast, WeatherNext 2 returns empty arrays (its data only comes from
// the dedicated ensemble endpoint), so it is requested separately below.
const WEATHERNEXT2 = AI_MODELS.find((m) => m.id === 'google_weathernext2')!;
const FORECAST_MODELS = AI_MODELS.filter((m) => m.id !== 'google_weathernext2');
const FORECAST_MODELS_PARAM = ['best_match', ...FORECAST_MODELS.map((m) => m.om)].join(',');
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

const buildModelSeries = (hourly: any, omModel: string) => ({
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

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const buildSevenDayForecast = (omData: any, consensusTemp: number[]) => {
  const dailyRaw = omData.daily || {};
  const dailyDates = dailyRaw.time || [];
  return dailyDates.slice(0, 7).map((dateStr: string, idx: number) => {
    const dateObj = new Date(dateStr);
    const dayName = dayNames[dateObj.getDay()];
    const dayFormatted = `${dateObj.getDate()} de ${dateObj.toLocaleString('es-ES', { month: 'short' })}`;

    const startH = idx * 24;
    const endH = startH + 24;
    // Daily aggregates come from best_match; hourly detail from the active AI models' consensus proxy (best_match)
    const dayTemps = consensusTemp.slice(startH, endH).filter((v) => Number.isFinite(v));
    const dayTimes = (omData.hourly?.time || []).slice(startH, endH);
    const dayCodes = pickSeries(omData.hourly, 'weather_code').slice(startH, endH);
    const dayPrecip = pickSeries(omData.hourly, 'precipitation').slice(startH, endH);

    const maxTemp = dayTemps.length ? Math.max(...dayTemps) : num(dailyRaw.temperature_2m_max?.[idx], 25);
    const minTemp = dayTemps.length ? Math.min(...dayTemps) : num(dailyRaw.temperature_2m_min?.[idx], 15);
    const totalPrecip = Number(dayPrecip.filter((v) => Number.isFinite(v)).reduce((acc: number, v: number) => acc + v, 0).toFixed(1));
    const precipProb = num(dailyRaw.precipitation_probability_max?.[idx], 0);
    const weatherCode = num(dailyRaw.weather_code?.[idx], 0);

    const hourlyDetail = dayTimes.map((t: string, hIndex: number) => ({
      time: t.slice(11, 16),
      temp: num(consensusTemp[startH + hIndex], 20),
      precip: num(dayPrecip[hIndex], 0),
      wind: num(pickSeries(omData.hourly, 'wind_speed_10m')[startH + hIndex], 10),
      code: num(dayCodes[hIndex], weatherCode),
    }));

    return {
      date: dateStr,
      dayName,
      dayFormatted,
      isToday: idx === 0,
      tempMax: maxTemp,
      tempMin: minTemp,
      precipitationSum: totalPrecip,
      precipitationProbability: precipProb,
      windSpeedMax: num(dailyRaw.wind_speed_10m_max?.[idx], 18),
      weatherCode,
      hourly: hourlyDetail,
    };
  });
};

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

  const baseTemp = pickSeries(omData.hourly, 'temperature_2m');
  const baseWindDir = pickSeries(omData.hourly, 'wind_direction_10m');

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
            temperature: series.temperature,
            precipitation: series.precip,
            precipitation_probability: [],
            wind_speed: series.wind,
            wind_direction: windDirection.length ? windDirection : baseWindDir,
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
    times: omData.hourly?.time || [],
    models,
    sevenDayForecast: buildSevenDayForecast(omData, baseTemp),
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

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=${HOURLY_VARS}&models=${MAP_MODELS_PARAM}&forecast_days=7&timezone=Europe%2FMadrid`;

  const response = await axios.get(url, { timeout: 15000 });
  const dataList = Array.isArray(response.data) ? response.data : [response.data];
  const times: string[] = dataList[0]?.hourly?.time || [];

  const stations: SpainStation[] = SPAIN_STATIONS.map((station, idx) => {
    const item = dataList[idx] || {};
    const hourly = item.hourly || {};

    return {
      id: station.id,
      name: station.name,
      admin: station.admin,
      lat: station.lat,
      lon: station.lon,
      weatherCodes: pickSeries(hourly, 'weather_code'),
      windDirections: pickSeries(hourly, 'wind_direction_10m'),
      models: Object.fromEntries(
        MAP_MODELS.map((m) => [m.id, buildModelSeries(hourly, m.om)])
      ) as unknown as SpainStation['models'],
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
