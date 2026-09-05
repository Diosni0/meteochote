import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import h337 from 'heatmap.js';
import { WeatherVariable } from '../types';

interface HeatmapLayerProps {
  data: Array<{ x: number; y: number; value: number }>;
  radius?: number;
  blur?: number;
  maxOpacity?: number;
  minOpacity?: number;
  gradient?: Record<string, string>;
  visible: boolean;
  activeVariable?: WeatherVariable;
}

const defaultGradients = {
  temperature: {
    0.2: '#0000FF',
    0.4: '#00FFFF',
    0.6: '#00FF00',
    0.8: '#FFFF00',
    1.0: '#FF0000'
  },
  precipitation: {
    0.2: '#FFFFFF',
    0.4: '#B0E0E6',
    0.6: '#87CEEB',
    0.8: '#00BFFF',
    1.0: '#0000FF'
  },
  wind: {
    0.2: '#00FF00',
    0.4: '#ADFF2F',
    0.6: '#FFFF00',
    0.8: '#FF8C00',
    1.0: '#FF0000'
  }
};

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  data,
  radius = 30,
  blur = 15,
  maxOpacity = 0.7,
  minOpacity = 0.1,
  visible,
  activeVariable = 'temperature',
}) => {
  const map = useMap();
  const heatmapRef = useRef<any | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map || !wrapperRef.current) return;

    // Create wrapper div
    const wrapper = wrapperRef.current;
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.zIndex = '500';

    // Create heatmap instance
    const heatmap = h337.create({
      container: wrapper,
      radius: radius,
      blur: blur,
      maxOpacity: maxOpacity,
      minOpacity: minOpacity,
      gradient: defaultGradients[activeVariable as keyof typeof defaultGradients],
    });

    heatmapRef.current = heatmap;

    // Update data
    if (data && data.length > 0) {
      const maxVal = Math.max(...data.map(d => d.value));
      const minVal = Math.min(...data.map(d => d.value));
      
      heatmap.setData({
        max: maxVal,
        min: minVal,
        data: data,
      });
    }

    // Update position on map events
    const updateHeatmapPosition = () => {
      if (heatmapRef.current && wrapperRef.current) {
        wrapperRef.current.style.width = map.getSize().x + 'px';
        wrapperRef.current.style.height = map.getSize().y + 'px';
        wrapperRef.current.style.left = '0px';
        wrapperRef.current.style.top = '0px';
      }
    };

    map.on('moveend zoomend', updateHeatmapPosition);
    updateHeatmapPosition();

    return () => {
      map.off('moveend zoomend', updateHeatmapPosition);
      if (heatmapRef.current) {
        heatmapRef.current.remove();
      }
    };
  }, [map, data, radius, blur, maxOpacity, minOpacity, activeVariable]);

  // Handle visibility changes
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.display = visible ? 'block' : 'none';
    }
  }, [visible]);

  // Update data when it changes
  useEffect(() => {
    if (heatmapRef.current && data && data.length > 0) {
      const maxVal = Math.max(...data.map(d => d.value));
      const minVal = Math.min(...data.map(d => d.value));
      heatmapRef.current.setData({
        max: maxVal,
        min: minVal,
        data: data,
      });
    }
  }, [data]);

  if (!visible) return null;

  return (
    <div 
      ref={wrapperRef}
    />
  );
};
