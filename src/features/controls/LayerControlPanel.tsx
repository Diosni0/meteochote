import React from 'react';
import { Layers, Eye, EyeOff, Wind } from 'lucide-react';

interface LayerControlPanelProps {
  overlayVisible: boolean;
  onToggleOverlay: () => void;
  overlayOpacity: number;
  onOverlayOpacityChange: (value: number) => void;
  showStations: boolean;
  onToggleStations: () => void;
  showWindParticles: boolean;
  onToggleWind: () => void;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  overlayVisible,
  onToggleOverlay,
  overlayOpacity,
  onOverlayOpacityChange,
  showStations,
  onToggleStations,
  showWindParticles,
  onToggleWind,
}) => {
  return (
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
            onClick={onToggleOverlay}
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
              onChange={(event) => onOverlayOpacityChange(Number(event.target.value))}
              aria-valuetext={`${Math.round(overlayOpacity * 100)}%`}
              className="block w-full h-5 accent-blue-500 cursor-pointer"
            />
          </div>
          <button
            onClick={onToggleStations}
            aria-pressed={showStations}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
          >
            <span>Ver estaciones</span>
            {showStations ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <button
            onClick={onToggleWind}
            aria-pressed={showWindParticles}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
          >
            <span className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Viento animado (Windy)</span>
            </span>
            {showWindParticles ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>
    </div>
  );
};