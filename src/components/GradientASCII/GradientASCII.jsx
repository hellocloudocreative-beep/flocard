'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { createRenderer } from './renderer';
import { DEFAULTS } from './presets';

export default function GradientASCII({
  colors = ["#731ed8", "#f6f8ff", "#cda5ff", "#7038f8"],
  shape = 'horizon',
  characters = ' .·•●',
  cellSize = 18,
  density = 0.8,
  dpr = 2,
  interactive = true,
  className = '',
  style = {}
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rendererRef = useRef(null);

  const settings = useMemo(() => {
    return {
      ...DEFAULTS,
      colors: colors && colors.length >= 2 ? colors : DEFAULTS.colors,
      shape: shape || 'horizon',
      characters: characters || DEFAULTS.characters,
      cellSize: cellSize || 18,
      density: density !== undefined ? density : 0.8,
      mouseInteraction: interactive
    };
  }, [colors, shape, characters, cellSize, density, interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer = null;
    try {
      renderer = createRenderer(canvas);
      rendererRef.current = renderer;
    } catch (err) {
      console.warn('WebGL GradientASCII failed to initialize:', err);
      return;
    }

    let onScreen = true;
    const update = () => {
      renderer?.active(onScreen && !document.hidden);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', update);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      renderer?.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.set(settings, false, dpr);
    }
  }, [settings, dpr]);

  const handlePointerMove = (e) => {
    if (!interactive || !rendererRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    rendererRef.current.pointer(x, y);
  };

  const handlePointerLeave = () => {
    if (rendererRef.current) {
      rendererRef.current.pointer(null);
    }
  };

  const handlePointerDown = (e) => {
    if (!interactive || !rendererRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    rendererRef.current.click(x, y);
  };

  return (
    <div
      ref={containerRef}
      className={`gradient-ascii-wrap ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: interactive ? 'auto' : 'none',
        ...style
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
}
