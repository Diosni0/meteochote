import React from 'react';
import { Sparkles, Key, Info, Globe2, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenInfo: () => void;
  isWeatherNextLive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenInfo,
  isWeatherNextLive,
}) => {
  return (
    <header className="border-b border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-xl sticky top-0 z-30 shadow-lg shadow-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Logo and App Info */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-xl blur opacity-40 animate-pulse" />
              <div className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-xl shadow-blue-500/20 text-white font-bold text-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-2xl whitespace-nowrap font-bold bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                  MeteoIA España
                </h1>
                <span className="hidden sm:inline px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm">
                  AI Weather Hub
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950/40 px-2 py-0.5 rounded-lg border border-slate-800/50">
                  <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                  <span className="font-medium">WeatherNext 3</span>
                  <span className="text-slate-600">•</span>
                  <span>ECMWF AIFS</span>
                  <span className="text-slate-600">•</span>
                  <span>GraphCast</span>
                  <span className="text-slate-600">•</span>
                  <span>Pangu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2.5 justify-end">
            {/* Status badge for WeatherNext 3 */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/80 backdrop-blur-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${isWeatherNextLive ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-blue-400'}`} />
              <span className="text-slate-300">
                {isWeatherNextLive ? 'WeatherNext 3 en Directo' : 'Motor IA Multimodelo'}
              </span>
            </div>

            {/* Model info button */}
            <button
              onClick={onOpenInfo}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all hover:shadow-lg hover:shadow-blue-500/10 backdrop-blur-sm"
              title="Conoce cómo funcionan los modelos meteorológicos de IA"
            >
              <Info className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">Modelos IA</span>
            </button>

            {/* API settings button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all hover:scale-105 backdrop-blur-sm"
              title="Configurar Google Maps API Key para WeatherNext 3"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">API WeatherNext</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
