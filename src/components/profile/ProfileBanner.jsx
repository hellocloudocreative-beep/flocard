/* ==========================================================================
   FLOCARDS DISCORD/FACEBOOK-STYLE PROFILE BANNER
   Features:
   - Configurable landscape image, solid color, gradient, or looping video
   - Responsive height with configurable zoom & object-position (X/Y)
   - Dark gradient overlay for text readability
   - Reduced-motion support (pauses video, uses poster/fallback)
   - Clean overlap zone for profile picture
   - Zero temporary blob URL persistence
   ========================================================================== */

import React, { useState, useEffect } from 'react';

export default function ProfileBanner({
  banner = {},
  accentColor = '#A855F7',
  glowColor = '#6B00FF',
  isLight = false,
  reducedMotion = false
}) {
  const [videoError, setVideoError] = useState(false);

  if (banner?.enabled === false) {
    return null;
  }

  const type = banner?.type || 'image';
  const bannerUrl = banner?.url || '/assets/hero-bg.jpg';
  const posX = typeof banner?.positionX === 'number' ? banner.positionX : 50;
  const posY = typeof banner?.positionY === 'number' ? banner.positionY : 50;
  const zoom = typeof banner?.zoom === 'number' ? banner.zoom : 100;
  const heightPx = banner?.height || 280;
  const overlayOpacity = typeof banner?.overlayOpacity === 'number' ? banner.overlayOpacity : (isLight ? 0.2 : 0.45);
  const overlayColor = banner?.overlayColor || (isLight ? '#FFFFFF' : '#08060D');

  const gradientStart = banner?.gradientStart || '#2e1065';
  const gradientEnd = banner?.gradientEnd || '#090514';
  const solidColor = banner?.solidColor || '#1a0b2e';

  return (
    <div
      className="flocard-profile-banner-container"
      style={{
        width: '100%',
        height: `clamp(160px, 28vw, ${heightPx}px)`,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: solidColor,
        zIndex: 1
      }}
    >
      {/* 1. Image Banner */}
      {type === 'image' && bannerUrl && (
        <img
          src={bannerUrl}
          alt="Profile cover banner"
          loading="eager"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${posX}% ${posY}%`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: `${posX}% ${posY}%`,
            display: 'block',
            transition: 'transform 0.2s ease, object-position 0.2s ease'
          }}
          onError={(e) => {
            // Graceful fallback to default asset if custom image fails
            if (e.target.src !== '/assets/hero-bg.jpg') {
              e.target.src = '/assets/hero-bg.jpg';
            }
          }}
        />
      )}

      {/* 2. Looping Video Banner */}
      {type === 'video' && bannerUrl && !videoError && (
        <video
          src={bannerUrl}
          autoPlay={!reducedMotion}
          loop
          muted
          playsInline
          poster="/assets/hero-bg.jpg"
          onError={() => setVideoError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${posX}% ${posY}%`,
            transform: `scale(${zoom / 100})`,
            display: 'block'
          }}
        />
      )}

      {/* 3. Gradient Banner */}
      {type === 'gradient' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`
          }}
        />
      )}

      {/* 4. Solid Color Banner */}
      {type === 'color' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: solidColor
          }}
        />
      )}

      {/* Subtle Readability & Transition Gradient Overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,${overlayOpacity * 0.5}) 60%, ${overlayColor} 100%)`,
          pointerEvents: 'none'
        }}
      />

      {/* Ambient Top Glow Line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
          opacity: 0.65,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
