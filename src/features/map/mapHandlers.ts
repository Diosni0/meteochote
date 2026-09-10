import React, { useEffect } from 'react';
import { useMapEvents, useMap } from 'react-leaflet';

// Handles map clicks
export const MapEventsHandler: React.FC<{ onSelectCoords: (lat: number, lon: number) => void }> = ({ onSelectCoords }) => {
  useMapEvents({
    click(e) {
      onSelectCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Smooth flying controller
export const FlyToCenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  const [lat, lon] = center;
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom(), {
      duration: 1.0,
    });
  }, [lat, lon, map]);
  return null;
};

// Reports the current zoom so the map can scale detail level (render LOD)
export const ZoomTracker: React.FC<{ onZoomChange: (zoom: number) => void }> = ({ onZoomChange }) => {
  const map = useMap();
  useEffect(() => {
    const handler = () => onZoomChange(map.getZoom());
    map.on('zoomend', handler);
    return () => {
      map.off('zoomend', handler);
    };
  }, [map, onZoomChange]);
  return null;
};