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
  resolution?: number;
}

export function HeatmapLayer({ data, opacity, visible, activeVariable, resolution = 48 }: HeatmapLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GridLayer | null>(null);

  useEffect(() => {
    if (!visible || !data.length) {
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
      return;
    }

    // GridLayer with smooth bilinear interpolation scaling
    const WeatherTiles = L.GridLayer.extend({
      createTile(coords: L.Coords) {
        const canvas = document.createElement('canvas');
        const res = resolution; // internal raster per 256px tile (bilinear GPU upscale keeps it smooth at a fraction of the cost)
        canvas.width = res;
        canvas.height = res;
        canvas.style.width = '256px';
        canvas.style.height = '256px';
        canvas.style.pointerEvents = 'none';
        canvas.style.imageRendering = 'auto'; // Smooth GPU bilinear filtering

        const context = canvas.getContext('2d');
        if (!context) return canvas;

        const image = context.createImageData(res, res);
        const step = 256 / res;

        for (let y = 0; y < res; y++) {
          for (let x = 0; x < res; x++) {
            const pixelX = coords.x * 256 + (x + 0.5) * step;
            const pixelY = coords.y * 256 + (y + 0.5) * step;
            const location = map.unproject(L.point(pixelX, pixelY), coords.z);
            const sample = interpolateWeather(data, location.lat, location.lng);
            if (!sample) continue;

            const color = weatherColor(activeVariable, sample.value);
            color[3] = Math.round(color[3] * sample.coverage);
            const pixelIndex = (y * res + x) * 4;
            image.data.set(color, pixelIndex);
          }
        }

        context.putImageData(image, 0, 0);
        return canvas;
      },
    });

    const layer = new (WeatherTiles as any)({
      tileSize: 256,
      pane: 'overlayPane',
      opacity,
      noWrap: true,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 2,
    });

    layerRef.current = layer;
    layer.addTo(map);

    return () => {
      layer.remove();
      layerRef.current = null;
    };
  }, [map, data, visible, activeVariable, resolution]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setOpacity(opacity);
    }
  }, [opacity]);

  return null;
}
