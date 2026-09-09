import React from 'react';
import { X, Cpu, Zap, Sparkles } from 'lucide-react';

interface ModelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelInfoModal: React.FC<ModelInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Modelos Meteorológicos de IA (reales)</h2>
            <p className="text-xs text-slate-400">
              Previsiones reales de redes neuronales operativas, servidas vía Open-Meteo
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          {/* ECMWF AIFS */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-emerald-300">ECMWF AIFS 0.25°</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">ECMWF AIFS</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Sistema de previsión por IA del Centro Europeo de Predicción a Medio Plazo (ECMWF).
              Red neuronal entrenada con datos de reanálisis ERA5; ha demostrado superar al modelo
              físico IFS en numerosas variables y plazos con una fracción del coste computacional.
              Resolución de 25 km, actualizado cada 6 horas con 7 días de horizonte.
            </p>
          </div>

          {/* NOAA AIGFS */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-purple-300">NOAA AIGFS 0.25°</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">NOAA AIGFS</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Sistema global de previsión basado en IA de NOAA (EE. UU.), construido sobre la
              arquitectura GraphCast de Google DeepMind: redes neuronales sobre grafos en una malla
              icosaédrica del globo. Resolución de 25 km, actualizado cada 6 horas.
            </p>
          </div>

          {/* Data source callout */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="font-semibold text-white text-xs mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>De dónde salen los datos</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Ambos modelos se consultan en directo contra la API gratuita de Open-Meteo, sin clave
              ni registro. Los mapas del panel son interpolaciones de 39 puntos de referencia
              (península, Baleares y Canarias); no son radares. Cuando los dos modelos divergen,
              la incertidumbre de la previsión es mayor: compáralos en la pestaña «Comparativa IA».
            </p>
          </div>

          {/* Why AI models */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="font-semibold text-white text-xs mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>¿Por qué modelos de IA?</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Los modelos numéricos clásicos resuelven ecuaciones diferenciales complejas en
              supercomputadores durante horas. Los modelos de IA aprenden de décadas de física
              atmosférica histórica, ejecutan inferencias en segundos y han demostrado mayor acierto
              en variables clave a medio plazo.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
