import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { LocationItem, SpainStation, WeatherModelId, WeatherVariable } from '../types';
import { getWeatherDescription } from '../services/weatherApi';
import { MapPin } from 'lucide-react';
import { useHeatmapData } from '../hooks/useHeatmapData';
import { HeatmapLayer } from './HeatmapLayer';
import { WindParticlesLayer } from './WindParticlesLayer';
import { WEATHER_SCALES } from '../services/weatherLayers';

interface WeatherMapProps {
  stations: SpainStation[];
  activeModel: WeatherModelId;
  activeVariable: WeatherVariable;
  hourIndex: number;
  currentLocation: LocationItem;
  overlayVisible: boolean;
  overlayOpacity: number;
  showStations: boolean;
  showWindParticles?: boolean;
  overviewLoading: boolean;
  overviewError: string | null;
  selectedTime: string | undefined;
  onSelectStation: (station: SpainStation) => void;
  onSelectCoords: (lat: number, lon: number, name?: string) => void;
}

// Helpers for dynamic badge styling on the map
function getBadgeColor(variable: WeatherVariable, value: number): { bg: string; text: string; border: string } {
  if (variable === 'temperature') {
    if (value >= 35) return { bg: '#991b1b', text: '#ffffff', border: '#f87171' }; // red-800
    if (value >= 30) return { bg: '#c2410c', text: '#ffffff', border: '#fb923c' }; // orange-700
    if (value >= 25) return { bg: '#d97706', text: '#ffffff', border: '#fcd34d' }; // amber-600
    if (value >= 20) return { bg: '#15803d', text: '#ffffff', border: '#4ade80' }; // green-700
    if (value >= 15) return { bg: '#0284c7', text: '#ffffff', border: '#38bdf8' }; // sky-600
    return { bg: '#1e3a8a', text: '#ffffff', border: '#93c5fd' }; // blue-900
  }
  if (variable === 'precipitation') {
    if (value >= 5) return { bg: '#1d4ed8', text: '#ffffff', border: '#60a5fa' };
    if (value >= 1) return { bg: '#2563eb', text: '#ffffff', border: '#93c5fd' };
    if (value > 0) return { bg: '#0284c7', text: '#ffffff', border: '#bae6fd' };
    return { bg: '#1e293b', text: '#94a3b8', border: '#334155' };
  }
  // wind_speed
  if (value >= 40) return { bg: '#b91c1c', text: '#ffffff', border: '#fca5a5' };
  if (value >= 25) return { bg: '#0f766e', text: '#ffffff', border: '#2dd4bf' };
  if (value >= 15) return { bg: '#0d9488', text: '#ffffff', border: '#5eead4' };
  return { bg: '#1e293b', text: '#94a3b8', border: '#334155' };
}

// Custom Station Marker HTML
const createStationIcon = (
  name: string,
  valStr: string,
  iconStr: string,
  colors: { bg: string; text: string; border: string },
  isSelected: boolean
) => {
  return L.divIcon({
    className: 'custom-weather-station-marker',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -50%);
        cursor: pointer;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
      ">
        <div style="
          background-color: ${colors.bg};
          color: ${colors.text};
          border: 1.5px solid ${isSelected ? '#60a5fa' : colors.border};
          border-radius: 9999px;
          padding: 2px 7px;
          font-size: 11px;
          font-weight: 700;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 3px;
          box-shadow: ${isSelected ? '0 0 12px #3b82f6' : 'none'};
          white-space: nowrap;
        ">
          <span style="font-size: 12px; line-height: 1;">${iconStr}</span>
          <span>${valStr}</span>
        </div>
        <div style="
          margin-top: 1px;
          background: rgba(15, 23, 42, 0.85);
          color: #f1f5f9;
          font-size: 9px;
          font-weight: 600;
          padding: 1px 5px;
          border-radius: 4px;
          border: 0.5px solid rgba(148, 163, 184, 0.3);
          white-space: nowrap;
        ">
          ${name}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Custom Active Pin Icon for pinpointed coordinates
const createActivePinIcon = () => {
  return L.divIcon({
    className: 'custom-active-pin',
    html: `
      <div style="position: relative; width: 28px; height: 28px; transform: translate(-14px, -28px);">
        <div style="position: absolute; width: 28px; height: 28px; background: rgba(59, 130, 246, 0.45); border-radius: 50%; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; background: #2563eb; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px #3b82f6;">
          <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

// Station Layer Component - dynamically renders markers based on layer visibility
const StationLayer: React.FC<{
  stations: SpainStation[];
  activeModel: WeatherModelId;
  activeVariable: WeatherVariable;
  hourIndex: number;
  currentLocation: LocationItem;
  onSelectStation: (station: SpainStation) => void;
}> = ({ stations, activeModel, activeVariable, hourIndex, currentLocation, onSelectStation }) => {
  return (
    <>
      {stations.map((st) => {
        const modelData = st.models[activeModel];
        if (!modelData) return null;
        let val = 0;
        let valStr = '';

        if (activeVariable === 'temperature') {
          val = modelData.temp[hourIndex];
          valStr = `${val}°`;
        } else if (activeVariable === 'precipitation') {
          val = modelData.precip[hourIndex];
          valStr = `${val}mm`;
        } else {
          val = modelData.wind[hourIndex];
          valStr = `${val} km/h`;
        }

        if (typeof val !== 'number' || !Number.isFinite(val)) return null;
        const weatherCode = st.weatherCodes[hourIndex] ?? 0;
        const condition = getWeatherDescription(weatherCode);
        const colors = getBadgeColor(activeVariable, val);
        const isSelected = Math.abs(currentLocation.latitude - st.lat) < 0.05 && Math.abs(currentLocation.longitude - st.lon) < 0.05;

        const customIcon = createStationIcon(st.name, valStr, condition.icon, colors, isSelected);

        return (
          <Marker
            key={`marker-${st.id}`}
            position={[st.lat, st.lon]}
            icon={customIcon}
            eventHandlers={{
              click: () => onSelectStation(st),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[150px]">
                <div className="font-bold text-sm text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{st.name}</span>
                </div>
                <div className="text-xs text-slate-400">{st.admin}</div>
                <div className="mt-2 text-xs border-t border-slate-800 pt-1.5 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Condición:</span>
                    <span className="text-white font-medium">{condition.text}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Temperatura:</span>
                    <span className="text-amber-400 font-bold">{modelData.temp[hourIndex]}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Precipitación:</span>
                    <span className="text-blue-400 font-bold">{modelData.precip[hourIndex]} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Viento:</span>
                    <span className="text-teal-400 font-bold">{modelData.wind[hourIndex]} km/h</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectStation(st)}
                  className="w-full mt-2.5 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors text-center"
                >
                  Ver Previsión a 7 Días
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

// Handles map clicks
const MapEventsHandler: React.FC<{ onSelectCoords: (lat: number, lon: number) => void }> = ({ onSelectCoords }) => {
  useMapEvents({
    click(e) {
      onSelectCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Smooth flying controller
const FlyToCenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  const [lat, lon] = center;
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom(), {
      duration: 1.0,
    });
  }, [lat, lon, map]);
  return null;
};

export const WeatherMap: React.FC<WeatherMapProps> = ({
  stations,
  activeModel,
  activeVariable,
  hourIndex,
  currentLocation,
  overlayVisible,
  overlayOpacity,
  showStations,
  showWindParticles = true,
  overviewLoading,
  overviewError,
  selectedTime,
  onSelectStation,
  onSelectCoords,
}) => {
  const [mapTheme, setMapTheme] = useState<'dark' | 'satellite'>('dark');
  const position: [number, number] = [currentLocation.latitude, currentLocation.longitude];

  // Generate heatmap data based on stations and current variable
  const heatmapData = useHeatmapData(stations, activeModel, activeVariable, hourIndex);
  const scale = WEATHER_SCALES[activeVariable];
  const min = scale.stops[0].value;
  const max = scale.stops[scale.stops.length - 1].value;
  const gradient = `linear-gradient(to right, ${scale.stops.map(stop =>
    `rgb(${stop.color.join(',')}) ${(stop.value - min) / (max - min) * 100}%`
  ).join(', ')})`;
  const status = overviewLoading
    ? 'Cargando capas meteorológicas...'
    : overviewError || (!heatmapData.length ? 'Sin datos para esta capa y hora.' : null);

  // Basemap tiles remain below the meteorological raster
  const darkTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  const satelliteTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Map Container Gradient Border */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-b from-blue-500/5 via-cyan-500/5 to-indigo-500/5 z-0" />
      
      {/* Top Left: Basemap and Region Quick Switcher */}
      <div className="absolute top-48 lg:top-20 left-4 right-4 z-[1000] flex flex-wrap items-center gap-2 pointer-events-none">
        {/* Basemap Toggle */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg flex items-center text-xs">
          <button
            onClick={() => setMapTheme('dark')}
            className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
              mapTheme === 'dark' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Oscuro
          </button>
          <button
            onClick={() => setMapTheme('satellite')}
            className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
              mapTheme === 'satellite' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satélite
          </button>
        </div>

        {/* Region Shortcuts */}
        <div className="pointer-events-auto flex bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg items-center text-[10px] sm:text-xs gap-1">
          <button
            onClick={() => onSelectCoords(40.4168, -3.7038, 'Península Ibérica')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium"
          >
            Península
          </button>
          <button
            onClick={() => onSelectCoords(39.5696, 2.6502, 'Islas Baleares')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium"
          >
            Baleares
          </button>
          <button
            onClick={() => onSelectCoords(28.2915, -16.6291, 'Islas Canarias')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium"
          >
            Canarias
          </button>
        </div>
      </div>

      <section aria-label="Leyenda meteorológica" className="absolute bottom-48 sm:bottom-52 left-4 right-4 sm:right-auto sm:w-80 z-[1000] bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/80 text-xs text-slate-200 shadow-xl pointer-events-none">
        <div className="flex justify-between gap-2 font-semibold">
          <span>{scale.label}{!overlayVisible && ' (oculta)'}</span>
          <span className="text-slate-400">{scale.unit}</span>
        </div>
        {selectedTime && <p className="hidden sm:block text-[10px] text-slate-400 mt-1">{selectedTime.replace('T', ' · ')} · hora peninsular</p>}
        {overlayVisible && !status && <>
          <div className="h-2.5 rounded-full mt-3" style={{ background: gradient }} />
          <div className="relative h-4 mt-1 text-[9px] tabular-nums">
            {scale.stops.filter((_, index) => activeVariable !== 'precipitation' || index !== 1).map((stop, index, stops) => (
              <span key={stop.value} className="absolute" style={{ left: `${(stop.value - min) / (max - min) * 100}%`, transform: index === 0 ? 'none' : index === stops.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}>{stop.value}</span>
            ))}
          </div>
        </>}
        {status ? <p role="status" className="mt-2 text-amber-300">{status}</p> : <p className="mt-1 text-[10px] leading-relaxed text-slate-400">Interpolación continua IA · {heatmapData.length} estaciones<span className="hidden sm:inline"> · Corrientes de viento animadas (Windy)</span></p>}
      </section>

      <MapContainer
        center={position}
        zoom={6}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <ZoomControl position="topright" />
        <TileLayer
          key={mapTheme}
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url={mapTheme === 'dark' ? darkTileUrl : satelliteTileUrl}
          maxZoom={16}
          updateWhenIdle={true}
          updateWhenZooming={false}
        />
        <FlyToCenter center={position} />
        <MapEventsHandler onSelectCoords={onSelectCoords} />

        {/* Render Station Markers based on layer visibility */}
        {showStations && <StationLayer
          stations={stations}
          activeModel={activeModel}
          activeVariable={activeVariable}
          hourIndex={hourIndex}
          currentLocation={currentLocation}
          onSelectStation={onSelectStation}
        />}

        {/* Heatmap Layer for current variable */}
        <HeatmapLayer
          data={heatmapData}
          opacity={overlayOpacity}
          visible={overlayVisible}
          activeVariable={activeVariable}
        />

        {/* Animated Wind Particle Streamlines Layer (Windy style) */}
        <WindParticlesLayer
          data={heatmapData}
          visible={showWindParticles}
          opacity={0.85}
        />

        {/* Active Pinpoint Marker */}
        <Marker position={position} icon={createActivePinIcon()}>
          <Popup>
            <div className="p-1">
              <div className="font-bold text-sm text-white">{currentLocation.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {currentLocation.latitude.toFixed(3)}°N, {currentLocation.longitude.toFixed(3)}°W
              </div>
              <div className="text-[11px] text-blue-400 font-semibold mt-1">
                Punto activo de consulta de IA
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
