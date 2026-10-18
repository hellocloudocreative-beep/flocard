/* ==========================================================================
   FLOCARD COMPACT PROFILE CARD
   Shared-element morphing trigger card featuring React Bits <ReflectiveCard />
   with WebGL brushed metal reflection, 3D interactive tilt, dynamic glare,
   and smooth morphing into the full digital profile & portfolio on click.
   ========================================================================== */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  ArrowUpRight,
  Sparkles,
  Phone,
  Mail,
  Maximize2,
  Sliders,
  ShieldCheck,
  Camera
} from 'lucide-react';
import ReflectiveCard from '../ReflectiveCard/ReflectiveCard';
import { downloadVCard } from '../../lib/vcard';

export default function CompactProfileCard({
  profile,
  onExpand,
  isLight = false,
  reducedMotion = false
}) {
  const [cardVariant, setCardVariant] = useState('reflective'); // 'reflective' | 'gradient'
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  const gradientStart = profile.gradientStart || '#130B22';
  const gradientMid = profile.gradientMid || '#240F3E';
  const gradientEnd = profile.gradientEnd || '#0B0813';
  const accentColor = profile.accentColor || '#A855F7';
  const glowColor = profile.glowColor || '#6B00FF';
  const creamHighlight = profile.creamHighlight || '#F5EDE5';
  const photoShape = profile.photoShape || 'circle';
  const isCircle = photoShape === 'circle';

  // Metal tint based on FLOCARD edition
  const metalTint = profile.edition === 'gold'
    ? '#F3CF8A'
    : profile.edition === 'platinum'
      ? '#FFFFFF'
      : '#D5C9E5';

  const glowShadow = profile.borderGlowIntensity === 'subtle'
    ? `0 18px 45px -10px ${glowColor}30, 0 0 20px ${glowColor}15`
    : profile.borderGlowIntensity === 'high'
      ? `0 30px 85px -12px ${glowColor}65, 0 0 45px ${glowColor}35, 0 0 0 1px ${accentColor}40`
      : `0 25px 70px -15px ${glowColor}45, 0 0 30px ${glowColor}25, 0 0 0 1px ${accentColor}25`;

  const transitionConfig = reducedMotion
    ? { duration: 0.15 }
    : { duration: 0.72, ease: [0.16, 1, 0.3, 1] };

  return (
    <motion.div
      layoutId="profile-card-container"
      transition={transitionConfig}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '460px',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* Top Card Variant Selector Pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          userSelect: 'none'
        }}
      >
        <button
          type="button"
          onClick={() => {
            setCardVariant('reflective');
            setWebcamEnabled(false);
          }}
          style={{
            padding: '5px 14px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: cardVariant === 'reflective' && !webcamEnabled ? accentColor : 'transparent',
            color: '#FFFFFF',
            boxShadow: cardVariant === 'reflective' && !webcamEnabled ? `0 2px 10px ${accentColor}60` : 'none'
          }}
        >
          <Sparkles size={12} />
          <span>Reflective Metal</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCardVariant('reflective');
            setWebcamEnabled(!webcamEnabled);
          }}
          title="Reflect your webcam in real-time on the metal card"
          style={{
            padding: '5px 14px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: cardVariant === 'reflective' && webcamEnabled ? '#10B981' : 'transparent',
            color: '#FFFFFF',
            boxShadow: cardVariant === 'reflective' && webcamEnabled ? '0 2px 10px rgba(16, 185, 129, 0.6)' : 'none'
          }}
        >
          <Camera size={12} />
          <span>{webcamEnabled ? 'Camera Active' : 'Live Mirror'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCardVariant('gradient');
            setWebcamEnabled(false);
          }}
          style={{
            padding: '5px 14px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: cardVariant === 'gradient' ? accentColor : 'transparent',
            color: '#FFFFFF',
            boxShadow: cardVariant === 'gradient' ? `0 2px 10px ${accentColor}60` : 'none'
          }}
        >
          <Sliders size={12} />
          <span>Cosmic Gradient</span>
        </button>
      </div>

      {/* Main Card Element */}
      {cardVariant === 'reflective' ? (
        <div
          style={{
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
          onClick={onExpand}
          title="Click to expand full profile & portfolio"
        >
          {/* Ambient Glow behind the reflective card */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '320px',
              height: '460px',
              borderRadius: '32px',
              background: `radial-gradient(ellipse at center, ${glowColor}40 0%, ${accentColor}20 50%, transparent 75%)`,
              filter: 'blur(30px)',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />

          {/* React Bits ReflectiveCard */}
          <ReflectiveCard
            name={profile.name}
            role={profile.role || 'Executive'}
            badge={profile.isVerified !== false ? 'FLOCARD Verified' : 'FLOCARD'}
            status={profile.company || 'NFC Active'}
            statusColor={accentColor}
            idLabel="NFC Smart Identity"
            idValue={profile.phone || profile.email || `NFC-${profile.slug?.toUpperCase() || '216'}`}
            theme={isLight ? 'light' : 'dark'}
            tint={metalTint}
            webcam={webcamEnabled}
            metalness={1}
            roughness={0.32}
            blurStrength={7}
            shine={1.2}
            glare={0.55}
            enableTilt={!reducedMotion}
            tiltStrength={12}
            width={340}
            height={500}
            radius={26}
            style={{
              boxShadow: glowShadow,
              zIndex: 1
            }}
          />

          {/* Floating Avatar Badge Over Reflective Card */}
          <motion.div
            layoutId="profile-card-avatar"
            transition={transitionConfig}
            style={{
              position: 'absolute',
              top: '72px',
              right: '26px',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              padding: '2px',
              background: `linear-gradient(135deg, ${glowColor} 0%, ${accentColor} 100%)`,
              boxShadow: `0 4px 18px ${glowColor}80`,
              zIndex: 3,
              overflow: 'hidden'
            }}
          >
            <img
              src={profile.avatar || profile.logo || '/assets/akhil.jpg'}
              alt={profile.name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </motion.div>
        </div>
      ) : (
        /* Classic Cosmic Gradient Card Option */
        <div
          onClick={onExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onExpand();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Expand full digital profile and portfolio for ${profile.name}`}
          style={{
            width: '100%',
            maxWidth: '450px',
            borderRadius: '36px',
            padding: '24px 22px 28px',
            background: `linear-gradient(155deg, ${gradientMid} 0%, ${gradientStart} 48%, ${gradientEnd} 100%)`,
            border: `1px solid ${accentColor}45`,
            boxShadow: glowShadow,
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
            overflow: 'hidden',
            userSelect: 'none'
          }}
        >
          {/* Ambient Sheen Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${creamHighlight}15 0%, ${accentColor}10 40%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          {/* Top Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              position: 'relative',
              zIndex: 2
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img
                src="/assets/logo-light.png"
                alt="FLOCARD"
                style={{ height: '22px', width: 'auto', display: 'block', objectFit: 'contain' }}
              />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${accentColor}40`,
                color: '#D5C9E5',
                fontSize: '0.72rem',
                fontWeight: 600
              }}
            >
              <Sparkles size={11} color={accentColor} />
              <span>Interactive Card</span>
            </div>
          </div>

          {/* Profile Identity Lockup */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              marginBottom: '18px',
              position: 'relative',
              zIndex: 2
            }}
          >
            <motion.div
              layoutId="profile-card-avatar"
              transition={transitionConfig}
              style={{
                width: isCircle ? '102px' : '96px',
                height: isCircle ? '102px' : '112px',
                minWidth: isCircle ? '102px' : '96px',
                borderRadius: isCircle ? '50%' : '20px',
                padding: '3px',
                background: `linear-gradient(135deg, ${glowColor} 0%, ${accentColor} 100%)`,
                boxShadow: `0 0 24px ${glowColor}60, inset 0 0 10px ${accentColor}40`,
                position: 'relative',
                overflow: 'visible',
                flexShrink: 0
              }}
            >
              <img
                src={profile.avatar || profile.logo || '/assets/akhil.jpg'}
                alt={profile.name}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: isCircle ? '50%' : '17px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              {profile.isVerified !== false && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: isCircle ? '2px' : '-4px',
                    right: isCircle ? '2px' : '-4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: glowColor,
                    border: '2px solid #0B0813',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <Check size={12} strokeWidth={3.2} />
                </div>
              )}
            </motion.div>

            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <motion.h1
                layoutId="profile-card-name"
                transition={transitionConfig}
                style={{
                  fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  margin: 0
                }}
              >
                {profile.name}
              </motion.h1>

              <motion.div
                layoutId="profile-card-role"
                transition={transitionConfig}
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginTop: '4px'
                }}
              >
                <span>{profile.role}</span>
              </motion.div>

              <motion.div
                layoutId="profile-card-company"
                transition={transitionConfig}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#D5C9E5',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginTop: '4px'
                }}
              >
                <span>{profile.company}</span>
              </motion.div>
            </div>
          </div>

          {profile.bio && (
            <p
              style={{
                fontSize: '0.84rem',
                color: '#D5C9E5',
                lineHeight: 1.48,
                marginTop: 0,
                marginBottom: '18px',
                opacity: 0.92,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {profile.bio}
            </p>
          )}
        </div>
      )}

      {/* Quick Action Buttons Row */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          width: '100%',
          maxWidth: '360px',
          marginTop: '16px',
          position: 'relative',
          zIndex: 10
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {profile.phone && (
          <a
            href={`tel:${profile.phone}`}
            title="Call"
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
          >
            <Phone size={14} color={accentColor} />
            <span>Call</span>
          </a>
        )}

        {profile.email && (
          <a
            href={`mailto:${profile.email}`}
            title="Email"
            style={{
              flex: 1,
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
          >
            <Mail size={14} color={accentColor} />
            <span>Email</span>
          </a>
        )}

        <button
          type="button"
          onClick={() => downloadVCard(profile)}
          title="Save Contact"
          style={{
            flex: 1.3,
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={14} color={accentColor} />
          <span>Save vCard</span>
        </button>
      </div>

      {/* Primary Tap to Expand Banner Button */}
      <button
        type="button"
        onClick={onExpand}
        style={{
          width: '100%',
          maxWidth: '360px',
          marginTop: '12px',
          padding: '13px 18px',
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${glowColor} 0%, ${accentColor} 100%)`,
          border: 'none',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.88rem',
          fontWeight: 700,
          boxShadow: `0 10px 25px -5px ${glowColor}70`,
          cursor: 'pointer',
          position: 'relative',
          zIndex: 10,
          transition: 'transform 0.2s ease'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Maximize2 size={16} />
          <span>Click to View Full Profile & Portfolio</span>
        </span>
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowUpRight size={15} />
        </div>
      </button>

      {/* Helper text */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '10px',
          fontSize: '0.74rem',
          color: '#D5C9E5',
          opacity: 0.65,
          letterSpacing: '0.3px',
          position: 'relative',
          zIndex: 10
        }}
      >
        Move cursor over card for 3D metallic reflection • Click to expand
      </div>
    </motion.div>
  );
}
