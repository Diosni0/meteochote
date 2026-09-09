import React, { useEffect, useState } from 'react';
import { TileLayer } from 'react-leaflet';
import { getRainViewerMeta, latestRadarTileUrl, RADAR_ATTRIBUTION } from '../services/radar';

interface RadarLayerProps {
  visible: boolean;
  opacity?: number;
}

export const RadarLayer: React.FC<RadarLayerProps> = ({ visible, opacity = 0.65 }) => {
  const [tileUrl, setTileUrl] = useState<string>('');

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    const load = async () => {
      try {
        const meta = await getRainViewerMeta();
        if (cancelled) return;
        setTileUrl(latestRadarTileUrl(meta));
      } catch (err) {
        console.error('No se pudo cargar el radar (RainViewer):', err);
      }
    };

    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [visible]);

  if (!visible || !tileUrl) return null;

  return (
    <TileLayer
      key={tileUrl}
      url={tileUrl}
      attribution={RADAR_ATTRIBUTION}
      opacity={opacity}
      minZoom={3}
      maxZoom={7}
      maxNativeZoom={7}
      updateWhenIdle={true}
      updateWhenZooming={false}
    />
  );
};