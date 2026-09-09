import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { HeatmapPoint, WeatherVariable } from '../types';
import { interpolateWeather, weatherColor } from '../services/weatherLayers';

interface HeatmapLayerProps {
  data: HeatmapPoint[];
  opacity: number;
  visible: boolean;
  activeVariable: WeatherVariable;
}

export function HeatmapLayer({ data, opacity, visible, activeVariable }: HeatmapLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GridLayer | null>(null);

  useEffect(() => {
    if (!visible || !data.length) return;

    // Leaflet owns tile projection, pan/zoom transforms and cleanup. Sampling a
    // small raster keeps playback inexpensive; CSS scales it with smoothing.
    class WeatherTiles extends L.GridLayer {
      createTile(coords: L.Coords) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 64;
        canvas.style.pointerEvents = 'none';
        const context = canvas.getContext('2d');
        if (!context) return canvas;
        const image = context.createImageData(64, 64);
        for (let y = 0; y < 64; y++) {
          for (let x = 0; x < 64; x++) {
            const location = map.unproject(L.point(coords.x * 256 + (x + 0.5) * 4, coords.y * 256 + (y + 0.5) * 4), coords.z);
            const sample = interpolateWeather(data, location.lat, location.lng);
            if (!sample) continue;
            const color = weatherColor(activeVariable, sample.value);
            color[3] = Math.round(color[3] * sample.coverage);
            image.data.set(color, (y * 64 + x) * 4);
          }
        }
        context.putImageData(image, 0, 0);
        return canvas;
      }
    }
    const layer = new WeatherTiles({ tileSize: 256, pane: 'overlayPane', noWrap: true, updateWhenIdle: true });
    layerRef.current = layer;
    layer.addTo(map);
    return () => {
      layer.remove();
      layerRef.current = null;
    };
  }, [map, data, visible, activeVariable]);

  useEffect(() => {
    layerRef.current?.setOpacity(opacity);
  }, [opacity, data, visible, activeVariable]);

  return null;
}
