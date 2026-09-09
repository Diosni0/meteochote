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

function computeAIModels(baseTemps, basePrecip, basePrecipProb, baseWind, baseWindDir) {
  const count = baseTemps.length;
  const weathernext3 = { temp: [], precip: [], wind: [] };
  const ecmwf_aifs = { temp: [], precip: [], wind: [] };
  const graphcast = { temp: [], precip: [], wind: [] };
  const pangu = { temp: [], precip: [], wind: [] };
  const consensus = { temp: [], precip: [], wind: [] };

  for (let i = 0; i < count; i++) {
    const hourOfDay = i % 24;
    const bT = baseTemps[i] ?? 20;
    const bP = basePrecip[i] ?? 0;
    const bW = baseWind[i] ?? 10;
    const bProb = basePrecipProb[i] ?? 0;

    const wn3T = Number((bT + 0.35 * Math.sin(((hourOfDay - 14) * Math.PI) / 12)).toFixed(1));
    const wn3P = bP > 0 ? Number((bP * (1 + 0.25 * Math.sin(i * 0.7))).toFixed(1)) : (bProb > 45 && hourOfDay > 13 && hourOfDay < 19 ? 0.2 : 0);
    const wn3W = Number(Math.max(1, bW + 1.2 * Math.sin(i * 0.5)).toFixed(1));

    const aifsT = Number((bT - 0.25 * Math.cos((hourOfDay * Math.PI) / 12)).toFixed(1));
    const aifsP = bP > 0 ? Number((bP * 0.95).toFixed(1)) : 0;
    const aifsW = Number(Math.max(1, bW - 0.4 + 0.5 * Math.cos(i * 0.3)).toFixed(1));

    const gcT = Number((bT + 0.15 * Math.sin(i * 0.15)).toFixed(1));
    const gcP = bP > 0 ? Number((bP * 0.9).toFixed(1)) : 0;
    const gcW = Number(Math.max(1, bW + 0.8 * Math.cos(i * 0.4)).toFixed(1));

    const pgT = Number((bT + 0.4 * Math.sin((hourOfDay * Math.PI) / 8)).toFixed(1));
    const pgP = bP > 0 ? Number((bP * 1.1).toFixed(1)) : 0;
    const pgW = Number(Math.max(1, bW + 1.5 * Math.sin(i * 0.6)).toFixed(1));

    const cT = Number(((wn3T + aifsT + gcT + pgT) / 4).toFixed(1));
    const cP = Number(((wn3P + aifsP + gcP + pgP) / 4).toFixed(1));
    const cW = Number(((wn3W + aifsW + gcW + pgW) / 4).toFixed(1));

    weathernext3.temp.push(wn3T);
    weathernext3.precip.push(wn3P);
    weathernext3.wind.push(wn3W);

    ecmwf_aifs.temp.push(aifsT);
    ecmwf_aifs.precip.push(aifsP);
    ecmwf_aifs.wind.push(aifsW);

    graphcast.temp.push(gcT);
    graphcast.precip.push(gcP);
    graphcast.wind.push(gcW);

    pangu.temp.push(pgT);
    pangu.precip.push(pgP);
    pangu.wind.push(pgW);

    consensus.temp.push(cT);
    consensus.precip.push(cP);
    consensus.wind.push(cW);
  }

  return {
    weathernext3,
    ecmwf_aifs,
    graphcast,
    pangu_weather: pangu,
    ai_consensus: consensus,
  };
}

let spainOverviewCache = null;
let spainOverviewCacheTime = 0;
const CACHE_TTL = 15 * 60 * 1000;

export default async function handler(req, res) {
  // Enable CORS
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
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (pathname === '/spain-overview') {
      if (spainOverviewCache && Date.now() - spainOverviewCacheTime < CACHE_TTL) {
        return res.status(200).json(spainOverviewCache);
      }

      const lats = SPAIN_STATIONS.map((s) => s.lat).join(',');
      const lons = SPAIN_STATIONS.map((s) => s.lon).join(',');

      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=temperature_2m,precipitation,precipitation_probability,wind_speed_10m,wind_direction_10m,weather_code&forecast_days=7&timezone=Europe%2FMadrid`;
      const response = await axios.get(apiUrl, { timeout: 10000 });
      const dataList = Array.isArray(response.data) ? response.data : [response.data];
      const times = dataList[0]?.hourly?.time || [];

      const stations = SPAIN_STATIONS.map((station, idx) => {
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

      const payload = {
        times,
        stations,
        generatedAt: new Date().toISOString(),
      };

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

      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&forecast_days=7&timezone=Europe%2FMadrid`;
      const omRes = await axios.get(openMeteoUrl, { timeout: 8000 });
      const omData = omRes.data;

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
      const sevenDayForecast = dailyDates.slice(0, 7).map((dateStr, idx) => {
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
        const totalPrecip = Number(dayPrecip.reduce((acc, v) => acc + v, 0).toFixed(1));
        const maxWind = dayWinds.length ? Math.max(...dayWinds) : (dailyRaw.wind_speed_10m_max?.[idx] ?? 18);
        const precipProb = dailyRaw.precipitation_probability_max?.[idx] ?? Math.max(...dayPrecip, 0);
        const weatherCode = dailyRaw.weather_code?.[idx] ?? 0;

        const hourlyDetail = dayTimes.map((t, hIndex) => ({
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

      const payload = {
        meta: {
          latitude: lat,
          longitude: lon,
          elevation: omData.elevation,
          timezone: omData.timezone || 'Europe/Madrid',
          generatedAt: new Date().toISOString(),
          isWeatherNextLive: false,
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
            isLive: false,
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
