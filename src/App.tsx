import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { WeatherMap } from './components/WeatherMap';
import { ForecastDrawer } from './components/ForecastDrawer';
import { TimelineBar } from './components/TimelineBar';
import { ModelInfoModal } from './components/ModelInfoModal';
import { SettingsModal } from './components/SettingsModal';
import { getForecast, getSpainOverview, checkHealth } from './services/weatherApi';
import {
  LocationItem,
  ForecastResponse,
  SpainStation,
  WeatherModelId,
  WeatherVariable,
} from './types';
import {
  Thermometer,
  CloudRain,
  Wind,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';

const DEFAULT_LOCATION: LocationItem = {
  id: 1,
  name: 'Madrid',
  latitude: 40.4168,
  longitude: -3.7038,
  admin1: 'Comunidad de Madrid',
  country: 'España',
  countryCode: 'ES',
};

export const App: React.FC = () => {
  // State
  const [currentLocation, setCurrentLocation] = useState<LocationItem>(DEFAULT_LOCATION);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [spainStations, setSpainStations] = useState<SpainStation[]>([]);
  const [timelineTimes, setTimelineTimes] = useState<string[]>([]);
  const [currentHourIndex, setCurrentHourIndex] = useState<number>(0);
  const [activeModel, setActiveModel] = useState<WeatherModelId>('weathernext3');
  const [activeVariable, setActiveVariable] = useState<WeatherVariable>('temperature');

  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true); // Open with initial location
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isWeatherNextLive, setIsWeatherNextLive] = useState<boolean>(false);
  
  // Capa control state
  const [layerVisibility, setLayerVisibility] = useState<Record<WeatherVariable, boolean>>({
    temperature: true,
    precipitation: true,
    wind_speed: true,
  });
  const [showLayerControl, setShowLayerControl] = useState(false);

  // Load Spain overview on mount
  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await getSpainOverview();
        if (data.stations) setSpainStations(data.stations);
        if (data.times) setTimelineTimes(data.times);
      } catch (err) {
        console.error('Error loading Spain overview:', err);
      }
    };

    const loadHealth = async () => {
      const h = await checkHealth();
      setIsWeatherNextLive(Boolean(h.googleApiConfigured));
    };

    loadOverview();
    loadHealth();
  }, []);

  // Fetch forecast for currently selected point
  const fetchForecast = async (loc: LocationItem) => {
    setLoadingForecast(true);
    try {
      const data = await getForecast(loc.latitude, loc.longitude);
      setForecastData(data);
      setIsWeatherNextLive(data.meta.isWeatherNextLive);
      if (!timelineTimes.length && data.times) {
        setTimelineTimes(data.times);
      }
    } catch (err) {
      console.error('Error loading forecast:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  useEffect(() => {
    fetchForecast(currentLocation);
  }, [currentLocation]);

  // Handle station click on the map
  const handleSelectStation = (station: SpainStation) => {
    const newLoc: LocationItem = {
      id: station.id,
      name: station.name,
      latitude: station.lat,
      longitude: station.lon,
      admin1: station.admin,
      country: 'España',
      countryCode: 'ES',
    };
    setCurrentLocation(newLoc);
    setIsDrawerOpen(true);
  };

  // Handle map click anywhere
  const handleSelectCoords = (lat: number, lon: number, name?: string) => {
    const newLoc: LocationItem = {
      id: Math.random(),
      name: name || `Coordenadas (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
      latitude: lat,
      longitude: lon,
      country: 'España',
      countryCode: 'ES',
    };
    setCurrentLocation(newLoc);
    setIsDrawerOpen(true);
  };

  const toggleLayer = (variable: WeatherVariable) => {
    setLayerVisibility(prev => ({
      ...prev,
      [variable]: !prev[variable],
    }));
  };

  const toggleAllLayers = () => {
    const allVisible = Object.values(layerVisibility).every(v => v);
    setLayerVisibility({
      temperature: !allVisible,
      precipitation: !allVisible,
      wind_speed: !allVisible,
    });
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none relative">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 right-20 w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
        isWeatherNextLive={isWeatherNextLive}
      />

      {/* Floating Control Bar over the Map */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Floating Top Nav (Variables + Models + Search + Layer Control) */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
          {/* Left: Weather Variable Selectors */}
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-1.5">
            <button
              onClick={() => setActiveVariable('temperature')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeVariable === 'temperature'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temperatura</span>
            </button>

            <button
              onClick={() => setActiveVariable('precipitation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeVariable === 'precipitation'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Lluvia</span>
            </button>

            <button
              onClick={() => setActiveVariable('wind_speed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeVariable === 'wind_speed'
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30 ring-2 ring-teal-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Viento</span>
            </button>

            {/* Layer Toggle Button */}
            <button
              onClick={() => setShowLayerControl(!showLayerControl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                showLayerControl
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Capas</span>
            </button>
          </div>

          {/* Layer Control Panel (visible on toggle) */}
          {showLayerControl && (
            <div className="absolute top-16 left-4 z-[1001] w-[320px] pointer-events-auto">
              <div className="bg-slate-900/98 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/80 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Capas Meteorológicas
                  </h3>
                  <button
                    onClick={toggleAllLayers}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {Object.values(layerVisibility).every(v => v) ? 'Ocultar todo' : 'Mostrar todo'}
                  </button>
                </div>
                
                <div className="space-y-2">
                  {[
                    { 
                      id: 'temperature', 
                      label: 'Temperatura', 
                      color: 'bg-rose-500',
                      icon: Thermometer,
                      visible: layerVisibility.temperature
                    },
                    { 
                      id: 'precipitation', 
                      label: 'Precipitación', 
                      color: 'bg-blue-600',
                      icon: CloudRain,
                      visible: layerVisibility.precipitation
                    },
                    { 
                      id: 'wind_speed', 
                      label: 'Viento', 
                      color: 'bg-teal-500',
                      icon: Wind,
                      visible: layerVisibility.wind_speed
                    }
                  ].map((layer) => {
                    const Icon = layer.icon;
                    return (
                      <button
                        key={layer.id}
                        onClick={() => toggleLayer(layer.id as WeatherVariable)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                          layer.visible
                            ? 'bg-slate-800 border-slate-600/60'
                            : 'bg-slate-900 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${layer.color}`} />
                          <span className="text-xs font-semibold text-slate-200">{layer.label}</span>
                        </div>
                        {layer.visible ? (
                          <Eye className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Center: Municipal Search Bar */}
          <div className="pointer-events-auto w-full md:w-96">
            <SearchBar
              onSelectLocation={(loc) => {
                setCurrentLocation(loc);
                setIsDrawerOpen(true);
              }}
              currentLocationName={currentLocation.name}
            />
          </div>

          {/* Right: AI Model Quick Selector */}
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline">Modelo:</span>
            </span>

            {[
              { id: 'weathernext3', label: 'WeatherNext 3', color: '#3b82f6' },
              { id: 'ecmwf_aifs', label: 'AIFS', color: '#10b981' },
              { id: 'graphcast', label: 'GraphCast', color: '#8b5cf6' },
              { id: 'pangu_weather', label: 'Pangu', color: '#f59e0b' },
              { id: 'ai_consensus', label: 'Consenso', color: '#06b6d4' },
            ].map((m) => {
              const isSelected = activeModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModel(m.id as WeatherModelId)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The Main Interactive Map */}
        <WeatherMap
          stations={spainStations}
          activeModel={activeModel}
          activeVariable={activeVariable}
          hourIndex={currentHourIndex}
          currentLocation={currentLocation}
          layerVisibility={layerVisibility}
          onSelectStation={handleSelectStation}
          onSelectCoords={handleSelectCoords}
        />

        {/* Timeline Slider (Bottom Center) */}
        <TimelineBar
          times={timelineTimes}
          currentIndex={currentHourIndex}
          onIndexChange={(idx) => setCurrentHourIndex(idx)}
        />

        {/* Floating Forecast Drawer (Right Side) */}
        <ForecastDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          location={currentLocation}
          forecastData={forecastData}
          loading={loadingForecast}
          activeModel={activeModel}
          onSelectModel={(m) => setActiveModel(m)}
        />

        {/* Reopen Drawer Pill (if closed) */}
        {!isDrawerOpen && (
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="absolute top-24 right-4 z-[1000] bg-slate-900/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl text-xs font-bold text-white hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Previsión 7 Días ({currentLocation.name})</span>
          </button>
        )}
      </div>

      {/* Modals */}
      <ModelInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isWeatherNextLive={isWeatherNextLive}
        onApiKeySaved={() => {
          checkHealth().then((h) => setIsWeatherNextLive(Boolean(h.googleApiConfigured)));
          fetchForecast(currentLocation);
        }}
      />
    </div>
  );
};

export default App;
