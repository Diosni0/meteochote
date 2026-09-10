import React from 'react';
import { Thermometer, CloudRain, Wind, Radar, Layers } from 'lucide-react';
import { WeatherVariable } from '../../types';

interface VariableSelectorProps {
  activeVariable: WeatherVariable;
  onSelectVariable: (variable: WeatherVariable) => void;
  showRadar: boolean;
  onToggleRadar: () => void;
  showLayerControl: boolean;
  onToggleLayerControl: () => void;
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({
  activeVariable,
  onSelectVariable,
  showRadar,
  onToggleRadar,
  showLayerControl,
  onToggleLayerControl,
}) => {
  return (
    <div className="pointer-events-auto w-full lg:w-auto lg:shrink-0 min-w-0 bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center justify-between gap-1">
      <button
        onClick={() => onSelectVariable('temperature')}
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
        onClick={() => onSelectVariable('precipitation')}
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
        onClick={() => onSelectVariable('wind_speed')}
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

      {/* Radar tab (independent, first-class) */}
      <div className="w-px h-6 bg-slate-700/60 mx-0.5" aria-hidden="true" />
      <button
        onClick={onToggleRadar}
        aria-pressed={showRadar}
        className={`flex items-center gap-1 px-2 lg:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
          showRadar
            ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Radar className="w-3.5 h-3.5" />
        <span>Radar</span>
      </button>
      <button
        onClick={onToggleLayerControl}
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
  );
};