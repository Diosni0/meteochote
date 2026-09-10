import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { LocationItem, SpainStation, WeatherModelId, WeatherVariable } from '../../types';
import { getWeatherDescription } from '../../services/weatherApi';
import { MapPin } from 'lucide-react';
import { createStationIcon, getBadgeColor } from './markers';

const StationLayerBase: React.FC<{
  stations: SpainStation[];
  activeModel: WeatherModelId;
  activeVariable: WeatherVariable;
  hourIndex: number;
  currentLocation: LocationItem;
  onSelectStation: (station: SpainStation) => void;
}> = ({ stations, activeModel, activeVariable, hourIndex, currentLocation, onSelectStation }) => {
  return (
    <>
      {stations.map((st) => {
        const modelData = st.models[activeModel];
        if (!modelData) return null;
        let val = 0;
        let valStr = '';

        if (activeVariable === 'temperature') {
          val = modelData.temp[hourIndex];
          valStr = `${val}°`;
        } else if (activeVariable === 'precipitation') {
          val = modelData.precip[hourIndex];
          valStr = `${val}mm`;
        } else {
          val = modelData.wind[hourIndex];
          valStr = `${val} km/h`;
        }

        if (typeof val !== 'number' || !Number.isFinite(val)) return null;
        const weatherCode = st.weatherCodes[hourIndex] ?? 0;
        const condition = getWeatherDescription(weatherCode);
        const colors = getBadgeColor(activeVariable, val);
        const isSelected = Math.abs(currentLocation.latitude - st.lat) < 0.05 && Math.abs(currentLocation.longitude - st.lon) < 0.05;

        const customIcon = createStationIcon(st.name, valStr, condition.icon, colors, isSelected);

        return (
          <Marker
            key={`marker-${st.id}`}
            position={[st.lat, st.lon]}
            icon={customIcon}
            eventHandlers={{
              click: () => onSelectStation(st),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[150px]">
                <div className="font-bold text-sm text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{st.name}</span>
                </div>
                <div className="text-xs text-slate-400">{st.admin}</div>
                <div className="mt-2 text-xs border-t border-slate-800 pt-1.5 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Condición:</span>
                    <span className="text-white font-medium">{condition.text}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Temperatura:</span>
                    <span className="text-amber-400 font-bold">{modelData.temp[hourIndex]}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Precipitación:</span>
                    <span className="text-blue-400 font-bold">{modelData.precip[hourIndex]} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Viento:</span>
                    <span className="text-teal-400 font-bold">{modelData.wind[hourIndex]} km/h</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectStation(st)}
                  className="w-full mt-2.5 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors text-center"
                >
                  Ver Previsión a 7 Días
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export const StationLayer = React.memo(StationLayerBase);