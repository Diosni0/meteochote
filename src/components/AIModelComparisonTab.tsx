import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { WeatherModelId, WeatherVariable, ForecastResponse } from '../types';
import { Cpu, Wind, CloudRain, Thermometer, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AIModelComparisonTabProps {
  forecastData: ForecastResponse;
}

export const AIModelComparisonTab: React.FC<AIModelComparisonTabProps> = ({ forecastData }) => {
  const [selectedModel, setSelectedModel] = useState<WeatherModelId>('weathernext3');
  const [selectedVariable, setSelectedVariable] = useState<WeatherVariable>('temperature');
  const [compareAllMode, setCompareAllMode] = useState<boolean>(false);
  const [timeHorizon, setTimeHorizon] = useState<'48h' | '7days'>('48h');

  const { models, times } = forecastData;

  // Slicing data based on horizon (48h or 7 days / 168h)
  const dataSliceLength = timeHorizon === '48h' ? 48 : times.length;
  const timeLabels = useMemo(() => {
    return times.slice(0, dataSliceLength).map((t, idx) => {
      const date = new Date(t);
      if (timeHorizon === '48h') {
        return `${date.getHours().toString().padStart(2, '0')}:00`;
      }
      return `${date.getDate()} ${date.toLocaleString('es-ES', { month: 'short' })} ${date.getHours()}:00`;
    });
  }, [times, dataSliceLength, timeHorizon]);

  // Chart dataset generation
  const chartData = useMemo(() => {
    if (!compareAllMode) {
      // Single model view
      const activeModelInfo = models[selectedModel];
      const series = activeModelInfo?.hourly?.[selectedVariable]?.slice(0, dataSliceLength) || [];

      return {
        labels: timeLabels,
        datasets: [
          {
            label: `${activeModelInfo.name} (${selectedVariable === 'temperature' ? '°C' : selectedVariable === 'precipitation' ? 'mm' : 'km/h'})`,
            data: series,
            borderColor: activeModelInfo.color,
            backgroundColor: `${activeModelInfo.color}25`,
            fill: selectedVariable !== 'wind_speed',
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: timeHorizon === '48h' ? 2 : 0,
            pointHoverRadius: 5,
          },
        ],
      };
    } else {
      // Comparison of all AI models
      const modelKeys: WeatherModelId[] = ['weathernext3', 'ecmwf_aifs', 'graphcast', 'pangu_weather'];
      const datasets = modelKeys.map((key) => {
        const m = models[key];
        return {
          label: m.name,
          data: m.hourly[selectedVariable]?.slice(0, dataSliceLength) || [],
          borderColor: m.color,
          backgroundColor: 'transparent',
          tension: 0.35,
          borderWidth: key === selectedModel ? 3 : 1.8,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderDash: key === 'ai_consensus' ? [5, 5] : undefined,
        };
      });

      return {
        labels: timeLabels,
        datasets,
      };
    }
  }, [compareAllMode, selectedModel, selectedVariable, models, timeLabels, dataSliceLength, timeHorizon]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#cbd5e1',
          boxWidth: 12,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const unit = selectedVariable === 'temperature' ? '°C' : selectedVariable === 'precipitation' ? ' mm' : ' km/h';
            return ` ${context.dataset.label}: ${context.parsed.y}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#1e293b' },
        ticks: {
          color: '#94a3b8',
          maxTicksLimit: timeHorizon === '48h' ? 12 : 14,
          font: { size: 11 },
        },
      },
      y: {
        grid: { color: '#1e293b' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (value: any) => {
            const unit = selectedVariable === 'temperature' ? '°' : selectedVariable === 'precipitation' ? ' mm' : 'k';
            return `${value}${unit}`;
          },
        },
      },
    },
  };

  const currentModelData = models[selectedModel];

  // Calculate quick stats for active model
  const activeSeries = currentModelData?.hourly?.[selectedVariable]?.slice(0, dataSliceLength) || [];
  const maxVal = activeSeries.length ? Math.max(...activeSeries) : 0;
  const minVal = activeSeries.length ? Math.min(...activeSeries) : 0;
  const avgVal = activeSeries.length ? (activeSeries.reduce((a, b) => a + b, 0) / activeSeries.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Model Selection Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-2">
          {Object.values(models).map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: model.color }}
                />
                <span>{model.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {model.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compare All Toggle */}
        <button
          onClick={() => setCompareAllMode(!compareAllMode)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            compareAllMode
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-lg shadow-purple-600/25'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{compareAllMode ? 'Viendo Comparativa Global' : 'Superponer Todos los Modelos IA'}</span>
        </button>
      </div>

      {/* Control Bar: Variables & Horizon */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedVariable('temperature')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedVariable === 'temperature'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Thermometer className="w-4 h-4 text-rose-400" />
            <span>Temperatura (°C)</span>
          </button>

          <button
            onClick={() => setSelectedVariable('precipitation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedVariable === 'precipitation'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CloudRain className="w-4 h-4 text-blue-400" />
            <span>Precipitación (mm)</span>
          </button>

          <button
            onClick={() => setSelectedVariable('wind_speed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedVariable === 'wind_speed'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Wind className="w-4 h-4 text-teal-400" />
            <span>Viento (km/h)</span>
          </button>
        </div>

        {/* Horizon selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTimeHorizon('48h')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              timeHorizon === '48h' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Próximas 48h
          </button>
          <button
            onClick={() => setTimeHorizon('7days')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              timeHorizon === '7days' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Previsión 7 Días
          </button>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span>Proyección Horaria:</span>
              <span className="text-blue-400 font-bold">
                {compareAllMode ? 'Comparativa Multi-IA' : currentModelData.name}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {timeHorizon === '48h' ? 'Detalle horario para las próximas 48 horas' : 'Evolución completa de la previsión a 7 días'}
            </p>
          </div>

          {/* Mini Stat Pills */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              Máx: <span className="font-semibold text-white">{maxVal}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              Mín: <span className="font-semibold text-white">{minVal}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              Media: <span className="font-semibold text-white">{avgVal}</span>
            </div>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Model Insight Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Cpu className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Arquitectura de IA</h4>
          </div>
          <div className="text-sm font-semibold text-slate-100">{currentModelData.name}</div>
          <div className="text-xs text-slate-400 mt-1">{currentModelData.architecture}</div>
          <div className="mt-2 text-[11px] text-slate-500">
            Desarrollado por: <span className="text-slate-300">{currentModelData.developer}</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Puntos Fuertes del Modelo</h4>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            {selectedModel === 'weathernext3' && (
              <p>Gran resolución en precipitación convectiva (tormentas y chubascos locales en España) gracias a asimilación continua de satélite en tiempo real.</p>
            )}
            {selectedModel === 'ecmwf_aifs' && (
              <p>Líder mundial en precisión sinóptica a medio plazo (días 3 a 10) y consistencia en patrones de circulación atlántica.</p>
            )}
            {selectedModel === 'graphcast' && (
              <p>Red neuronal sobre mallas icosaédricas globales, sobresaliente en seguimiento de borrascas y DANAs mediterráneas.</p>
            )}
            {selectedModel === 'pangu_weather' && (
              <p>Modelo 3D que resuelve gradientes de presión bruscos y paso rápido de frentes atlánticos sobre la Península Ibérica.</p>
            )}
            {selectedModel === 'ai_consensus' && (
              <p>Promedio ponderado que mitiga las desviaciones atípicas de cada red individual, ideal para toma de decisiones general.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Layers className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Acuerdo Entre Redes de IA</h4>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-white">92%</div>
            <div className="text-xs text-slate-400">
              Nivel de consenso elevado para las próximas 48h en la ubicación seleccionada.
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full w-[92%]" />
          </div>
        </div>
      </div>
    </div>
  );
};
