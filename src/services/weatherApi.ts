import axios from 'axios';
import { LocationItem, ForecastResponse } from '../types';

const API_BASE = '/api';

export const searchLocations = async (query: string): Promise<LocationItem[]> => {
  if (!query || query.trim().length < 2) return [];
  try {
    const response = await axios.get(`${API_BASE}/search`, {
      params: { q: query.trim() },
    });
    return response.data?.results || [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

export const getForecast = async (lat: number, lon: number): Promise<ForecastResponse> => {
  const response = await axios.get(`${API_BASE}/forecast`, {
    params: { lat, lon },
  });
  return response.data;
};

export const getSpainOverview = async () => {
  const response = await axios.get(`${API_BASE}/spain-overview`);
  return response.data;
};

export const saveGoogleApiKey = async (apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await axios.post(`${API_BASE}/config/google-key`, { apiKey });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al conectar con el servidor',
    };
  }
};

export const checkHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE}/health`);
    return response.data;
  } catch {
    return { status: 'offline', googleApiConfigured: false };
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
