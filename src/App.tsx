import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { WeatherMap } from './features/map/WeatherMap';
import { ForecastDrawer } from './features/forecast/ForecastDrawer';
import { TimelineBar } from './features/controls/TimelineBar';
import { ModelInfoModal } from './components/ModelInfoModal';
import { VariableSelector } from './features/controls/VariableSelector';
import { ModelSelector } from './features/controls/ModelSelector';
import { LayerControlPanel } from './features/controls/LayerControlPanel';
import { getForecast, getSpainOverview } from './services/weatherApi';
import {
  LocationItem,
  ForecastResponse,
  SpainStation,
  WeatherModelId,
  WeatherVariable,
} from './types';
import {
  Calendar,
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
  const [activeModel, setActiveModel] = useState<WeatherModelId>('ecmwf_aifs');
  const [activeVariable, setActiveVariable] = useState<WeatherVariable>('temperature');

  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState<boolean>(false);
  
  // Map overlay controls
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
const [overlayOpacity, setOverlayOpacity] = useState<number>(0.65);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showWindParticles, setShowWindParticles] = useState<boolean>(true);
  const [showRadar, setShowRadar] = useState<boolean>(false);
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

    loadOverview();
  }, []);

  // Fetch forecast for currently selected point
  const fetchForecast = async (loc: LocationItem) => {
    setLoadingForecast(true);
    try {
      const data = await getForecast(loc.latitude, loc.longitude);
      setForecastData(data);
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
  const handleSelectStation = useCallback((station: SpainStation) => {
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
    setHasSelectedLocation(true);
  }, []);

  // Handle map click anywhere
  const handleSelectCoords = useCallback((lat: number, lon: number, name?: string) => {
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
    setHasSelectedLocation(true);
  }, []);

  const handleSelectVariable = useCallback((variable: WeatherVariable) => {
    setActiveVariable(variable);
    setOverlayVisible(true);
  }, []);

  const handleSelectLocation = useCallback((loc: LocationItem) => {
    setCurrentLocation(loc);
    setIsDrawerOpen(true);
    setHasSelectedLocation(true);
  }, []);

  const handleCloseDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const handleSelectModel = useCallback((model: WeatherModelId) => setActiveModel(model), []);
  const handleOpenInfo = useCallback(() => setIsInfoOpen(true), []);

  return (
    <div className="h-dvh w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none relative">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 right-20 w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Top Header */}
      <Header onOpenInfo={handleOpenInfo} />

      {/* Floating Control Bar over the Map */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        {/* Floating Top Nav (Variables + Models + Search + Layer Control) */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex min-w-0 flex-col lg:flex-row items-center justify-between gap-2 lg:gap-3 pointer-events-none">
{/* Left: Weather Variable Selectors */}
          <VariableSelector
            activeVariable={activeVariable}
            onSelectVariable={handleSelectVariable}
            showRadar={showRadar}
            onToggleRadar={() => setShowRadar(prev => !prev)}
            showLayerControl={showLayerControl}
            onToggleLayerControl={() => setShowLayerControl(prev => !prev)}
          />

          {/* Layer Control Panel (visible on toggle) */}
          {showLayerControl && (
            <LayerControlPanel
              overlayVisible={overlayVisible}
              onToggleOverlay={() => setOverlayVisible(prev => !prev)}
              overlayOpacity={overlayOpacity}
              onOverlayOpacityChange={setOverlayOpacity}
              showStations={showStations}
              onToggleStations={() => setShowStations(prev => !prev)}
              showWindParticles={showWindParticles}
              onToggleWind={() => setShowWindParticles(prev => !prev)}
            />
          )}

          {/* Center: Municipal Search Bar */}
          {/* Hide frequent-city pills here to leave room for the map's own controls. */}
          <div className="pointer-events-auto w-full min-w-0 lg:w-56 lg:shrink-0 xl:w-80 [&>div>div:last-child]:hidden">
<SearchBar
              onSelectLocation={handleSelectLocation}
              currentLocationName={currentLocation.name}
            />
          </div>

{/* Right: AI Model Quick Selector */}
          <ModelSelector activeModel={activeModel} onSelectModel={handleSelectModel} />
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
          showWindParticles={showWindParticles}
          showRadar={showRadar}
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
          onIndexChange={setCurrentHourIndex}
        />

        {/* Floating Forecast Drawer (Right Side) */}
<ForecastDrawer
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          location={currentLocation}
          forecastData={forecastData}
          loading={loadingForecast}
          activeModel={activeModel}
          onSelectModel={handleSelectModel}
        />

{/* Reopen Drawer Pill (only after the user picks a location) */}
        {!isDrawerOpen && hasSelectedLocation && (
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
    </div>
  );
};

export default App;
