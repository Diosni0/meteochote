import React from 'react';
import { Gauge, Info } from 'lucide-react';
import { computeModelConfidence, ModelConfidence, ModelSeriesLike } from '../lib/modelConfidence';
import { ModelInfo, WeatherModelId } from '../types';

interface ConfidenceCardProps {
  models: Readonly<Record<WeatherModelId, ModelInfo>>;
  locationName: string;
}

interface LevelStyle {
  text: string;
  bar: string;
}

const levelStyle = (score: number | null): LevelStyle => {
  if (score === null) return { text: 'text-slate-400', bar: 'from-slate-600 to-slate-500' };
  if (score >= 85) return { text: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-300' };
  if (score >= 70) return { text: 'text-sky-400', bar: 'from-sky-500 to-cyan-300' };
  if (score >= 50) return { text: 'text-amber-400', bar: 'from-amber-500 to-yellow-300' };
  if (score >= 30) return { text: 'text-orange-400', bar: 'from-orange-500 to-amber-400' };
  return { text: 'text-rose-400', bar: 'from-rose-500 to-red-400' };
};

const ConfidenceStrip: React.FC<{ confidence: ModelConfidence }> = ({ confidence }) => (
  <div className="flex items-end gap-1.5 mt-3 pt-3 border-t border-slate-800/60">
    <div className="text-[9px] text-slate-500 uppercase tracking-wider mr-1 mb-0.5">Días</div>
    {confidence.daily.slice(0, 7).map((day, idx) => {
      const style = levelStyle(day.score);
      const height = day.score === null ? 6 : Math.max(10, day.score);
      return (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-full bg-slate-950/70 overflow-hidden" style={{ height: 64 }}>
            <div
              className={`w-full rounded-full bg-gradient-to-t ${style.bar}`}
              style={{ height: `${height}%` }}
              title={`Día ${idx + 1}: ${day.score === null ? 'sin datos' : `${day.score}%`}`}
            />
          </div>
          <span className="text-[8px] font-mono text-slate-500">
            {idx === 0 ? 'Hoy' : dayStartInitials(idx)}
          </span>
        </div>
      );
    })}
  </div>
);

const dayStartInitials = (idx: number) => {
  const d = new Date();
  d.setDate(d.getDate() + idx);
  return d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').slice(0, 2);
};

const Rating: React.FC<{ label: string; range: ModelConfidence['short'] }> = ({ label, range }) => {
  const style = levelStyle(range.score);
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/40 border border-slate-800/50 px-2.5 py-1.5">
      <span className="text-[10px] text-slate-400">{label}</span>
      <span className={`font-mono font-bold text-[11px] ${style.text}`}>
        {range.score === null ? '—' : `${range.score}%`}
      </span>
      <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden ml-auto">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${style.bar}`}
          style={{ width: `${range.score ?? 0}%` }}
        />
      </div>
    </div>
  );
};

export const ConfidenceCard: React.FC<ConfidenceCardProps> = ({ models, locationName }) => {
  const series = Object.values(models).map((m) => m.hourly) as ModelSeriesLike[];
  const confidence = computeModelConfidence(series);

  if (confidence.overall === null) {
    return (
      <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 text-xs text-slate-400">
        No hay suficientes datos de modelos para calcular la convergencia.
      </div>
    );
  }

  const style = levelStyle(confidence.overall);
  const modelCount = Object.values(models).length;
  const spreadText =
    confidence.avgSpread24h !== null
      ? `Los modelos coinciden en ±${confidence.avgSpread24h} °C en las próximas 24 h.`
      : '';

  return (
    <div className="p-3.5 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/70 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1">
        <Gauge className="w-4 h-4 text-blue-400" />
        <span className="font-semibold text-slate-200 text-xs">Convergencia de modelos</span>
        <span className="text-[9px] text-slate-500 ml-auto font-mono">{modelCount} modelos</span>
      </div>
      <p className="text-[10px] text-slate-400 mb-3">
        Cuánto de acuerdo están los modelos entre sí para {locationName}. Cuanto más convergen,
        más fiable es la previsión.
      </p>

      <div className="flex items-center gap-3">
        <div className={`text-3xl font-black ${style.text}`}>{confidence.overall}%</div>
        <div className="flex flex-col gap-0.5 flex-1">
          <div className="text-xs font-bold text-slate-200">
            Confianza <span className={style.text}>{confidence.label}</span>
          </div>
          {spreadText && <div className="text-[10px] text-slate-400">{spreadText}</div>}
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden mt-1">
            <div className={`h-full rounded-full bg-gradient-to-r ${style.bar}`} style={{ width: `${confidence.overall}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <Rating label="Próx. 24 h" range={confidence.short} />
        <Rating label="Próx. 48 h" range={confidence.mid} />
        <Rating label="Resto semana" range={confidence.long} />
      </div>

      <ConfidenceStrip confidence={confidence} />

      <p className="flex items-start gap-1.5 mt-3 text-[10px] text-slate-500 leading-relaxed">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        Cálculo: 60 % acuerdo de temperatura + 40 % acuerdo de precipitación entre los {modelCount}{' '}
        modelos (AIFS, AIGFS, WeatherNext 2 y AROME). La confianza suele bajar con el horizonte.
      </p>
    </div>
  );
};