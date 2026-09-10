import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Navigation, X } from 'lucide-react';
import { searchLocations } from '../services/weatherApi';
import { LocationItem } from '../types';

interface SearchBarProps {
  onSelectLocation: (loc: LocationItem) => void;
  currentLocationName: string;
}

const POPULAR_LOCATIONS: Array<{ name: string; admin: string; lat: number; lon: number }> = [
  { name: 'Madrid', admin: 'Comunidad de Madrid', lat: 40.4168, lon: -3.7038 },
  { name: 'Barcelona', admin: 'Cataluña', lat: 41.3879, lon: 2.1699 },
  { name: 'Valencia', admin: 'Comunitat Valenciana', lat: 39.4699, lon: -0.3763 },
  { name: 'Sevilla', admin: 'Andalucía', lat: 37.3891, lon: -5.9845 },
  { name: 'Bilbao', admin: 'País Vasco', lat: 43.2630, lon: -2.9350 },
  { name: 'Zaragoza', admin: 'Aragón', lat: 41.6488, lon: -0.8891 },
  { name: 'Málaga', admin: 'Andalucía', lat: 36.7213, lon: -4.4214 },
  { name: 'Palma', admin: 'Islas Baleares', lat: 39.5696, lon: 2.6502 },
  { name: 'Las Palmas', admin: 'Canarias', lat: 28.1235, lon: -15.4363 },
  { name: 'Santiago de Compostela', admin: 'Galicia', lat: 42.8782, lon: -8.5448 },
];

const SearchBarBase: React.FC<SearchBarProps> = ({
  onSelectLocation,
  currentLocationName,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchLocations(query);
      setResults(res);
      setLoading(false);
      setIsOpen(true);
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: LocationItem) => {
    onSelectLocation(item);
    setQuery('');
    setIsOpen(false);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelectLocation({
          id: 999999,
          name: 'Mi Ubicación Actual',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          country: 'España',
          countryCode: 'ES',
          admin1: 'Geolocalizado',
        });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        alert(`No se pudo obtener la ubicación: ${err.message}`);
      }
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto" ref={containerRef}>
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="Busca cualquier municipio o ciudad de España (ej. Toledo, Granada, Gijón)..."
            className="w-full pl-11 pr-24 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-xl transition-all"
          />

          <div className="absolute right-2.5 flex items-center gap-1">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                title="Limpiar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleGeolocate}
              className="p-2 text-slate-400 hover:text-blue-400 rounded-xl hover:bg-slate-800 transition-colors"
              title="Usar mi ubicación GPS actual"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Dropdown Results */}
        {isOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto divide-y divide-slate-800">
            {results.map((loc) => (
              <button
                key={`${loc.id}-${loc.latitude}-${loc.longitude}`}
                onClick={() => handleSelect(loc)}
                className="w-full px-4 py-3 text-left hover:bg-slate-800/70 flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-100 group-hover:text-white">
                      {loc.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Popular Cities Pills */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-500 text-[11px] font-medium mr-1 whitespace-nowrap">
          Frecuentes:
        </span>
        {POPULAR_LOCATIONS.map((city) => (
          <button
            key={city.name}
            onClick={() =>
              onSelectLocation({
                id: Math.random(),
                name: city.name,
                latitude: city.lat,
                longitude: city.lon,
                country: 'España',
                countryCode: 'ES',
                admin1: city.admin,
              })
            }
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border border-slate-700/60 transition-colors whitespace-nowrap"
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export const SearchBar = React.memo(SearchBarBase);
