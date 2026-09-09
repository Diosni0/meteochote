import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { HeatmapPoint } from '../types';
import { interpolateWindVector } from '../services/weatherLayers';

interface WindParticlesLayerProps {
  data: HeatmapPoint[];
  visible: boolean;
  opacity?: number;
}

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

export const WindParticlesLayer: React.FC<WindParticlesLayerProps> = ({
  data,
  visible,
  opacity = 0.85,
}) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (!visible || !data.length) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const container = map.getContainer();
    let canvas = canvasRef.current;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'leaflet-wind-particles-canvas';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '450';
      canvas.style.transition = 'opacity 0.2s ease';
      map.getPanes().overlayPane.appendChild(canvas);
      canvasRef.current = canvas;
    }

    canvas.style.opacity = `${opacity}`;

    const updateCanvasSizeAndPosition = () => {
      if (!canvas) return;
      const size = map.getSize();
      const topLeft = map.containerPointToLayerPoint([0, 0]);

      L.DomUtil.setPosition(canvas, topLeft);

      const dpr = window.devicePixelRatio || 1;
      const targetW = size.x;
      const targetH = size.y;

      if (canvas.width !== targetW * dpr || canvas.height !== targetH * dpr) {
        canvas.width = targetW * dpr;
        canvas.height = targetH * dpr;
        canvas.style.width = `${targetW}px`;
        canvas.style.height = `${targetH}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
      }
    };

    updateCanvasSizeAndPosition();

    // Particle count scaled to screen size (between 500 and 1200)
    const size = map.getSize();
    const particleCount = Math.min(1200, Math.max(500, Math.floor((size.x * size.y) / 1000)));

    // Initialize particles
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * size.x,
        y: Math.random() * size.y,
        age: Math.floor(Math.random() * 60),
        maxAge: 40 + Math.floor(Math.random() * 50),
      });
    }
    particlesRef.current = particles;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning || !canvas) return;

      const currentSize = map.getSize();
      const w = currentSize.x;
      const h = currentSize.y;

      // Silky trail fade effect (motion blur trail like Windy)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      const zoom = map.getZoom();
      // Adjust particle speed factor according to zoom
      const speedScale = 0.05 * Math.max(0.6, Math.min(2.5, Math.pow(1.15, zoom - 5)));

      const activeParticles = particlesRef.current;
      for (let i = 0; i < activeParticles.length; i++) {
        const p = activeParticles[i];

        if (p.age >= p.maxAge || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.age = 0;
          p.maxAge = 40 + Math.floor(Math.random() * 50);
          continue;
        }

        const latLng = map.containerPointToLatLng(L.point(p.x, p.y));
        const sample = interpolateWindVector(data, latLng.lat, latLng.lng);

        if (!sample || sample.coverage <= 0.05 || sample.speed < 0.5) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.age = 0;
          continue;
        }

        // Cartesian displacement (u: east, v: north -> in canvas screen coords: dy is negative for north)
        const dx = sample.u * speedScale;
        const dy = -sample.v * speedScale;

        const nextX = p.x + dx;
        const nextY = p.y + dy;

        // Color coding particle brightness by wind intensity
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nextX, nextY);

        const speed = sample.speed;
        if (speed >= 40) {
          ctx.strokeStyle = `rgba(254, 202, 202, ${Math.min(0.9, 0.4 + (p.age / p.maxAge) * 0.5)})`; // Reddish alert
          ctx.lineWidth = 1.8;
        } else if (speed >= 25) {
          ctx.strokeStyle = `rgba(253, 224, 71, ${Math.min(0.85, 0.35 + (p.age / p.maxAge) * 0.5)})`; // Golden yellow
          ctx.lineWidth = 1.5;
        } else if (speed >= 15) {
          ctx.strokeStyle = `rgba(103, 232, 249, ${Math.min(0.8, 0.3 + (p.age / p.maxAge) * 0.5)})`; // Cyan
          ctx.lineWidth = 1.3;
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.7, 0.2 + (p.age / p.maxAge) * 0.5)})`; // Soft white
          ctx.lineWidth = 1.1;
        }

        ctx.stroke();

        p.x = nextX;
        p.y = nextY;
        p.age++;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    const onMove = () => {
      updateCanvasSizeAndPosition();
    };

    const onZoom = () => {
      updateCanvasSizeAndPosition();
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    map.on('move', onMove);
    map.on('zoom', onZoom);
    map.on('resize', onMove);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      map.off('move', onMove);
      map.off('zoom', onZoom);
      map.off('resize', onMove);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
        canvasRef.current = null;
      }
    };
  }, [map, data, visible, opacity]);

  return null;
};
