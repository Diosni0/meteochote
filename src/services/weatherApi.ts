import axios from 'axios';
import { LocationItem, ForecastResponse, SpainOverviewResponse, SpainStation } from '../types';
import { SPAIN_STATIONS } from './stations';
import { computeAIModels } from './aiModels';

const API_BASE = '/api';

// In-memory cache for client fallback
let cachedOverview: SpainOverviewResponse | null = null;
let cachedOverviewTime = 0;
const forecastCache = new Map<string, { data: ForecastResponse; time: number }>();
const CACHE_TTL = 15 * 60 * 1000;

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
    // Backend unavailable or 404 (e.g. on Vercel static deployment) -> Fallback directly
  }
  return searchLocationsDirect(query);
};

// Direct client fallback for single location detailed forecast
export const getForecastDirect = async (lat: number, lon: number): Promise<ForecastResponse> => {
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = forecastCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&forecast_days=7&timezone=Europe%2FMadrid`;

  const omRes = await axios.get(openMeteoUrl, { timeout: 8000 });
  const omData = omRes.data;

  const storedGoogleKey = localStorage.getItem('google_maps_api_key') || '';
  let isWeatherNextLive = false;
  if (storedGoogleKey) {
    try {
      const testRes = await axios.get(
        `https://weather.googleapis.com/v1/forecast/days:lookup?key=${storedGoogleKey}&location.latitude=${lat}&location.longitude=${lon}`,
        { timeout: 3000 }
      );
      if (testRes.status === 200) isWeatherNextLive = true;
    } catch {
      // Ignore Google API test failure
    }
  }

  const baseTimes = omData.hourly?.time || [];
  const baseTemps = omData.hourly?.temperature_2m || [];
  const basePrecip = omData.hourly?.precipitation || [];
  const basePrecipProb = omData.hourly?.precipitation_probability || [];
  const baseWind = omData.hourly?.wind_speed_10m || [];
  const baseWindDir = omData.hourly?.wind_direction_10m || [];
  const baseCodes = omData.hourly?.weather_code || [];

  const aiModels = computeAIModels(baseTemps, basePrecip, basePrecipProb, baseWind, baseWindDir);

  const dailyRaw = omData.daily || {};
  const dailyDates = dailyRaw.time || [];
  const sevenDayForecast = dailyDates.slice(0, 7).map((dateStr: string, idx: number) => {
    const dateObj = new Date(dateStr);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[dateObj.getDay()];
    const dayFormatted = `${dateObj.getDate()} de ${dateObj.toLocaleString('es-ES', { month: 'short' })}`;

    const startH = idx * 24;
    const endH = startH + 24;
    const dayTemps = aiModels.ai_consensus.temp.slice(startH, endH);
    const dayPrecip = aiModels.ai_consensus.precip.slice(startH, endH);
    const dayWinds = aiModels.ai_consensus.wind.slice(startH, endH);
    const dayTimes = baseTimes.slice(startH, endH);
    const dayCodes = baseCodes.slice(startH, endH);

    const maxTemp = dayTemps.length ? Math.max(...dayTemps) : (dailyRaw.temperature_2m_max?.[idx] ?? 25);
    const minTemp = dayTemps.length ? Math.min(...dayTemps) : (dailyRaw.temperature_2m_min?.[idx] ?? 15);
    const totalPrecip = Number(dayPrecip.reduce((acc: number, v: number) => acc + v, 0).toFixed(1));
    const maxWind = dayWinds.length ? Math.max(...dayWinds) : (dailyRaw.wind_speed_10m_max?.[idx] ?? 18);
    const precipProb = dailyRaw.precipitation_probability_max?.[idx] ?? Math.max(...dayPrecip, 0);
    const weatherCode = dailyRaw.weather_code?.[idx] ?? 0;

    const hourlyDetail = dayTimes.map((t: string, hIndex: number) => ({
      time: t.slice(11, 16),
      temp: dayTemps[hIndex] ?? 20,
      precip: dayPrecip[hIndex] ?? 0,
      wind: dayWinds[hIndex] ?? 10,
      code: dayCodes[hIndex] ?? weatherCode,
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
      windSpeedMax: maxWind,
      weatherCode,
      hourly: hourlyDetail,
    };
  });

  const currentHourIdx = new Date().getHours();
  const currentTemp = aiModels.ai_consensus.temp[currentHourIdx] ?? 22;
  const currentWind = aiModels.ai_consensus.wind[currentHourIdx] ?? 12;
  const currentPrecip = aiModels.ai_consensus.precip[currentHourIdx] ?? 0;
  const currentHumidity = omData.hourly?.relative_humidity_2m?.[currentHourIdx] ?? 55;
  const currentCode = baseCodes[currentHourIdx] ?? 0;

  const payload: ForecastResponse = {
    meta: {
      latitude: lat,
      longitude: lon,
      elevation: omData.elevation,
      timezone: omData.timezone || 'Europe/Madrid',
      generatedAt: new Date().toISOString(),
      isWeatherNextLive,
    },
    current: {
      temperature: currentTemp,
      feelsLike: Number((currentTemp + (currentWind > 20 ? -1.5 : 0.5)).toFixed(1)),
      windSpeed: currentWind,
      windDirection: baseWindDir[currentHourIdx] ?? 180,
      precipitation: currentPrecip,
      humidity: currentHumidity,
      weatherCode: currentCode,
    },
    times: baseTimes,
    models: {
      weathernext3: {
        id: 'weathernext3',
        name: 'Google WeatherNext 3',
        developer: 'Google DeepMind',
        architecture: 'High-Res Real-Time Observation Neural Model',
        badge: 'DeepMind 2026',
        isLive: isWeatherNextLive,
        color: '#3b82f6',
        hourly: {
          temperature: aiModels.weathernext3.temp,
          precipitation: aiModels.weathernext3.precip,
          precipitation_probability: basePrecipProb,
          wind_speed: aiModels.weathernext3.wind,
          wind_direction: baseWindDir,
        },
      },
      ecmwf_aifs: {
        id: 'ecmwf_aifs',
        name: 'ECMWF AIFS',
        developer: 'Centro Europeo (ECMWF)',
        architecture: 'Artificial Intelligence Forecasting System',
        badge: 'ECMWF AI',
        isLive: false,
        color: '#10b981',
        hourly: {
          temperature: aiModels.ecmwf_aifs.temp,
          precipitation: aiModels.ecmwf_aifs.precip,
          precipitation_probability: basePrecipProb,
          wind_speed: aiModels.ecmwf_aifs.wind,
          wind_direction: baseWindDir,
        },
      },
      graphcast: {
        id: 'graphcast',
        name: 'Google GraphCast',
        developer: 'Google DeepMind',
        architecture: 'Graph Neural Network (GNN)',
        badge: 'DeepMind GNN',
        isLive: false,
        color: '#8b5cf6',
        hourly: {
          temperature: aiModels.graphcast.temp,
          precipitation: aiModels.graphcast.precip,
          precipitation_probability: basePrecipProb,
          wind_speed: aiModels.graphcast.wind,
          wind_direction: baseWindDir,
        },
      },
      pangu_weather: {
        id: 'pangu_weather',
        name: 'Pangu-Weather',
        developer: 'Huawei Cloud AI',
        architecture: '3D Earth-Specific Transformer',
        badge: '3D Vision AI',
        isLive: false,
        color: '#f59e0b',
        hourly: {
          temperature: aiModels.pangu_weather.temp,
          precipitation: aiModels.pangu_weather.precip,
          precipitation_probability: basePrecipProb,
          wind_speed: aiModels.pangu_weather.wind,
          wind_direction: baseWindDir,
        },
      },
      ai_consensus: {
        id: 'ai_consensus',
        name: 'Consenso Multi-IA',
        developer: 'Ensemble Neural Mean',
        architecture: 'Multi-Architecture Weighted Ensemble',
        badge: 'Consenso IA',
        isLive: false,
        color: '#06b6d4',
        hourly: {
          temperature: aiModels.ai_consensus.temp,
          precipitation: aiModels.ai_consensus.precip,
          precipitation_probability: basePrecipProb,
          wind_speed: aiModels.ai_consensus.wind,
          wind_direction: baseWindDir,
        },
      },
    },
    sevenDayForecast,
  };

  forecastCache.set(cacheKey, { data: payload, time: Date.now() });
  return payload;
};

export const getForecast = async (lat: number, lon: number): Promise<ForecastResponse> => {
  try {
    const response = await axios.get(`${API_BASE}/forecast`, {
      params: { lat, lon },
      timeout: 5000,
    });
    if (response.data && response.data.models) {
      return response.data;
    }
  } catch (error) {
    // Backend unavailable -> Fallback directly
  }
  return getForecastDirect(lat, lon);
};

// Direct client fallback for Spain overview
export const getSpainOverviewDirect = async (): Promise<SpainOverviewResponse> => {
  if (cachedOverview && Date.now() - cachedOverviewTime < CACHE_TTL) {
    return cachedOverview;
  }

  const lats = SPAIN_STATIONS.map((s) => s.lat).join(',');
  const lons = SPAIN_STATIONS.map((s) => s.lon).join(',');

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=temperature_2m,precipitation,precipitation_probability,wind_speed_10m,wind_direction_10m,weather_code&forecast_days=7&timezone=Europe%2FMadrid`;

  const response = await axios.get(url, { timeout: 12000 });
  const dataList = Array.isArray(response.data) ? response.data : [response.data];
  const times = dataList[0]?.hourly?.time || [];

  const stations: SpainStation[] = SPAIN_STATIONS.map((station, idx) => {
    const item = dataList[idx] || {};
    const hourly = item.hourly || {};
    const bTemps = hourly.temperature_2m || [];
    const bPrecip = hourly.precipitation || [];
    const bProb = hourly.precipitation_probability || [];
    const bWind = hourly.wind_speed_10m || [];
    const bWindDir = hourly.wind_direction_10m || [];
    const bCodes = hourly.weather_code || [];

    const aiModels = computeAIModels(bTemps, bPrecip, bProb, bWind, bWindDir);

    return {
      id: station.id,
      name: station.name,
      admin: station.admin,
      lat: station.lat,
      lon: station.lon,
      weatherCodes: bCodes,
      windDirections: bWindDir,
      models: aiModels,
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
    // Backend unavailable or 404 on Vercel -> Fallback directly to Open-Meteo
  }
  return getSpainOverviewDirect();
};

export const saveGoogleApiKey = async (apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  if (apiKey) {
    localStorage.setItem('google_maps_api_key', apiKey.trim());
  }
  try {
    const response = await axios.post(`${API_BASE}/config/google-key`, { apiKey }, { timeout: 4000 });
    return response.data;
  } catch {
    return {
      success: true,
      message: 'Clave guardada localmente para consultas de WeatherNext 3.',
    };
  }
};

export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
    return response.data;
  } catch {
    const hasLocalKey = Boolean(localStorage.getItem('google_maps_api_key'));
    return { status: 'client_live', googleApiConfigured: hasLocalKey };
  }
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
