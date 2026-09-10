import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { HeatmapPoint } from '../types';
import { interpolateWindVector } from '../services/weatherLayers';

interface WindParticlesLayerProps {
  data: HeatmapPoint[];
  visible: boolean;
  opacity?: number;
  densityScale?: number;
}

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

interface WindGrid {
  cols: number;
  rows: number;
  stepX: number;
  stepY: number;
  u: Float32Array;
  v: Float32Array;
  coverage: Float32Array;
}

const GRID_COLS = 64;
const DPR_CAP = 1.5;

export const WindParticlesLayer: React.FC<WindParticlesLayerProps> = ({
  data,
  visible,
  opacity = 0.85,
  densityScale = 1,
}) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const dataRef = useRef(data);
  const gridRef = useRef<WindGrid | null>(null);
  const gridDirtyRef = useRef(true);
  const mountedRef = useRef(true);

  // Keep the latest data without tearing down the animation loop on every
  // timeline step; the next frame recomputes the wind grid from it.
  useEffect(() => {
    dataRef.current = data;
    gridDirtyRef.current = true;
  }, [data]);

  useEffect(() => {
    mountedRef.current = true;

    const container = map.getContainer();
    let canvas = canvasRef.current;

    const clearCanvas = () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };

    if (!visible) {
      clearCanvas();
      return;
    }

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

      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
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

    // Particle count scaled to screen size (between 350 and 800), reduced at overview zoom
    const size = map.getSize();
    const particleCount = Math.max(200, Math.min(800, Math.floor(((size.x * size.y) / 1600) * densityScale)));

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

    // Precompute the wind vector field once per (data, viewport) into a coarse
    // grid, then sample that grid per particle every frame instead of running
    // a 39-station interpolation for each of the ~800 particles (~50x cheaper).
    const computeGrid = () => {
      const pts = dataRef.current;
      const currentSize = map.getSize();
      if (!currentSize.x || !currentSize.y || !pts.length) {
        gridRef.current = null;
        return;
      }

      const cols = GRID_COLS;
      const rows = Math.max(4, Math.round((cols * currentSize.y) / currentSize.x));
      const u = new Float32Array(cols * rows);
      const v = new Float32Array(cols * rows);
      const coverage = new Float32Array(cols * rows);
      const stepX = currentSize.x / cols;
      const stepY = currentSize.y / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const latLng = map.containerPointToLatLng(L.point((c + 0.5) * stepX, (r + 0.5) * stepY));
          const sample = interpolateWindVector(pts, latLng.lat, latLng.lng);
          const idx = r * cols + c;
          if (sample) {
            u[idx] = sample.u;
            v[idx] = sample.v;
            coverage[idx] = sample.coverage;
          }
        }
      }

      gridRef.current = { cols, rows, stepX, stepY, u, v, coverage };
    };

    let isRunning = true;

    const render = () => {
      if (!isRunning || !canvas) return;

      if (gridDirtyRef.current || !gridRef.current) {
        computeGrid();
        gridDirtyRef.current = false;
      }

      const currentSize = map.getSize();
      const w = currentSize.x;
      const h = currentSize.y;
      const grid = gridRef.current;

      // Silky trail fade effect (motion blur trail like Windy)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      const zoom = map.getZoom();
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

        if (!grid) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.age = 0;
          continue;
        }

        const col = Math.min(grid.cols - 1, Math.max(0, Math.floor(p.x / grid.stepX)));
        const row = Math.min(grid.rows - 1, Math.max(0, Math.floor(p.y / grid.stepY)));
        const idx = row * grid.cols + col;

        const coverage = grid.coverage[idx];
        const speed = Math.hypot(grid.u[idx], grid.v[idx]);

        if (coverage <= 0.05 || speed < 0.5) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.age = 0;
          continue;
        }

        // Cartesian displacement (u: east, v: north -> in canvas screen coords: dy is negative for north)
        const dx = grid.u[idx] * speedScale;
        const dy = -grid.v[idx] * speedScale;

        const nextX = p.x + dx;
        const nextY = p.y + dy;

        // Color coding particle brightness by wind intensity
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nextX, nextY);

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
      gridDirtyRef.current = true;
    };

    const onZoom = () => {
      updateCanvasSizeAndPosition();
      gridDirtyRef.current = true;
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Stop painting while the tab is hidden; resume when it becomes visible again.
    const onVisibility = () => {
      if (!mountedRef.current) return;
      if (document.hidden) {
        isRunning = false;
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      } else if (visible) {
        gridDirtyRef.current = true;
        isRunning = true;
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    map.on('move', onMove);
    map.on('zoom', onZoom);
    map.on('resize', onMove);

    return () => {
      mountedRef.current = false;
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      document.removeEventListener('visibilitychange', onVisibility);
      map.off('move', onMove);
      map.off('zoom', onZoom);
      map.off('resize', onMove);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
        canvasRef.current = null;
      }
      gridRef.current = null;
    };
  }, [map, visible, opacity, densityScale]);

  return null;
};