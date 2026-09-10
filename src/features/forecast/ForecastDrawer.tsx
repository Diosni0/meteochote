import React, { useEffect, useState } from 'react';
import { ForecastResponse, LocationItem, NowcastData, WeatherModelId } from '../../types';
import { getWeatherDescription, getNowcast } from '../../services/weatherApi';
import { ConfidenceCard } from './ConfidenceCard';
import {
  X,
  Sparkles,
  Calendar,
  Cpu,
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  ChevronDown,
  ChevronUp,
  Timer,
} from 'lucide-react';

interface ForecastDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationItem;
  forecastData: ForecastResponse | null;
  loading: boolean;
  activeModel: WeatherModelId;
  onSelectModel: (model: WeatherModelId) => void;
}

const ForecastDrawerBase: React.FC<ForecastDrawerProps> = ({
  isOpen,
  onClose,
  location,
  forecastData,
  loading,
  activeModel,
  onSelectModel,
}) => {
  const [activeTab, setActiveTab] = useState<'forecast7d' | 'modelCompare' | 'nowcast'>('forecast7d');
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(0);
  const [nowcastData, setNowcastData] = useState<NowcastData | null>(null);
  const [nowcastLoading, setNowcastLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || activeTab !== 'nowcast') return;
    let cancelled = false;
    setNowcastLoading(true);
    getNowcast(location.latitude, location.longitude)
      .then((data) => {
        if (!cancelled) setNowcastData(data);
      })
      .catch((err) => {
        console.error('Error cargando nowcast:', err);
      })
      .finally(() => {
        if (!cancelled) setNowcastLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, location]);

  if (!isOpen) return null;

  const currentCondition = forecastData
    ? getWeatherDescription(forecastData.current.weatherCode)
    : { text: 'Cargando...', icon: '🌤️' };

  return (
    <div className="absolute top-4 right-4 bottom-4 w-full sm:w-[440px] z-[1100] bg-gradient-to-b from-slate-900/98 to-slate-900/80 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800/60 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-950/40 to-slate-900/40 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="text-3xl p-2.5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-lg shadow-black/20 flex items-center justify-center animate-float">
            {currentCondition.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">{location.name}</h2>
            <div className="text-xs text-slate-400">
              {[location.admin1, location.country].filter(Boolean).join(', ')}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°W
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-all hover:scale-110 active:scale-95"
          title="Cerrar panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="py-24 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs font-medium">Calculando predicción con redes neuronales...</div>
          </div>
        ) : forecastData ? (
          <>
            {/* Quick Hero Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900/40 to-cyan-950/40 border border-blue-500/20 shadow-lg shadow-blue-900/20 flex items-center justify-between backdrop-blur-sm">
              <div>
                <div className="text-3xl font-black text-white flex items-baseline">
                  <span>{forecastData.current.temperature}</span>
                  <span className="text-xl text-blue-400 font-bold ml-0.5">°C</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Sensación: <span className="text-slate-200 font-semibold">{forecastData.current.feelsLike}°C</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-800/50">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  <span>{forecastData.current.windSpeed} km/h</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-800/50">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span>{forecastData.current.humidity}%</span>
                </div>
              </div>
            </div>

            {/* AI Model Selector Pills */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Modelo de IA Activo</span>
                <span className="text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{forecastData.models[activeModel]?.badge}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(forecastData.models).map((m) => {
                    const isSelected = activeModel === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => onSelectModel(m.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30'
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-slate-600'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                        <span className="truncate">{m.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Tab Navigation in Drawer */}
            <div className="flex items-center gap-1 p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('forecast7d')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'forecast7d'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
                <span>Previsión 7 Días</span>
              </button>
              <button
                onClick={() => setActiveTab('modelCompare')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'modelCompare'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 inline mr-1.5" />
                <span>Comparativa IA</span>
              </button>
              <button
                onClick={() => setActiveTab('nowcast')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'nowcast'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Timer className="w-3.5 h-3.5 inline mr-1.5" />
                <span>Nowcast 15 min</span>
              </button>
            </div>

            {/* TAB 1: 7-DAY FORECAST */}
            {activeTab === 'forecast7d' && (
              <div className="space-y-2.5">
                {forecastData.sevenDayForecast.map((day, idx) => {
                  const isExpanded = expandedDayIndex === idx;
                  const dayCondition = getWeatherDescription(day.weatherCode);

                  return (
                    <div
                      key={day.date}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isExpanded
                          ? 'bg-gradient-to-br from-slate-800/95 to-slate-800/70 border-blue-500/40 shadow-lg shadow-blue-900/20'
                          : 'bg-gradient-to-r from-slate-800/50 to-slate-800/30 hover:bg-slate-800/80 border-slate-800'
                      }`}
                    >
                      <div
                        onClick={() => setExpandedDayIndex(isExpanded ? null : idx)}
                        className="p-3.5 flex items-center justify-between cursor-pointer select-none text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-sm ${isExpanded ? 'animate-float' : ''}`}>
                            {dayCondition.icon}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{day.isToday ? 'Hoy' : day.dayName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{day.dayFormatted}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">{dayCondition.text}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {day.precipitationProbability > 20 && (
                            <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-medium bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                              <CloudRain className="w-3 h-3" />
                              <span>{day.precipitationProbability}%</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-800/50">
                            <span className="text-slate-400">{day.tempMin}°</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-white font-bold">{day.tempMax}°</span>
                          </div>

                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </div>

                      {/* 24-hour carousel */}
                      {isExpanded && (
                        <div className="border-t border-slate-700/60 p-3 bg-gradient-to-b from-slate-950/80 to-slate-900/60 backdrop-blur-sm">
                          <div className="flex gap-2 overflow-x-auto pb-1 text-center no-scrollbar">
                            {day.hourly.map((h, hIdx) => {
                              const cond = getWeatherDescription(h.code);
                              return (
                                <div
                                  key={hIdx}
                                  className="flex-shrink-0 w-14 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] hover:bg-slate-800 transition-colors"
                                >
                                  <div className="text-slate-400 font-mono mb-1">{h.time}</div>
                                  <div className="text-lg mb-1.5">{cond.icon}</div>
                                  <div className="font-bold text-white">{h.temp}°</div>
                                  {h.precip > 0 ? (
                                    <div className="text-blue-400 font-semibold">{h.precip}m</div>
                                  ) : (
                                    <div className="text-slate-600">0</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <ConfidenceCard models={forecastData.models} locationName={location.name} />
              </div>
            )}

            {/* TAB 2: AI MODEL COMPARISON */}
            {activeTab === 'modelCompare' && (
              <div className="space-y-3.5 text-xs">
                <div className="text-[11px] text-slate-400">
                  Valores pronosticados por los distintos modelos para las próximas 24 horas en {location.name}:
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden divide-y divide-slate-800 backdrop-blur-sm">
                  {Object.values(forecastData.models).map((m) => {
                    const next24Temps = m.hourly.temperature.slice(0, 24).filter((v) => Number.isFinite(v));
                    const next24Precip = m.hourly.precipitation.slice(0, 24).filter((v) => Number.isFinite(v));
                    const maxT = next24Temps.length ? Math.max(...next24Temps) : null;
                    const minT = next24Temps.length ? Math.min(...next24Temps) : null;
                    const sumP = Number(next24Precip.reduce((a, b) => a + b, 0).toFixed(1));

                    return (
                      <div key={m.id} className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                          <div>
                            <div className="font-bold text-slate-200">{m.name}</div>
                            <div className="text-[10px] text-slate-400">{m.architecture}</div>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="text-white font-bold bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">
                            {maxT !== null ? `${minT}° a ${maxT}°C` : 'Sin datos'}
                          </div>
                          <div className="text-[10px] text-blue-400">
                            {sumP > 0 ? `${sumP} mm lluvia` : 'Sin lluvia'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-500/20 backdrop-blur-sm">
                  <div className="font-semibold text-blue-300 flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Acuerdo entre modelos</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    AIFS, AIGFS y WeatherNext 2 son redes neuronales independientes (ECMWF, NOAA y Google
                    DeepMind) entrenadas con reanálisis; AROME HD es el modelo físico de alta resolución
                    de Météo-France. Cuanto más coinciden, mayor confianza en la previsión; si divergen,
                    hay incertidumbre atmosférica.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: 15-MINUTE NOWCAST */}
            {activeTab === 'nowcast' && (
              <div className="space-y-3.5 text-xs">
                <div className="text-[11px] text-slate-400">
                  Precipitación estimada para {location.name} en pasos de 15 minutos (extrapolación de
                  radar y satélite, actualizada cada ~10 minutos).
                </div>

                {nowcastLoading ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="text-[11px]">Extrapolando radar y satélite...</div>
                  </div>
                ) : nowcastData && nowcastData.times.length ? (
                  <NowcastPanel data={nowcastData} />
                ) : (
                  <div className="py-12 text-center text-[11px] text-slate-400">
                    No hay datos de nowcast para este punto.
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/30 to-teal-950/30 border border-cyan-500/20 backdrop-blur-sm">
                  <div className="font-semibold text-cyan-300 flex items-center gap-2 mb-1.5">
                    <Timer className="w-4 h-4 text-cyan-400" />
                    <span>¿Qué es el nowcast?</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Es la predicción inmediata (próximas horas) basada en la extrapolación de las últimas
                    imágenes de radar y satélite de Open-Meteo. No es un modelo de IA: complementa la
                    previsión a corto plazo con la observación en tiempo casi real.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No se encontraron datos meteorológicos para este punto.
          </div>
        )}
      </div>
    </div>
  );
};

// Bar panel with 15-minute precipitation steps. Shows the next 6 hours (24 steps)
// as a scrollable strip plus an accumulated summary.
const NowcastPanel: React.FC<{ data: NowcastData }> = ({ data }) => {
  const steps = data.times.length;
  const maxPrecip = Math.max(0.1, ...data.precipitation.map((v) => (Number.isFinite(v) ? v : 0)));

  if (!steps) return null;

  const finite = data.precipitation.filter((v) => Number.isFinite(v));
  const total2h = Number(finite.slice(0, 8).reduce((a, b) => a + b, 0).toFixed(1));
  const total6h = Number(finite.slice(0, 24).reduce((a, b) => a + b, 0).toFixed(1));
  const anyRain = finite.some((v) => v > 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400">Lluvia próximas 2 h</div>
          <div className={`mt-0.5 font-bold ${total2h > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
            {total2h > 0 ? `${total2h} mm` : '0 mm'}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400">Lluvia próximas 6 h</div>
          <div className={`mt-0.5 font-bold ${total6h > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
            {total6h > 0 ? `${total6h} mm` : '0 mm'}
          </div>
        </div>
      </div>

      {!anyRain ? (
        <div className="py-10 text-center rounded-2xl border border-slate-800 bg-slate-950/60 text-[11px] text-slate-400">
          🌤️ Sin precipitación significativa prevista en las próximas 6 horas.
        </div>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar pt-1">
          {data.times.slice(0, 24).map((t, idx) => {
            const value = Number.isFinite(data.precipitation[idx]) ? data.precipitation[idx] : 0;
            const pct = Math.max(4, Math.round((value / maxPrecip) * 100));
            const active = value > 0;
            return (
              <div key={`${t}-${idx}`} className="flex flex-col items-center flex-shrink-0">
                <div className="w-8 rounded-t-md flex items-end justify-center overflow-hidden" style={{ height: 64, background: 'rgba(2,6,23,0.6)' }}>
                  <div
                    className={`w-full ${active ? 'bg-gradient-to-t from-sky-700 to-cyan-400' : 'bg-slate-700/40'}`}
                    style={{ height: `${pct}%` }}
                    title={`${t}: ${value} mm`}
                  />
                </div>
                <div className={`mt-0.5 text-[9px] font-mono ${active ? 'text-cyan-300 font-bold' : 'text-slate-500'}`}>
                  {value.toFixed(1)}
                </div>
                <div className="text-[9px] text-slate-500 font-mono">{t.slice(11, 16)}</div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Fuente: Open-Meteo (`minutely_15`) · {steps} pasos de 15 min hasta{' '}
        {data.times[steps - 1]?.slice(11, 16)} h.
      </p>
    </>
  );
};

export const ForecastDrawer = React.memo(ForecastDrawerBase);
