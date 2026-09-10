import React from 'react';
import { Sparkles } from 'lucide-react';
import { WeatherModelId } from '../../types';

interface ModelSelectorProps {
  activeModel: WeatherModelId;
  onSelectModel: (model: WeatherModelId) => void;
}

const MODEL_OPTIONS: { id: WeatherModelId; label: string; color: string }[] = [
  { id: 'ecmwf_aifs', label: 'AIFS ECMWF', color: '#10b981' },
  { id: 'ncep_aigfs', label: 'AIGFS NOAA', color: '#8b5cf6' },
  { id: 'google_weathernext2', label: 'WN2 Google', color: '#f59e0b' },
  { id: 'arome', label: 'AROME HD', color: '#ec4899' },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({ activeModel, onSelectModel }) => {
  return (
    <div className="pointer-events-auto w-full min-w-0 lg:flex-1 overflow-x-auto bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-1 text-xs">
      <span className="shrink-0 text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden lg:inline">Modelo:</span>
      </span>

      {MODEL_OPTIONS.map((m) => {
        const isSelected = activeModel === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelectModel(m.id)}
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
  );
};