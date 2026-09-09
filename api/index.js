import axios from 'axios';

// Reference Spanish stations
const SPAIN_STATIONS = [
  { id: 1, name: 'Madrid', admin: 'Comunidad de Madrid', lat: 40.4168, lon: -3.7038 },
  { id: 2, name: 'Barcelona', admin: 'Cataluña', lat: 41.3879, lon: 2.1699 },
  { id: 3, name: 'Valencia', admin: 'C. Valenciana', lat: 39.4699, lon: -0.3763 },
  { id: 4, name: 'Sevilla', admin: 'Andalucía', lat: 37.3891, lon: -5.9845 },
  { id: 5, name: 'Zaragoza', admin: 'Aragón', lat: 41.6488, lon: -0.8891 },
  { id: 6, name: 'Málaga', admin: 'Andalucía', lat: 36.7213, lon: -4.4214 },
  { id: 7, name: 'Bilbao', admin: 'País Vasco', lat: 43.2630, lon: -2.9350 },
  { id: 8, name: 'A Coruña', admin: 'Galicia', lat: 43.3623, lon: -8.4115 },
  { id: 9, name: 'Valladolid', admin: 'Castilla y León', lat: 41.6523, lon: -4.7245 },
  { id: 10, name: 'Palma', admin: 'Baleares', lat: 39.5696, lon: 2.6502 },
  { id: 11, name: 'Las Palmas', admin: 'Canarias', lat: 28.1235, lon: -15.4363 },
  { id: 12, name: 'S.C. Tenerife', admin: 'Canarias', lat: 28.4636, lon: -16.2518 },
  { id: 13, name: 'Badajoz', admin: 'Extremadura', lat: 38.8794, lon: -6.9706 },
  { id: 14, name: 'Murcia', admin: 'Región de Murcia', lat: 37.9922, lon: -1.1307 },
  { id: 15, name: 'Santander', admin: 'Cantabria', lat: 43.4623, lon: -3.8099 },
  { id: 16, name: 'Granada', admin: 'Andalucía', lat: 37.1773, lon: -3.5986 },
  { id: 17, name: 'Toledo', admin: 'Castilla-La Mancha', lat: 39.8628, lon: -4.0273 },
  { id: 18, name: 'Pamplona', admin: 'Navarra', lat: 42.8125, lon: -1.6458 },
  { id: 19, name: 'Oviedo', admin: 'Asturias', lat: 43.3619, lon: -5.8494 },
  { id: 20, name: 'Logroño', admin: 'La Rioja', lat: 42.4627, lon: -2.4450 },
  { id: 21, name: 'Albacete', admin: 'Castilla-La Mancha', lat: 38.9943, lon: -1.8585 },
  { id: 22, name: 'Alicante', admin: 'C. Valenciana', lat: 38.3452, lon: -0.4810 },
  { id: 23, name: 'Almería', admin: 'Andalucía', lat: 36.8381, lon: -2.4597 },
  { id: 24, name: 'Burgos', admin: 'Castilla y León', lat: 42.3440, lon: -3.6969 },
  { id: 25, name: 'Cáceres', admin: 'Extremadura', lat: 39.4753, lon: -6.3723 },
  { id: 26, name: 'Cádiz', admin: 'Andalucía', lat: 36.5271, lon: -6.2886 },
  { id: 27, name: 'Ciudad Real', admin: 'Castilla-La Mancha', lat: 38.9861, lon: -3.9274 },
  { id: 28, name: 'Córdoba', admin: 'Andalucía', lat: 37.8882, lon: -4.7794 },
  { id: 29, name: 'Girona', admin: 'Cataluña', lat: 41.9794, lon: 2.8214 },
  { id: 30, name: 'Huelva', admin: 'Andalucía', lat: 37.2614, lon: -6.9447 },
  { id: 31, name: 'León', admin: 'Castilla y León', lat: 42.5987, lon: -5.5671 },
  { id: 32, name: 'Lleida', admin: 'Cataluña', lat: 41.6176, lon: 0.6200 },
  { id: 33, name: 'Ourense', admin: 'Galicia', lat: 42.3358, lon: -7.8639 },
  { id: 34, name: 'Salamanca', admin: 'Castilla y León', lat: 40.9701, lon: -5.6635 },
  { id: 35, name: 'Donostia', admin: 'País Vasco', lat: 43.3183, lon: -1.9812 },
  { id: 36, name: 'Vigo', admin: 'Galicia', lat: 42.2406, lon: -8.7207 },
  { id: 37, name: 'Menorca', admin: 'Baleares', lat: 39.8885, lon: 4.2658 },
  { id: 38, name: 'Ibiza', admin: 'Baleares', lat: 38.9067, lon: 1.4206 },
  { id: 39, name: 'Lanzarote', admin: 'Canarias', lat: 28.9630, lon: -13.5477 },
];

// Real AI models available on Open-Meteo (free for non-commercial use, no API key):
// - ecmwf_aifs025_single          -> ECMWF AIFS 0.25°
// - ncep_aigfs025                 -> NOAA AIGFS 0.25° (GraphCast-based)
// - google_weathernext2_ensemble  -> Google DeepMind WeatherNext 2 (64-member ensemble, 15 días)
// - meteofrance_arome_france_hd   -> Météo-France AROME HD 1.3 km (referencia de alta resolución)
const AI_MODELS = [
  { id: 'ecmwf_aifs', om: 'ecmwf_aifs025_single', name: 'ECMWF AIFS 0.25°', developer: 'Centro Europeo (ECMWF)', architecture: 'Artificial Intelligence Forecasting System (single run)', badge: 'ECMWF AIFS', color: '#10b981' },
  { id: 'ncep_aigfs', om: 'ncep_aigfs025', name: 'NCEP AIGFS 0.25°', developer: 'NOAA (basado en GraphCast)', architecture: 'AI Global Forecast System (GraphCast-derived)', badge: 'NOAA AIGFS', color: '#8b5cf6' },
  { id: 'google_weathernext2', om: 'google_weathernext2_ensemble', name: 'Google WeatherNext 2', developer: 'Google DeepMind', architecture: 'FGN (ensemble de 64 miembros) · horizonte 15 días', badge: 'Google WN2', color: '#f59e0b' },
  { id: 'arome', om: 'meteofrance_arome_france_hd', name: 'AROME France HD', developer: 'Météo-France', architecture: 'Modelo físico de alta resolución (1.3 km)', badge: 'AROME HD', color: '#ec4899' },
];

// Models rendered on the Spain map (see server/index.js for rationale)
const MAP_MODELS = AI_MODELS.filter((m) => m.id === 'ecmwf_aifs' || m.id === 'ncep_aigfs');

// On /v1/forecast, WeatherNext 2 returns empty arrays (its data only comes from
// the dedicated ensemble endpoint), so it is requested separately below.
const WEATHERNEXT2 = AI_MODELS.find((m) => m.id === 'google_weathernext2');
const FORECAST_MODELS = AI_MODELS.filter((m) => m.id !== 'google_weathernext2');

const MAP_MODELS_PARAM = ['best_match', ...MAP_MODELS.map((m) => m.om)].join(',');
const FORECAST_MODELS_PARAM = ['best_match', ...FORECAST_MODELS.map((m) => m.om)].join(',');
const HOURLY_VARS = 'temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code';
const DAILY_VARS = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max';

const series = (hourly, variable, omModel) => {
  if (!hourly) return [];
  const direct = omModel ? hourly[`${variable}_${omModel}`] : (hourly[variable] ?? hourly[`${variable}_best_match`]);
  return Array.isArray(direct) ? direct : [];
};

const num = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

// Warm-cache across invocations (best effort on serverless)
let spainOverviewCache = null;
let spainOverviewCacheTime = 0;
const CACHE_TTL = 15 * 60 * 1000;
const nowcastCache = new Map();
const NOWCAST_CACHE_TTL = 10 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/^\/api/, '');

  try {
    if (pathname === '/health' || pathname === '') {
      return res.status(200).json({
        status: 'ok',
        models: AI_MODELS.map((m) => ({ id: m.id, name: m.name, source: 'open-meteo' })),
        timestamp: new Date().toISOString(),
      });
    }

    if (pathname === '/spain-overview') {
      if (spainOverviewCache && Date.now() - spainOverviewCacheTime < CACHE_TTL) {
        return res.status(200).json(spainOverviewCache);
      }

      const lats = SPAIN_STATIONS.map((s) => s.lat).join(',');
      const lons = SPAIN_STATIONS.map((s) => s.lon).join(',');

      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=${HOURLY_VARS}&models=${MAP_MODELS_PARAM}&forecast_days=7&timezone=Europe%2FMadrid`;
      const response = await axios.get(apiUrl, { timeout: 15000 });
      const dataList = Array.isArray(response.data) ? response.data : [response.data];
      const times = dataList[0]?.hourly?.time || [];

      const stations = SPAIN_STATIONS.map((station, idx) => {
        const hourly = dataList[idx]?.hourly || {};
        return {
          id: station.id,
          name: station.name,
          admin: station.admin,
          lat: station.lat,
          lon: station.lon,
          weatherCodes: series(hourly, 'weather_code'),
          windDirections: series(hourly, 'wind_direction_10m'),
          models: Object.fromEntries(MAP_MODELS.map((m) => [m.id, {
            temp: series(hourly, 'temperature_2m', m.om),
            precip: series(hourly, 'precipitation', m.om),
            wind: series(hourly, 'wind_speed_10m', m.om),
          }])),
        };
      });

      const payload = { times, stations, generatedAt: new Date().toISOString() };
      spainOverviewCache = payload;
      spainOverviewCacheTime = Date.now();
      return res.status(200).json(payload);
    }

    if (pathname === '/forecast') {
      const lat = parseFloat(url.searchParams.get('lat'));
      const lon = parseFloat(url.searchParams.get('lon'));

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Parámetros lat y lon numéricos requeridos' });
      }

      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${HOURLY_VARS}&daily=${DAILY_VARS}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code&models=${FORECAST_MODELS_PARAM}&forecast_days=7&timezone=Europe%2FMadrid`;
      const omRes = await axios.get(openMeteoUrl, { timeout: 12000 });
      const omData = omRes.data;

      // WeatherNext 2 comes from the dedicated ensemble endpoint (base keys, no suffix)
      let wn2Hourly = {};
      try {
        const ensUrl = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${lat}&longitude=${lon}&hourly=${HOURLY_VARS}&forecast_days=7&models=${WEATHERNEXT2.om}&timezone=Europe%2FMadrid`;
        wn2Hourly = (await axios.get(ensUrl, { timeout: 12000 })).data?.hourly || {};
      } catch (err) {
        console.error('Error fetching WeatherNext 2:', err.message);
      }

      const baseTemp = series(omData.hourly, 'temperature_2m');
      const baseTimes = omData.hourly?.time || [];
      const basePrecip = series(omData.hourly, 'precipitation');
      const baseWind = series(omData.hourly, 'wind_speed_10m');
      const baseCodes = series(omData.hourly, 'weather_code');
      const current = omData.current || {};

      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dailyRaw = omData.daily || {};
      const dailyDates = dailyRaw.time || [];

      const sevenDayForecast = dailyDates.slice(0, 7).map((dateStr, idx) => {
        const dateObj = new Date(dateStr);
        const startH = idx * 24;
        const endH = startH + 24;
        const dayTemps = baseTemp.slice(startH, endH).filter((v) => Number.isFinite(v));

        const hourlyDetail = baseTimes.slice(startH, endH).map((t, hIndex) => ({
          time: t.slice(11, 16),
          temp: num(baseTemp[startH + hIndex], 20),
          precip: num(basePrecip[startH + hIndex], 0),
          wind: num(baseWind[startH + hIndex], 10),
          code: num(baseCodes[startH + hIndex], num(dailyRaw.weather_code?.[idx], 0)),
        }));

        return {
          date: dateStr,
          dayName: dayNames[dateObj.getDay()],
          dayFormatted: `${dateObj.getDate()} de ${dateObj.toLocaleString('es-ES', { month: 'short' })}`,
          isToday: idx === 0,
          tempMax: dayTemps.length ? Math.max(...dayTemps) : num(dailyRaw.temperature_2m_max?.[idx], 25),
          tempMin: dayTemps.length ? Math.min(...dayTemps) : num(dailyRaw.temperature_2m_min?.[idx], 15),
          precipitationSum: Number(basePrecip.slice(startH, endH).filter((v) => Number.isFinite(v)).reduce((acc, v) => acc + v, 0).toFixed(1)),
          precipitationProbability: num(dailyRaw.precipitation_probability_max?.[idx], 0),
          windSpeedMax: num(dailyRaw.wind_speed_10m_max?.[idx], 18),
          weatherCode: num(dailyRaw.weather_code?.[idx], 0),
          hourly: hourlyDetail,
        };
      });

      const payload = {
        meta: {
          latitude: lat,
          longitude: lon,
          elevation: omData.elevation,
          timezone: omData.timezone || 'Europe/Madrid',
          generatedAt: new Date().toISOString(),
        },
        current: {
          temperature: num(current.temperature_2m, 22),
          feelsLike: num(current.apparent_temperature, num(current.temperature_2m, 22)),
          windSpeed: num(current.wind_speed_10m, 12),
          windDirection: num(current.wind_direction_10m, 180),
          precipitation: num(current.precipitation, 0),
          humidity: num(current.relative_humidity_2m, 55),
          weatherCode: num(current.weather_code, 0),
        },
        times: baseTimes,
        models: Object.fromEntries(AI_MODELS.map((m) => {
          const sourceHourly = m.id === WEATHERNEXT2.id ? wn2Hourly : omData.hourly;
          const suffix = m.id === WEATHERNEXT2.id ? undefined : m.om;
          return [m.id, {
            id: m.id,
            name: m.name,
            developer: m.developer,
            architecture: m.architecture,
            badge: m.badge,
            isLive: true,
            color: m.color,
            hourly: {
              temperature: series(sourceHourly, 'temperature_2m', suffix),
              precipitation: series(sourceHourly, 'precipitation', suffix),
              precipitation_probability: [],
              wind_speed: series(sourceHourly, 'wind_speed_10m', suffix),
              wind_direction: series(sourceHourly, 'wind_direction_10m', suffix),
            },
          }];
        })),
        sevenDayForecast,
      };

      return res.status(200).json(payload);
    }

    if (pathname === '/nowcast') {
      const lat = parseFloat(url.searchParams.get('lat'));
      const lon = parseFloat(url.searchParams.get('lon'));

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Parámetros lat y lon numéricos requeridos' });
      }

      const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
      const cached = nowcastCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < NOWCAST_CACHE_TTL) {
        return res.status(200).json(cached.data);
      }

      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation&forecast_minutely_15=120&timezone=Europe%2FMadrid`;
      const omRes = await axios.get(apiUrl, { timeout: 10000 });
      const minutely = omRes.data?.minutely_15 || {};

      const payload = {
        times: Array.isArray(minutely.time) ? minutely.time : [],
        precipitation: Array.isArray(minutely.precipitation) ? minutely.precipitation : [],
        generatedAt: new Date().toISOString(),
      };

      nowcastCache.set(cacheKey, { timestamp: Date.now(), data: payload });
      return res.status(200).json(payload);
    }

    if (pathname === '/search') {
      const q = url.searchParams.get('q');
      if (!q || q.trim().length < 2) {
        return res.status(200).json({ results: [] });
      }

      const searchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=12&language=es&format=json`;
      const response = await axios.get(searchUrl, { timeout: 5000 });
      const rawResults = response.data?.results || [];

      const spainResults = rawResults.filter((item) => item.country_code === 'ES');
      const otherResults = rawResults.filter((item) => item.country_code !== 'ES');

      const formatted = [...spainResults, ...otherResults].map((item) => ({
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

      return res.status(200).json({ results: formatted });
    }

    return res.status(404).json({ error: 'Ruta no encontrada' });
  } catch (error) {
    console.error('API Handler error:', error.message);
    return res.status(500).json({ error: 'Error en el servidor API', details: error.message });
  }
}
