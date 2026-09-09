const WEATHER_MAPS_URL = 'https://api.rainviewer.com/public/weather-maps.json';
const REFRESH_MS = 5 * 60 * 1000;

export const RADAR_ATTRIBUTION = '&copy; <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a>';

interface RadarFrame {
  time: number;
  path: string;
}

export interface RainViewerMeta {
  host: string;
  past: RadarFrame[];
}

let cache: { data: RainViewerMeta; fetchedAt: number } | null = null;

export async function getRainViewerMeta(): Promise<RainViewerMeta> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < REFRESH_MS) {
    return cache.data;
  }
  const res = await fetch(WEATHER_MAPS_URL);
  if (!res.ok) {
    throw new Error(`RainViewer API error: ${res.status}`);
  }
  const json = await res.json();
  const meta: RainViewerMeta = {
    host: String(json.host ?? ''),
    past: (Array.isArray(json.radar?.past) ? json.radar.past : []).map((frame: RadarFrame) => ({
      time: Number(frame.time),
      path: String(frame.path),
    })),
  };
  cache = { data: meta, fetchedAt: now };
  return meta;
}

export function latestRadarTileUrl(meta: RainViewerMeta): string {
  const frame = meta.past.length ? meta.past[meta.past.length - 1] : null;
  if (!frame || !frame.path) return '';
  return `${meta.host}${frame.path}/512/{z}/{x}/{y}/2/1_1.png`;
}