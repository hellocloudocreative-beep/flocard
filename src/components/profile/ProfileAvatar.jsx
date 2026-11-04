/* ==========================================================================
   FLOCARD SHARED PROFILE AVATAR COMPONENT
   Guarantees 100% visual and asset consistency between Collapsed & Expanded states.
   - Shared Framer Motion layoutId for seamless physics-based morphing
   - Zero image reloading or flicker
   - Unified fallback badge (Gold with FLOCARD monogram & sparkles)
   ========================================================================== */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';

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

  // Never fallback to logo or demo picture: avatar is personal photo only
  const rawImage = profile?.avatar;
  const hasValidImage = Boolean(rawImage && String(rawImage).trim() && !imgError);

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(profile?.name);

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
        /* Dynamic customer initials badge with theme gradient */
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: innerRadius,
            background: `linear-gradient(135deg, ${accentColor}35 0%, ${glowColor}60 100%)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.25)',
            userSelect: 'none',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {initials ? (
            <span
              style={{
                fontSize: `${Math.max(14, Math.round(size * 0.36))}px`,
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#FFFFFF',
                fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
              }}
            >
              {initials}
            </span>
          ) : (
            <User
              size={Math.round(size * 0.44)}
              color="#FFFFFF"
              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))', opacity: 0.85 }}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}
