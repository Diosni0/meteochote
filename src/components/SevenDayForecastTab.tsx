import React, { useState } from 'react';
import { DayForecast } from '../types';
import { getWeatherDescription } from '../services/weatherApi';
import { CloudRain, Wind, ChevronDown, ChevronUp, Droplets, Calendar } from 'lucide-react';

interface SevenDayForecastTabProps {
  forecastList: DayForecast[];
}

export const SevenDayForecastTab: React.FC<SevenDayForecastTabProps> = ({ forecastList }) => {
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(0); // First day open by default

  const toggleDay = (idx: number) => {
    setExpandedDayIndex(expandedDayIndex === idx ? null : idx);
  };

  // Find overall min and max for temperature bar scaling across the week
  const allMax = Math.max(...forecastList.map(d => d.tempMax));
  const allMin = Math.min(...forecastList.map(d => d.tempMin));
  const tempRange = Math.max(1, allMax - allMin);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Previsión a 7 Días (Consenso de IA)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Proyección multivariable calculada mediante redes neuronales meteorológicas
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Haz clic en cualquier día para desplegar su desglose horario
        </div>
      </div>

      <div className="space-y-3">
        {forecastList.map((day, idx) => {
          const isExpanded = expandedDayIndex === idx;
          const condition = getWeatherDescription(day.weatherCode);

          // Bar positioning calculation
          const leftPercent = Math.max(0, Math.min(100, ((day.tempMin - allMin) / tempRange) * 100));
          const widthPercent = Math.max(15, Math.min(100 - leftPercent, ((day.tempMax - day.tempMin) / tempRange) * 100));

          return (
            <div
              key={day.date}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-slate-900 border-blue-500/40 shadow-xl'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80'
              }`}
            >
              {/* Main Card Header / Summary Row */}
              <div
                onClick={() => toggleDay(idx)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                {/* Date & Condition */}
                <div className="flex items-center gap-3.5 min-w-[200px]">
                  <div className="text-2xl p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-sm flex items-center justify-center">
                    {condition.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">
                        {day.isToday ? 'Hoy' : day.dayName}
                      </span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-semibold rounded-md">
                          Hoy
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{day.dayFormatted} • {condition.text}</div>
                  </div>
                </div>

                {/* Rain & Wind Metrics */}
                <div className="flex items-center gap-5 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5" title="Probabilidad y acumulación de lluvia">
                    <Droplets className={`w-4 h-4 ${day.precipitationProbability > 30 ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span>{day.precipitationProbability}%</span>
                    {day.precipitationSum > 0 && (
                      <span className="text-blue-300 font-semibold">({day.precipitationSum} mm)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5" title="Viento máximo">
                    <Wind className="w-4 h-4 text-teal-400" />
                    <span>{day.windSpeedMax} km/h</span>
                  </div>
                </div>

                {/* Temperature Range Bar & Values */}
                <div className="flex items-center gap-3 sm:min-w-[220px]">
                  <span className="text-xs font-semibold text-slate-400 w-8 text-right font-mono">
                    {day.tempMin}°
                  </span>

                  <div className="flex-1 h-2 bg-slate-800 rounded-full relative overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-rose-500"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    />
                  </div>

                  <span className="text-sm font-bold text-white w-8 font-mono">
                    {day.tempMax}°
                  </span>

                  <div className="text-slate-500 pl-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* 24-Hour Expanded Detail Accordion */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
                    <span>Evolución Horaria Estimada (24 horas)</span>
                    <span className="text-[11px] text-slate-500 font-normal">Hora local peninsular</span>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto pb-2 text-center no-scrollbar">
                    {day.hourly.map((h, hIdx) => {
                      const hCondition = getWeatherDescription(h.code);
                      return (
                        <div
                          key={hIdx}
                          className="flex-shrink-0 w-16 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center gap-1"
                        >
                          <span className="text-[11px] text-slate-400 font-mono">{h.time}</span>
                          <span className="text-lg my-0.5">{hCondition.icon}</span>
                          <span className="text-xs font-bold text-slate-100">{h.temp}°</span>
                          <span className="text-[10px] text-blue-400 font-medium">
                            {h.precip > 0 ? `${h.precip}mm` : '0 mm'}
                          </span>
                          <span className="text-[10px] text-teal-400/80 font-mono">
                            {h.wind}k
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
