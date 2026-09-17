import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { HeatmapPoint, WeatherVariable } from '../../types';
import { getFieldRasters, sampleField, FieldRaster } from './fieldRaster';

interface HeatmapLayerProps {
  data: HeatmapPoint[];
  opacity: number;
  visible: boolean;
  activeVariable: WeatherVariable;
  cacheKey: string;
}

const TILE_SIZE = 256;

export function HeatmapLayer({ data, opacity, visible, activeVariable, cacheKey }: HeatmapLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GridLayer | null>(null);
  const dataRef = useRef(data);
  const variableRef = useRef(activeVariable);
  const cacheKeyRef = useRef(cacheKey);
  const pointsRef = useRef(0);

  // The tile factory reads through these refs, so a timeline step only needs a
  // redraw() — the GridLayer itself is created once and never torn down.
  useEffect(() => {
    dataRef.current = data;
    variableRef.current = activeVariable;
    cacheKeyRef.current = cacheKey;
    pointsRef.current = data.length;
    const layer = layerRef.current;
    if (layer && visible && data.length) layer.redraw();
  }, [data, activeVariable, cacheKey, visible]);

  useEffect(() => {
    if (!visible) {
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
      return;
    }

    // Very small zoom-independent field: tiles sample it bilinearly at any zoom,
    // so there is no per-zoom raster rebuild and no visible LOD popping.
    const WeatherTiles = L.GridLayer.extend({
      createTile(coords: L.Coords) {
        const canvas = document.createElement('canvas');
        const res = 64;
        canvas.width = res;
        canvas.height = res;
        canvas.style.width = `${TILE_SIZE}px`;
        canvas.style.height = `${TILE_SIZE}px`;
        canvas.style.pointerEvents = 'none';
        canvas.style.imageRendering = 'auto';

        const context = canvas.getContext('2d');
        if (!context) return canvas;

        if (!pointsRef.current) return canvas;

        const rasters: FieldRaster[] = getFieldRasters(cacheKeyRef.current, dataRef.current, variableRef.current);

        // Tile lat/lng bounds (Web Mercator, y grows southwards).
        const zoom = coords.z;
        const nw = map.unproject(L.point(coords.x * TILE_SIZE, coords.y * TILE_SIZE), zoom);
        const se = map.unproject(L.point((coords.x + 1) * TILE_SIZE, (coords.y + 1) * TILE_SIZE), zoom);
        const tileBounds = L.latLngBounds(nw, se);

        const rastersInTile = rasters.filter((raster) => {
          const visible = tileBounds.getSouth() <= raster.bounds.north
            && tileBounds.getNorth() >= raster.bounds.south
            && tileBounds.getWest() <= raster.bounds.east
            && tileBounds.getEast() >= raster.bounds.west;
          return visible;
        });
        if (!rastersInTile.length) return canvas;

        const step = TILE_SIZE / res;
        const image = context.createImageData(res, res);
        const out = [0, 0, 0, 0];

        for (let y = 0; y < res; y++) {
          const pixelY = (y + 0.5) * step;
          for (let x = 0; x < res; x++) {
            const pixelX = (x + 0.5) * step;
            const location = map.unproject(L.point(coords.x * TILE_SIZE + pixelX, coords.y * TILE_SIZE + pixelY), zoom);

            let sampled = false;
            for (let i = 0; i < rastersInTile.length; i++) {
              if (sampleField(rastersInTile[i], location.lat, location.lng, out)) {
                sampled = true;
                break;
              }
            }
            if (!sampled) continue;

            const pixelIndex = (y * res + x) * 4;
            image.data[pixelIndex] = out[0];
            image.data[pixelIndex + 1] = out[1];
            image.data[pixelIndex + 2] = out[2];
            image.data[pixelIndex + 3] = out[3];
          }
        }

        context.putImageData(image, 0, 0);
        return canvas;
      },
    });

    const layer = new (WeatherTiles as any)({
      tileSize: TILE_SIZE,
      pane: 'overlayPane',
      opacity,
      noWrap: true,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 1,
    });

    layerRef.current = layer;
    layer.addTo(map);

    return () => {
      layer.remove();
      layerRef.current = null;
    };
    // `opacity` and `visible` are handled by dedicated effects; recreating the
    // layer on every data change is exactly what this refactor removes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, visible]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setOpacity(opacity);
    }
  }, [opacity]);

  return null;
}