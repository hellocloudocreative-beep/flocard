/* ==========================================================================
   FLOCARD 3D CARD PREVIEW WITH MOUSE TILT & SMOOTH FLIP
   ========================================================================== */

import React, { useState, useRef, useEffect } from 'react';
import CardCanvas from './CardCanvas';
import { RotateCw } from 'lucide-react';

export default function Card3DPreview({
  edition = 'purple',
  templateType = 'standard',
  config = {},
  width = 440,
  initialSide = 'front',
  side: controlledSide,
  onSideChange,
  allowFlip = true,
  enableTilt = true,
  showGuides = false,
  showBleed = false,
  onLogoWarningChange,
  className = ''
}) {
  const [internalSide, setInternalSide] = useState(initialSide);
  const activeSide = controlledSide !== undefined ? controlledSide : internalSide;
  const cardRef = useRef(null);
  const height = Math.round(width / 1.585);

  const getInitialAngle = () => (activeSide === 'back' ? 180 : 0);
  const [transform, setTransform] = useState(`perspective(1000px) rotateX(0deg) rotateY(${getInitialAngle()}deg)`);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  // Whenever the active side changes (from parent or internally), animate flip smoothly
  useEffect(() => {
    const isBack = activeSide === 'back';
    const flipAngle = isBack ? 180 : 0;
    setTransform(`perspective(1000px) rotateX(0deg) rotateY(${flipAngle}deg)`);
  }, [activeSide]);

  const handleMouseMove = (e) => {
    if (!enableTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 14;

    const isBack = activeSide === 'back';
    const flipAngle = isBack ? 180 : 0;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${(rotateY + flipAngle).toFixed(2)}deg)`);
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35
    });
  };

  const handleMouseLeave = () => {
    const isBack = activeSide === 'back';
    const flipAngle = isBack ? 180 : 0;
    setTransform(`perspective(1000px) rotateX(0deg) rotateY(${flipAngle}deg)`);
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  const toggleFlip = (e) => {
    e?.stopPropagation();
    const nextSide = activeSide === 'front' ? 'back' : 'front';
    if (controlledSide === undefined) {
      setInternalSide(nextSide);
    }
    if (onSideChange) {
      onSideChange(nextSide);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`card-3d-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        perspective: '1200px',
        margin: '0 auto',
        cursor: allowFlip ? 'pointer' : 'default'
      }}
      onClick={allowFlip ? toggleFlip : undefined}
    >
      <div
        className="card-3d-flipper"
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: transform,
          position: 'relative'
        }}
      >
        {/* FRONT FACE */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)'
          }}
        >
          <CardCanvas
            side="front"
            templateType={config.templateType || templateType}
            edition={edition}
            config={config}
            width={width}
            showGuides={showGuides}
            showBleed={showBleed}
            onLogoWarningChange={onLogoWarningChange}
          />
        </div>

        {/* BACK FACE */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <CardCanvas
            side="back"
            templateType={config.templateType || templateType}
            edition={edition}
            config={config}
            width={width}
            showGuides={showGuides}
            showBleed={showBleed}
          />
        </div>

        {/* Dynamic Light Reflection / Glare */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '16px',
            pointerEvents: 'none',
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, ${glare.opacity}), transparent 55%)`,
            transition: 'opacity 0.2s ease',
            zIndex: 5
          }}
        />
      </div>

      {/* Floating Flip Trigger Button */}
      {allowFlip && (
        <button
          type="button"
          onClick={toggleFlip}
          className="btn-flip-hint"
          aria-label="Flip card view"
          style={{
            position: 'absolute',
            bottom: '-14px',
            right: '16px',
            background: 'rgba(23, 16, 32, 0.9)',
            border: '1px solid var(--border-color)',
            color: 'var(--light-lavender)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          <RotateCw size={13} />
          <span>Flip to {activeSide === 'front' ? 'Back' : 'Front'}</span>
        </button>
      )}
    </div>
  );
}
