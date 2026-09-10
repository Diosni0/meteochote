import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineBarProps {
  times: string[];
  currentIndex: number;
  onIndexChange: (action: number | ((prev: number) => number)) => void;
}

const TimelineBarBase: React.FC<TimelineBarProps> = ({
  times,
  currentIndex,
  onIndexChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const maxIndex = times.length > 0 ? times.length - 1 : 167;

  // Auto-play interval
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        onIndexChange((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, 550); // 550ms per hour step
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, maxIndex, onIndexChange]);

  const currentTimeStr = times[currentIndex] || new Date().toISOString();
  const dateObj = new Date(currentTimeStr);

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayName = dayNames[dateObj.getDay()];
  const formattedDate = `${dayName} ${dateObj.getDate()} ${dateObj.toLocaleString('es-ES', { month: 'short' })}`;
  const formattedHour = `${dateObj.getHours().toString().padStart(2, '0')}:00h`;

  const offsetHours = currentIndex;
  let offsetLabel = 'Inicio previsión';
  if (offsetHours > 0) {
    const days = Math.floor(offsetHours / 24);
    const remH = offsetHours % 24;
    offsetLabel = days > 0 ? `+${days}d ${remH}h` : `+${offsetHours}h`;
  }

return (
    <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[680px] z-[1000] bg-gradient-to-b from-slate-900/95 to-slate-900/80 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl px-3 py-2 text-slate-100 flex flex-col gap-2 animate-fade-in">
      {/* Top Row: info + quick jumps */}
      <div className="flex items-center justify-between text-[10px] gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-blue-400 font-bold text-[11px] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-2 py-0.5 rounded-lg border border-blue-500/20 backdrop-blur-sm">
            {formattedHour}
          </span>
          <span className="hidden sm:inline text-slate-300 font-medium whitespace-nowrap">{formattedDate}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-slate-400">
          <button
            onClick={() => { setIsPlaying(false); onIndexChange(0); }}
            className="hover:text-blue-400 transition-colors font-medium"
          >
            Inicio
          </button>
          <button
            onClick={() => { setIsPlaying(false); onIndexChange(12); }}
            className="hover:text-blue-400 transition-colors"
          >
            +12h
          </button>
          <button
            onClick={() => { setIsPlaying(false); onIndexChange(24); }}
            className="hover:text-blue-400 transition-colors"
          >
            +24h
          </button>
          <button
            onClick={() => { setIsPlaying(false); onIndexChange(48); }}
            className="hover:text-blue-400 transition-colors"
          >
            +48h
          </button>
          <button
            onClick={() => { setIsPlaying(false); onIndexChange(72); }}
            className="hover:text-blue-400 transition-colors"
          >
            +3 días
          </button>
          <button
            onClick={() => { setIsPlaying(false); onIndexChange(120); }}
            className="hover:text-blue-400 transition-colors"
          >
            +5 días
          </button>
          <button
            onClick={() => { setIsPlaying(false); onIndexChange(maxIndex); }}
            className="hover:text-blue-400 transition-colors font-medium"
          >
            Final
          </button>
        </div>

        <div className={`hidden sm:block px-2 py-0.5 rounded-lg text-[10px] font-semibold backdrop-blur-sm border ${
          offsetLabel === 'Inicio previsión'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }`}>
          {offsetLabel}
        </div>
      </div>

      {/* Main Row: play + slider + steppers */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-9 h-9 shrink-0 rounded-xl transition-all flex items-center justify-center backdrop-blur-sm border ${
            isPlaying
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border-amber-400/30'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border-blue-400/30'
          }`}
          title={isPlaying ? 'Pausar animación' : 'Reproducir animación temporal'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Range Slider */}
        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            aria-label="Hora de previsión"
            min={0}
            max={maxIndex}
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              onIndexChange(parseInt(e.target.value));
            }}
            className="w-full h-2 bg-gradient-to-r from-slate-800 to-slate-900 rounded-full appearance-none cursor-pointer accent-transparent focus:outline-none relative z-10"
            style={{
              backgroundImage: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentIndex + 0.5) / (maxIndex + 1)) * 100}%, #1e293b ${((currentIndex + 0.5) / (maxIndex + 1)) * 100}%, #1e293b 100%)`,
            }}
          />
          {/* Custom thumb */}
          <div 
            className="absolute w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none z-20"
            style={{ 
              left: `calc(${((currentIndex / maxIndex) * 100)}% - 8px)`
            }}
          >
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Steppers */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              setIsPlaying(false);
              onIndexChange(Math.max(0, currentIndex - 1));
            }}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center border border-slate-700/50"
            title="-1 hora"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              onIndexChange(Math.min(maxIndex, currentIndex + 1));
            }}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center border border-slate-700/50"
            title="+1 hora"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const TimelineBar = React.memo(TimelineBarBase);
