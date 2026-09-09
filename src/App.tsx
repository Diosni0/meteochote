import React, { useState, useEffect } from 'react';
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
  Calendar,
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
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isWeatherNextLive, setIsWeatherNextLive] = useState<boolean>(false);
  
  // Map overlay controls
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.65);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showLayerControl, setShowLayerControl] = useState(false);

  // Load Spain overview on mount
  useEffect(() => {
    const loadOverview = async () => {
      setOverviewLoading(true);
      setOverviewError(null);
      try {
        const data = await getSpainOverview();
        if (data.stations) setSpainStations(data.stations);
        if (data.times) setTimelineTimes(data.times);
      } catch (err) {
        console.error('Error loading Spain overview:', err);
        setOverviewError('No se pudieron cargar los datos del mapa. Intenta recargar la página.');
      } finally {
        setOverviewLoading(false);
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

  const handleSelectVariable = (variable: WeatherVariable) => {
    setActiveVariable(variable);
    setOverlayVisible(true);
  };

  return (
    <div className="h-dvh w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none relative">
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
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        {/* Floating Top Nav (Variables + Models + Search + Layer Control) */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex min-w-0 flex-col lg:flex-row items-center justify-between gap-2 lg:gap-3 pointer-events-none">
          {/* Left: Weather Variable Selectors */}
          <div className="pointer-events-auto w-full lg:w-auto lg:shrink-0 min-w-0 bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center justify-between gap-1">
            <button
              onClick={() => handleSelectVariable('temperature')}
              aria-pressed={activeVariable === 'temperature'}
              className={`flex items-center gap-1 px-2 lg:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeVariable === 'temperature'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temperatura</span>
            </button>

            <button
              onClick={() => handleSelectVariable('precipitation')}
              aria-pressed={activeVariable === 'precipitation'}
              className={`flex items-center gap-1 px-2 lg:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeVariable === 'precipitation'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Lluvia</span>
            </button>

            <button
              onClick={() => handleSelectVariable('wind_speed')}
              aria-pressed={activeVariable === 'wind_speed'}
              className={`flex items-center gap-1 px-2 lg:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
              onClick={() => setShowLayerControl(prev => !prev)}
              aria-label="Capas"
              aria-expanded={showLayerControl}
              aria-controls="map-layer-controls"
              className={`px-2 lg:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                showLayerControl
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Capas</span>
            </button>
          </div>

          {/* Layer Control Panel (visible on toggle) */}
          {showLayerControl && (
            <div id="map-layer-controls" role="region" aria-labelledby="map-layer-title" className="absolute top-12 lg:top-16 left-0 z-[1001] w-full max-w-[320px] pointer-events-auto">
              <div className="bg-slate-900/98 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/80 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 id="map-layer-title" className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Capas Meteorológicas
                  </h3>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-slate-400">
                  Se muestra una sola variable a la vez. Usa los botones de temperatura, lluvia o viento para cambiar el gradiente.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setOverlayVisible(prev => !prev)}
                    aria-pressed={overlayVisible}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
                  >
                    <span>Ver gradiente</span>
                    {overlayVisible ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  <div className="px-1">
                    <label htmlFor="overlay-opacity" className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-2">
                      <span>Opacidad del gradiente</span>
                      <span>{Math.round(overlayOpacity * 100)}%</span>
                    </label>
                    <input
                      id="overlay-opacity"
                      type="range"
                      min={0.15}
                      max={0.9}
                      step={0.05}
                      value={overlayOpacity}
                      onChange={(event) => setOverlayOpacity(Number(event.target.value))}
                      aria-valuetext={`${Math.round(overlayOpacity * 100)}%`}
                      className="block w-full h-5 accent-blue-500 cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => setShowStations(prev => !prev)}
                    aria-pressed={showStations}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
                  >
                    <span>Ver estaciones</span>
                    {showStations ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Center: Municipal Search Bar */}
          {/* Hide frequent-city pills here to leave room for the map's own controls. */}
          <div className="pointer-events-auto w-full min-w-0 lg:w-56 lg:shrink-0 xl:w-80 [&>div>div:last-child]:hidden">
            <SearchBar
              onSelectLocation={(loc) => {
                setCurrentLocation(loc);
                setIsDrawerOpen(true);
              }}
              currentLocationName={currentLocation.name}
            />
          </div>

          {/* Right: AI Model Quick Selector */}
          <div className="pointer-events-auto w-full min-w-0 lg:flex-1 overflow-x-auto bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-1 text-xs">
            <span className="shrink-0 text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
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
                  aria-pressed={isSelected}
                  className={`shrink-0 whitespace-nowrap px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
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
          overlayVisible={overlayVisible}
          overlayOpacity={overlayOpacity}
          showStations={showStations}
          overviewLoading={overviewLoading}
          overviewError={overviewError}
          selectedTime={timelineTimes[currentHourIndex]}
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
            className="absolute top-64 lg:top-36 left-4 lg:left-auto lg:right-4 max-w-[calc(100%-5rem)] z-[1000] bg-slate-900/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl text-xs font-bold text-white hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 shrink-0 text-blue-400" />
            <span className="truncate">Previsión 7 Días ({currentLocation.name})</span>
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
