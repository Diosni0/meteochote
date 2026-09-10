import React from 'react';
import { Info, Globe2 } from 'lucide-react';

interface HeaderProps {
  onOpenInfo: () => void;
}

const HeaderBase: React.FC<HeaderProps> = ({ onOpenInfo }) => {
  return (
    <header className="border-b border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-xl sticky top-0 z-30 shadow-lg shadow-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Logo and App Info */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-xl blur opacity-40 animate-pulse" />
              <div className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-xl shadow-blue-500/20 text-white font-bold text-xl">
                <Globe2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-2xl whitespace-nowrap font-bold bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                  Meteochote
                </h1>
                <span className="hidden sm:inline px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                  Modelos IA reales
                </span>
              </div>
              <div className="hidden sm:block text-[11px] sm:text-xs text-slate-400 italic mt-0.5">
                meteorolog-IA para hombres de verdad
              </div>
              <div className="hidden lg:flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950/40 px-2 py-0.5 rounded-lg border border-slate-800/50">
                  <span className="font-medium text-emerald-400">ECMWF AIFS</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-medium text-purple-400">NOAA AIGFS</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-medium text-amber-400">Google WN2</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-medium text-pink-400">AROME HD</span>
                  <span className="text-slate-600">•</span>
                  <span>Datos reales vía Open-Meteo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2.5 justify-end">
            <button
              onClick={onOpenInfo}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all hover:shadow-lg hover:shadow-blue-500/10 backdrop-blur-sm"
              title="Conoce los modelos meteorológicos de IA reales que usa la app"
            >
              <Info className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">Modelos IA</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Header = React.memo(HeaderBase);
