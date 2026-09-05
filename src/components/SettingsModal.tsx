import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { saveGoogleApiKey } from '../services/weatherApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWeatherNextLive: boolean;
  onApiKeySaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isWeatherNextLive,
  onApiKeySaved,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setStatusMessage(null);

    const result = await saveGoogleApiKey(apiKey.trim());
    setLoading(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: result.message || 'Clave API guardada y validada correctamente con Google Cloud.',
      });
      onApiKeySaved();
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Error al validar la clave API.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Configuración de WeatherNext 3</h2>
            <p className="text-xs text-slate-400">Google Maps Platform Weather API</p>
          </div>
        </div>

        {/* Current status banner */}
        <div className={`p-3 rounded-2xl mb-5 border text-xs flex items-start gap-2.5 ${
          isWeatherNextLive
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-800/80 border-slate-700/80 text-slate-300'
        }`}>
          {isWeatherNextLive ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-semibold">
              {isWeatherNextLive
                ? 'Conectado en directo a la API de WeatherNext 3'
                : 'Modo Autónomo de Simulación Neuronal'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isWeatherNextLive
                ? 'Las consultas a WeatherNext 3 se están procesando directamente desde Google Cloud.'
                : 'Si no añades una clave, la aplicación funciona al 100% calculando predicciones de alta fidelidad basadas en datos satelitales en abierto.'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Google Maps Platform API Key (Opcional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <a
              href="https://developers.google.com/maps/documentation/weather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>Documentación de Weather API</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              <span>Validar y Activar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
