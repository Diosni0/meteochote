import L from 'leaflet';
import { WeatherVariable } from '../../types';

// Helpers for dynamic badge styling on the map
export function getBadgeColor(variable: WeatherVariable, value: number): { bg: string; text: string; border: string } {
  if (variable === 'temperature') {
    if (value >= 35) return { bg: '#991b1b', text: '#ffffff', border: '#f87171' }; // red-800
    if (value >= 30) return { bg: '#c2410c', text: '#ffffff', border: '#fb923c' }; // orange-700
    if (value >= 25) return { bg: '#d97706', text: '#ffffff', border: '#fcd34d' }; // amber-600
    if (value >= 20) return { bg: '#15803d', text: '#ffffff', border: '#4ade80' }; // green-700
    if (value >= 15) return { bg: '#0284c7', text: '#ffffff', border: '#38bdf8' }; // sky-600
    return { bg: '#1e3a8a', text: '#ffffff', border: '#93c5fd' }; // blue-900
  }
  if (variable === 'precipitation') {
    if (value >= 5) return { bg: '#1d4ed8', text: '#ffffff', border: '#60a5fa' };
    if (value >= 1) return { bg: '#2563eb', text: '#ffffff', border: '#93c5fd' };
    if (value > 0) return { bg: '#0284c7', text: '#ffffff', border: '#bae6fd' };
    return { bg: '#1e293b', text: '#94a3b8', border: '#334155' };
  }
  // wind_speed
  if (value >= 40) return { bg: '#b91c1c', text: '#ffffff', border: '#fca5a5' };
  if (value >= 25) return { bg: '#0f766e', text: '#ffffff', border: '#2dd4bf' };
  if (value >= 15) return { bg: '#0d9488', text: '#ffffff', border: '#5eead4' };
  return { bg: '#1e293b', text: '#94a3b8', border: '#334155' };
}

// Custom Station Marker HTML
export const createStationIcon = (
  name: string,
  valStr: string,
  iconStr: string,
  colors: { bg: string; text: string; border: string },
  isSelected: boolean
) => {
  return L.divIcon({
    className: 'custom-weather-station-marker',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: relative;
      ">
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          background: ${colors.bg};
          border: 1.5px solid ${colors.border};
          color: ${colors.text};
          font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-weight: 700;
          font-size: 10px;
          line-height: 1;
          padding: 4px 6px;
          border-radius: 10px 10px 10px 2px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
          transform: scale(${isSelected ? 1.25 : 1});
          transition: transform 0.15s ease;
          text-align: center;
          min-width: 34px;
        ">
          <span style="font-size: 12px; line-height: 1.2;">${iconStr}</span>
          <span style="margin-top: 2px; white-space: nowrap;">${valStr}</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid ${colors.border};
          margin-top: -1px;
        "></div>
        <div style="
          margin-top: 1px;
          background: rgba(15, 23, 42, 0.85);
          color: #f1f5f9;
          font-size: 9px;
          font-weight: 600;
          padding: 1px 5px;
          border-radius: 4px;
          border: 0.5px solid rgba(148, 163, 184, 0.3);
          white-space: nowrap;
        ">
          ${name}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Custom Active Pin Icon for pinpointed coordinates
export const createActivePinIcon = () => {
  return L.divIcon({
    className: 'custom-active-pin',
    html: `
      <div style="position: relative; width: 28px; height: 28px; transform: translate(-14px, -28px);">
        <div style="position: absolute; width: 28px; height: 28px; background: rgba(59, 130, 246, 0.45); border-radius: 50%; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; background: #2563eb; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px #3b82f6;">
          <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};