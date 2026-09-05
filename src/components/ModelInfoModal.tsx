import React from 'react';
import { X, Cpu, Zap, Globe, Shield, Sparkles } from 'lucide-react';

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
            <h2 className="text-xl font-bold text-white">Modelos Meteorológicos de IA</h2>
            <p className="text-xs text-slate-400">
              La revolución del aprendizaje profundo frente a la predicción numérica clásica
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          {/* WeatherNext 3 */}
          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-blue-300">Google DeepMind WeatherNext 3</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">Sept 2026</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              El modelo meteorológico global más reciente de DeepMind. Se entrena asimilando directamente observaciones de satélite en tiempo real, resolviendo con precisión horaria eventos locales rápidos como tormentas convectivas y cambios bruscos de temperatura en España.
            </p>
          </div>

          {/* ECMWF AIFS */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-emerald-300">ECMWF AIFS (Centro Europeo)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">ECMWF AI</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Sistema de previsión por IA desarrollado por el Centro Europeo (ECMWF). Ha demostrado superar al modelo físico tradicional IFS en predicciones de 3 a 15 días con una reducción drástica del coste computacional.
            </p>
          </div>

          {/* GraphCast */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-purple-300">Google DeepMind GraphCast</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">GNN Mesh</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Utiliza redes neuronales sobre grafos (GNN) en una malla icosaédrica tridimensional del globo terráqueo. Genera previsiones completas a 10 días en menos de un minuto con gran fiabilidad en el seguimiento de ciclones y danas.
            </p>
          </div>

          {/* Pangu-Weather */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-amber-300">Huawei Pangu-Weather</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">3D Vision Transformer</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Arquitectura de transformador visual en 3D adaptada a la atmósfera. Destaca en la predicción de trayectorias frontales y campos de presión en capas altas y bajas de la troposfera.
            </p>
          </div>

          {/* Legacy NWP vs AI callout */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <div className="font-semibold text-white text-xs mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>¿Por qué descartamos los modelos clásicos?</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Los modelos numéricos clásicos resuelven ecuaciones diferenciales complejas en supercomputadores durante horas. Los modelos de IA aprenden de décadas de física atmosférica histórica, ejecutan inferencias en segundos y han demostrado mayor acierto en variables clave a medio plazo.
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
