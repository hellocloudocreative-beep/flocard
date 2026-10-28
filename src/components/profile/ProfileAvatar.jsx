/* ==========================================================================
   FLOCARD SHARED PROFILE AVATAR COMPONENT
   Guarantees 100% visual and asset consistency between Collapsed & Expanded states.
   - Shared Framer Motion layoutId for seamless physics-based morphing
   - Zero image reloading or flicker
   - Unified fallback badge (Gold with FLOCARD monogram & sparkles)
   ========================================================================== */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function ProfileAvatar({
  profile = {},
  size = 108,
  glowColor = '#C9972C',
  accentColor = '#E9C766',
  isCircle: propIsCircle = true,
  className = '',
  style = {},
  transitionConfig
}) {
  const [imgError, setImgError] = useState(false);

  // Respect profile.photoShape if specified, otherwise fallback to prop
  const isCircle = profile?.photoShape ? profile.photoShape === 'circle' : propIsCircle;
  const avatarPosX = typeof profile?.avatarPosX === 'number' ? profile.avatarPosX : 50;
  const avatarPosY = typeof profile?.avatarPosY === 'number' ? profile.avatarPosY : 50;
  const avatarZoom = typeof profile?.avatarZoom === 'number' ? profile.avatarZoom : 100;

  // Never fallback to demo picture if profile has no picture!
  // If profile has an avatar or logo, use that. Otherwise, use the gold FLOCARD badge.
  const rawImage = profile?.avatar || profile?.logo;
  const hasValidImage = Boolean(rawImage && String(rawImage).trim() && !imgError);

  const borderRadius = isCircle ? '50%' : `${Math.round(size * 0.24)}px`;
  const innerRadius = isCircle ? '50%' : `${Math.round(size * 0.21)}px`;

  return (
    <motion.div
      layoutId="flocard-shared-profile-avatar"
      transition={transitionConfig || {
        type: 'spring',
        stiffness: 280,
        damping: 28,
        mass: 0.9
      }}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius,
        padding: '3px',
        background: `linear-gradient(135deg, ${accentColor} 0%, ${glowColor} 100%)`,
        boxShadow: `0 8px 30px ${glowColor}60, 0 0 0 1px ${accentColor}50`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style
      }}
    >
      {hasValidImage ? (
        <img
          src={rawImage}
          alt={profile?.name || 'User Profile'}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: innerRadius,
            objectFit: 'cover',
            objectPosition: `${avatarPosX}% ${avatarPosY}%`,
            transform: `scale(${avatarZoom / 100})`,
            transformOrigin: `${avatarPosX}% ${avatarPosY}%`,
            display: 'block',
            transition: 'transform 0.15s ease, object-position 0.15s ease'
          }}
          loading="eager"
        />
      ) : (
        /* Consistent fallback: Premium Gold FLOCARD Identity Monogram */
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: innerRadius,
            background: 'linear-gradient(135deg, #ECC86A 0%, #C9972C 50%, #9C6B13 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${Math.max(2, Math.round(size * 0.04))}px`,
            boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.4)',
            userSelect: 'none'
          }}
        >
          <Sparkles
            size={Math.round(size * 0.22)}
            color="#FFF4CE"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          />
          <span
            style={{
              fontSize: `${Math.max(9, Math.round(size * 0.105))}px`,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#341D05',
              fontFamily: 'var(--font-heading, Sora)',
              textShadow: '0 1px 0 rgba(255, 255, 255, 0.3)'
            }}
          >
            FLOCARD
          </span>
        </div>
      )}
    </motion.div>
  );
}
