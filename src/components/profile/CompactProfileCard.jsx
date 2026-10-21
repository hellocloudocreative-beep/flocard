/* ==========================================================================
   FLOCARD COMPACT PROFILE CARD
   Interactive luxury digital identity card powered by official FLOCARD
   portrait card background (cardbg[purple].png portrait edition) with 3D tilt tracking,
   dynamic specular glare, centered user portrait, prominent Direct Connect icons,
   and in-card action buttons.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Building2,
  ExternalLink,
  Zap
} from 'lucide-react';
import {
  PhoneIcon,
  MailIcon,
  WhatsappIcon,
  GlobeIcon,
  LinkedinIcon,
  InstagramIcon,
  TwitterIcon,
  GithubIcon
} from '../SocialIcons';
import ProfileAvatar from './ProfileAvatar';
import { resolveProfileLinks, DynamicLinkIcon } from '../../lib/socialLinkResolver';
import { downloadVCard } from '../../lib/vcard';

export default function CompactProfileCard({
  profile,
  onExpand,
  isLight = false,
  reducedMotion = false,
  allowColorSwitch = true,
  onColorChange
}) {
  const [activeFinish, setActiveFinish] = useState(
    profile?.cardFinish ||
      (profile?.edition === 'gold'
        ? 'gold'
        : profile?.edition === 'platinum' || profile?.edition === 'steel'
          ? 'steel'
          : profile?.edition === 'metal'
            ? 'metal'
            : 'purple')
  );

  useEffect(() => {
    if (profile?.cardFinish) {
      setActiveFinish(profile.cardFinish);
    } else if (profile?.edition === 'gold') {
      setActiveFinish('gold');
    } else if (profile?.edition === 'platinum' || profile?.edition === 'steel') {
      setActiveFinish('steel');
    } else if (profile?.edition === 'metal') {
      setActiveFinish('metal');
    } else {
      setActiveFinish('purple');
    }
  }, [profile?.cardFinish, profile?.edition]);

  const finishTints = {
    steel: '#E2E8F0',
    gold: '#E9C766',
    purple: '#A855F7',
    metal: '#CBD5E1'
  };

  const finishGlows = {
    steel: '#64748B',
    gold: '#C9972C',
    purple: profile?.glowColor || '#6B00FF',
    metal: '#64748B'
  };

  const finishAccents = {
    steel: '#94A3B8',
    gold: '#E9C766',
    purple: profile?.accentColor || '#A855F7',
    metal: '#CBD5E1'
  };

  const finishPortraitBgs = {
    purple: '/assets/cardbg-purple-portrait.png',
    gold: '/assets/cardbg-gold-portrait.png',
    steel: '/assets/cardbg-platinum-portrait.png',
    platinum: '/assets/cardbg-platinum-portrait.png',
    metal: '/assets/cardbg-metal-portrait.png'
  };

  const portraitBg =
    profile?.cardPortraitBg ||
    finishPortraitBgs[activeFinish] ||
    finishPortraitBgs.purple;

  const accentColor = finishAccents[activeFinish] || profile?.accentColor || '#A855F7';
  const glowColor = finishGlows[activeFinish] || profile?.glowColor || '#6B00FF';
  const photoShape = profile?.photoShape || 'circle';
  const isCircle = photoShape === 'circle';

  const glowShadow = profile?.borderGlowIntensity === 'subtle'
    ? `0 18px 45px -10px ${glowColor}30, 0 0 20px ${glowColor}15`
    : profile?.borderGlowIntensity === 'high'
      ? `0 30px 85px -12px ${glowColor}65, 0 0 45px ${glowColor}35, 0 0 0 1px ${accentColor}40`
      : `0 25px 70px -15px ${glowColor}45, 0 0 30px ${glowColor}25, 0 0 0 1px ${accentColor}25`;

  const transitionConfig = reducedMotion
    ? { duration: 0.15 }
    : { type: 'spring', stiffness: 280, damping: 28, mass: 0.88 };

  const idCode = profile?.phone || profile?.email || `NFC-${profile?.slug?.toUpperCase() || '216'}`;

  // Interactive 3D tilt tracking with specular light reflection
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, glareOpacity: 0 });

  const handleMouseMove = (e) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 8.5;
    const rotateX = -((y - centerY) / centerY) * 8.5;
    setTilt({
      x: rotateX,
      y: rotateY,
      glareX: x,
      glareY: y,
      glareOpacity: 0.55
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, glareOpacity: 0 });
  };

  return (
    <motion.div
      layoutId="profile-card-container"
      transition={transitionConfig}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '520px',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* Main Luxury Profile Card Element */}
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
      >
        {/* Ambient Glow behind the card */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '410px',
            height: '620px',
            borderRadius: '30px',
            background: `radial-gradient(ellipse at center, ${glowColor}50 0%, ${accentColor}25 50%, transparent 75%)`,
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* FLOCARD Portrait Artwork Card Container (Substantial, Executive Scale) */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: '414px',
            maxWidth: 'calc(100vw - 24px)',
            height: '640px',
            borderRadius: '28px',
            backgroundImage: `url(${portraitBg})`,
            backgroundColor: '#0C0816',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            overflow: 'hidden',
            border: `1.5px solid ${accentColor}55`,
            boxShadow: glowShadow,
            transform: reducedMotion
              ? 'none'
              : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
            transformStyle: 'preserve-3d',
            padding: '26px 24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 1
          }}
        >
          {/* Subtle Dynamic Glare Sheen Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle 280px at ${tilt.glareX}px ${tilt.glareY}px, rgba(255, 255, 255, ${tilt.glareOpacity * 0.22}), transparent 70%)`,
              pointerEvents: 'none',
              opacity: tilt.glareOpacity,
              transition: 'opacity 0.25s ease',
              zIndex: 1
            }}
          />

          {/* Luxury Obsidian Gradient Overlay for Text Readability */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(8, 4, 14, 0.45) 0%, rgba(8, 4, 14, 0.2) 40%, rgba(8, 4, 14, 0.72) 100%)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          {/* Top Row: Verified Badge & Live Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              position: 'relative',
              zIndex: 3
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#f4f4f5',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                padding: '4px 10px',
                borderRadius: '9999px',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              <ShieldCheck size={14} color="#10B981" />
              <span>{profile?.isVerified !== false ? 'FLOCARD Verified' : 'FLOCARD'}</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: 'rgba(244, 244, 245, 0.9)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                padding: '4px 10px',
                borderRadius: '9999px',
                backdropFilter: 'blur(8px)'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 8px #10B981'
                }}
              />
              <span>{profile?.company || 'NFC Active'}</span>
            </div>
          </div>

          {/* Center Area: Centered User Image & Profile Information */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              margin: 'auto 0',
              padding: '4px 0',
              position: 'relative',
              zIndex: 3
            }}
          >
            {/* Centered User Image via Shared ProfileAvatar */}
            <ProfileAvatar
              profile={profile}
              size={108}
              glowColor={glowColor}
              accentColor={accentColor}
              isCircle={isCircle}
              transitionConfig={transitionConfig}
              style={{ marginBottom: '14px' }}
            />

            {/* User Name with Shared Morphing */}
            <motion.h2
              layoutId="flocard-shared-profile-name"
              transition={transitionConfig}
              style={{
                fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                fontSize: '1.68rem',
                fontWeight: 700,
                color: '#ffffff',
                margin: '0 0 4px',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)'
              }}
            >
              {profile?.name || 'YOUR NAME'}
            </motion.h2>

            {/* Role & Company */}
            <div
              style={{
                fontSize: '0.94rem',
                fontWeight: 600,
                color: accentColor,
                marginBottom: '8px',
                textShadow: `0 0 14px ${accentColor}50`
              }}
            >
              {profile?.role || profile?.tagline || 'YOUR ROLE / TAGLINE'}{profile?.company ? ` • ${profile.company}` : ''}
            </div>

            {/* Short Biography / Tagline */}
            {profile?.bio && (
              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'rgba(244, 244, 245, 0.82)',
                  lineHeight: 1.4,
                  maxWidth: '340px',
                  margin: '0 0 12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {profile.bio}
              </p>
            )}

            {/* In-Card Direct Connect Action Icons (Single Horizontal Row, Never Wraps, Dynamic Icons & Favicons) */}
            {(() => {
              const resolvedLinks = resolveProfileLinks(profile);
              if (!resolvedLinks.length) return null;

              return (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'clamp(6px, 1.6vw, 10px)',
                    margin: '8px 0 16px',
                    width: '100%',
                    maxWidth: '100%',
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    padding: '4px 4px 6px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {resolvedLinks.map(action => (
                    <div
                      key={action.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0
                      }}
                    >
                      <a
                        href={action.href}
                        target={action.isExternal ? '_blank' : undefined}
                        rel={action.isExternal ? 'noopener noreferrer' : undefined}
                        title={action.title}
                        aria-label={action.label}
                        style={{
                          width: 'clamp(38px, 9.2vw, 44px)',
                          height: 'clamp(38px, 9.2vw, 44px)',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid rgba(255, 255, 255, 0.4)',
                          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.45), 0 2px 4px rgba(0, 0, 0, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0C0816',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                          flexShrink: 0
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.08)';
                          e.currentTarget.style.boxShadow = `0 10px 24px rgba(0, 0, 0, 0.6), 0 0 0 1.5px ${accentColor}`;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.45), 0 2px 4px rgba(0, 0, 0, 0.2)';
                        }}
                      >
                        <DynamicLinkIcon link={action} size={20} color="#0C0816" />
                      </a>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: 'rgba(255, 255, 255, 0.92)',
                          letterSpacing: '0.01em',
                          textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
                          textAlign: 'center',
                          maxWidth: '52px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {action.label}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* In-Card Primary Actions: Save Contact & View Full Portfolio */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                width: '100%',
                maxWidth: '350px',
                marginTop: '4px'
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => downloadVCard(profile)}
                style={{
                  flex: 1,
                  height: '46px',
                  borderRadius: '13px',
                  backgroundColor: '#FFFFFF',
                  border: 'none',
                  color: '#0C0816',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.45)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
                }}
              >
                <Sparkles size={15} color="#0C0816" />
                <span>Save Contact</span>
              </button>

              <button
                type="button"
                onClick={onExpand}
                style={{
                  flex: 1.25,
                  height: '46px',
                  borderRadius: '13px',
                  background: `linear-gradient(135deg, ${glowColor} 0%, ${accentColor} 100%)`,
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: `0 4px 20px ${glowColor}60`,
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 6px 26px ${glowColor}80`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 20px ${glowColor}60`;
                }}
              >
                <span>View Details</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          {/* Footer Row: Clean NFC Serial Identity */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              position: 'relative',
              zIndex: 3
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  color: 'rgba(244, 244, 245, 0.65)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600
                }}
              >
                NFC Smart Identity
              </span>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  color: '#f4f4f5',
                  fontWeight: 600
                }}
              >
                {idCode}
              </span>
            </div>

            <div
              style={{
                fontSize: '0.76rem',
                color: accentColor,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Tap to Expand</span>
              <ArrowUpRight size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Hint Underneath */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '14px',
          fontSize: '0.76rem',
          color: isLight ? '#71717a' : '#D5C9E5',
          opacity: 0.8,
          letterSpacing: '0.3px',
          userSelect: 'none'
        }}
      >
        Interactive 3D card tilt • Tap to view details
      </div>
    </motion.div>
  );
}
