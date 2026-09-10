import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { LocationItem, SpainStation, WeatherModelId, WeatherVariable } from '../../types';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import { HeatmapLayer } from './HeatmapLayer';
import { WindParticlesLayer } from './WindParticlesLayer';
import { RadarLayer } from './RadarLayer';
import { WEATHER_SCALES } from '../../services/weatherLayers';
import { Radar } from 'lucide-react';
import { createActivePinIcon } from './markers';
import { FlyToCenter, MapEventsHandler, ZoomTracker } from './mapHandlers';
import { StationLayer } from './StationLayer';

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
  showRadar?: boolean;
  radarOpacity?: number;
  overviewLoading: boolean;
  overviewError: string | null;
  selectedTime: string | undefined;
  onSelectStation: (station: SpainStation) => void;
  onSelectCoords: (lat: number, lon: number, name?: string) => void;
}

const WeatherMapBase: React.FC<WeatherMapProps> = ({
  stations,
  activeModel,
  activeVariable,
  hourIndex,
  currentLocation,
  overlayVisible,
  overlayOpacity,
  showStations,
  showWindParticles = true,
  showRadar = false,
  radarOpacity = 0.65,
  overviewLoading,
  overviewError,
  selectedTime,
  onSelectStation,
  onSelectCoords,
}) => {
  const [mapTheme, setMapTheme] = useState<'dark' | 'satellite'>('dark');
  const [zoom, setZoom] = useState(6);
  const position: [number, number] = [currentLocation.latitude, currentLocation.longitude];

  // Render Level of Detail: overview zoom ignores station labels and lightens the
  // overlays; the farther you zoom in, the more detail is painted.
  const detailLevel = zoom < 6.5 ? 'low' : zoom < 9 ? 'mid' : 'high';
  const heatmapResolution = detailLevel === 'low' ? 32 : 48;
  const windDensity = detailLevel === 'low' ? 0.55 : 1;

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
    : overviewError || (!heatmapData.length
        ? `Sin datos para ${activeModel === 'arome' ? 'AROME' : activeModel === 'google_weathernext2' ? 'WN2' : 'esta capa'} en esta hora.`
        : null);

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

      <section aria-label="Leyenda meteorológica" className="absolute bottom-48 xl:bottom-4 left-4 right-4 sm:right-auto sm:w-64 2xl:w-80 z-[1000] bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/80 text-xs text-slate-200 shadow-xl pointer-events-none">
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
        {status ? <p role="status" className="mt-2 text-amber-300">{status}</p> : <p className="mt-1 text-[10px] leading-relaxed text-slate-400">Interpolación de modelos IA reales (AIFS · AIGFS · WN2 · AROME) · {heatmapData.length} estaciones<span className="hidden sm:inline"> · Corrientes de viento animadas</span></p>}
        {showRadar && (
          <div className="mt-2 border-t border-slate-700/70 pt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-cyan-300">
              <Radar className="w-3 h-3" />
              <span>Radar observado (RainViewer) · última imagen</span>
            </div>
            <div className="h-2 rounded-full mt-2" style={{ background: 'linear-gradient(to right, #033366, #2563eb, #22d3ee, #22c55e, #facc15, #f97316, #dc2626)' }} />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>Débil</span>
              <span>Intenso</span>
            </div>
          </div>
        )}
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
        <ZoomTracker onZoomChange={setZoom} />
        <MapEventsHandler onSelectCoords={onSelectCoords} />

        {/* Radar de observación (RainViewer) - debajo del gradiente IA */}
        <RadarLayer visible={showRadar} opacity={radarOpacity} />

        {/* Render Station Markers based on layer visibility and zoom */}
        {showStations && detailLevel !== 'low' && <StationLayer
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
          resolution={heatmapResolution}
        />

        {/* Animated Wind Particle Streamlines Layer (Windy style) */}
        <WindParticlesLayer
          data={heatmapData}
          visible={showWindParticles}
          opacity={0.85}
          densityScale={windDensity}
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

export const WeatherMap = React.memo(WeatherMapBase);