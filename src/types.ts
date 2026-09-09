export type WeatherModelId =
  | 'ecmwf_aifs'
  | 'ncep_aigfs'
  | 'google_weathernext2'
  | 'arome';

export type WeatherVariable = 'temperature' | 'precipitation' | 'wind_speed';

export interface LocationItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country: string;
  countryCode: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
}

export interface HourlyModelSeries {
  temperature: number[];
  precipitation: number[];
  precipitation_probability: number[];
  wind_speed: number[];
  wind_direction: number[];
}

export interface ModelInfo {
  id: WeatherModelId;
  name: string;
  developer: string;
  architecture: string;
  badge: string;
  isLive: boolean;
  color: string;
  hourly: HourlyModelSeries;
}

export interface HourlyDetailPoint {
  time: string;
  temp: number;
  precip: number;
  wind: number;
  code: number;
}

export interface DayForecast {
  date: string;
  dayName: string;
  dayFormatted: string;
  isToday: boolean;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbability: number;
  windSpeedMax: number;
  weatherCode: number;
  hourly: HourlyDetailPoint[];
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  humidity: number;
  weatherCode: number;
}

export interface ForecastResponse {
  meta: {
    latitude: number;
    longitude: number;
    elevation?: number;
    timezone: string;
    generatedAt: string;
  };
  current: CurrentWeather;
  times: string[];
  models: Record<WeatherModelId, ModelInfo>;
  sevenDayForecast: DayForecast[];
}

export interface StationHourly {
  temp: number[];
  precip: number[];
  wind: number[];
}

export interface SpainStation {
  id: number;
  name: string;
  admin: string;
  lat: number;
  lon: number;
  weatherCodes: number[];
  windDirections?: number[];
  models: Record<WeatherModelId, StationHourly>;
}

export interface HeatmapPoint {
  lat: number;
  lon: number;
  value: number;
  windDir?: number;
  windSpeed?: number;
}

export interface NowcastData {
  times: string[];
  precipitation: number[];
  generatedAt: string;
}

export interface SpainOverviewResponse {
  times: string[];
  stations: SpainStation[];
  generatedAt: string;
}
