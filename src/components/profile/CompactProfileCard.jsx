/* ==========================================================================
   FLOCARD COMPACT PROFILE CARD
   Interactive luxury digital identity card powered by React Bits <ReflectiveCard />
   with WebGL brushed metal reflection, 3D tilt tracking, dynamic specular glare,
   centered user portrait, and in-card contact & portfolio action buttons.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Phone,
  Mail,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Building2,
  ExternalLink
} from 'lucide-react';
import ReflectiveCard from '../ReflectiveCard/ReflectiveCard';
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
          : 'purple')
  );

  useEffect(() => {
    if (profile?.cardFinish) {
      setActiveFinish(profile.cardFinish);
    } else if (profile?.edition === 'gold') {
      setActiveFinish('gold');
    } else if (profile?.edition === 'platinum' || profile?.edition === 'steel') {
      setActiveFinish('steel');
    } else {
      setActiveFinish('purple');
    }
  }, [profile?.cardFinish, profile?.edition]);

  const finishTints = {
    steel: '#E2E8F0',
    gold: '#F3CF8A',
    purple: '#A855F7'
  };

  const finishGlows = {
    steel: '#64748B',
    gold: '#D97706',
    purple: profile?.glowColor || '#6B00FF'
  };

  const finishAccents = {
    steel: '#94A3B8',
    gold: '#F59E0B',
    purple: profile?.accentColor || '#A855F7'
  };

  const metalTint =
    profile?.cardColor && profile?.cardFinish === 'custom'
      ? profile.cardColor
      : finishTints[activeFinish] || profile?.cardColor || '#A855F7';

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
    : { duration: 0.72, ease: [0.16, 1, 0.3, 1] };

  const idCode = profile?.phone || profile?.email || `NFC-${profile?.slug?.toUpperCase() || '216'}`;

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
      {/* Quick Interactive Metal Finish Switcher */}
      {allowColorSwitch && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-color)',
            backdropFilter: 'blur(12px)',
            marginBottom: '14px',
            zIndex: 20
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '2px' }}>
            Finish:
          </span>
          {[
            { id: 'steel', label: 'Steel', color: '#CBD5E1', gradient: 'linear-gradient(135deg, #E2E8F0, #94A3B8)' },
            { id: 'gold', label: 'Gold', color: '#F59E0B', gradient: 'linear-gradient(135deg, #FDE68A, #D97706)' },
            { id: 'purple', label: 'Purple', color: '#A855F7', gradient: 'linear-gradient(135deg, #C084FC, #6B00FF)' }
          ].map((finish) => {
            const isSelected = activeFinish === finish.id;
            return (
              <button
                key={finish.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFinish(finish.id);
                  onColorChange?.(finish.id, finishTints[finish.id]);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  border: isSelected ? `1.5px solid ${finish.color}` : '1.5px solid transparent',
                  background: isSelected ? (isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)') : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)'
                }}
              >
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: finish.gradient,
                    boxShadow: isSelected ? `0 0 6px ${finish.color}` : 'none',
                    display: 'inline-block'
                  }}
                />
                {finish.label}
              </button>
            );
          })}
        </div>
      )}
      {/* Main Reflective Card Element */}
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
        {/* Ambient Glow behind the reflective card */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '340px',
            height: '480px',
            borderRadius: '24px',
            background: `radial-gradient(ellipse at center, ${glowColor}45 0%, ${accentColor}25 50%, transparent 75%)`,
            filter: 'blur(35px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* React Bits ReflectiveCard with Custom In-Card Centered Content */}
        <ReflectiveCard
          theme={isLight ? 'light' : 'dark'}
          tint={metalTint}
          webcam={false}
          metalness={1}
          roughness={0.28}
          blurStrength={6}
          shine={1.2}
          glare={0.55}
          enableTilt={!reducedMotion}
          tiltStrength={12}
          width={360}
          height={550}
          radius={20}
          bodyStyle={{
            boxShadow: glowShadow
          }}
          style={{
            borderRadius: '20px',
            zIndex: 1
          }}
        >
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 2
            }}
          >
            {/* Top Row: Verified Badge & Live Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                paddingBottom: '8px'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: isLight ? '#18181b' : '#f4f4f5',
                  background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                  border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backdropFilter: 'blur(8px)'
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
                  color: isLight ? '#52525b' : 'rgba(244, 244, 245, 0.7)',
                  background: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
                  padding: '4px 10px',
                  borderRadius: '9999px'
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
                padding: '6px 0'
              }}
            >
              {/* Centered User Image */}
              <motion.div
                layoutId="profile-card-avatar"
                transition={transitionConfig}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: isCircle ? '50%' : '24px',
                  padding: '3px',
                  background: `linear-gradient(135deg, ${glowColor} 0%, ${accentColor} 100%)`,
                  boxShadow: `0 8px 26px ${glowColor}65, 0 0 0 1px ${accentColor}40`,
                  overflow: 'hidden',
                  marginBottom: '14px',
                  position: 'relative'
                }}
              >
                <img
                  src={profile?.avatar || profile?.logo || '/assets/akhil.jpg'}
                  alt={profile?.name || 'User Portrait'}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: isCircle ? '50%' : '21px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </motion.div>

              {/* User Name */}
              <h2
                style={{
                  fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  color: isLight ? '#18181b' : '#f4f4f5',
                  margin: '0 0 4px',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                {profile?.name}
              </h2>

              {/* Role & Company */}
              <div
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: accentColor,
                  marginBottom: '6px'
                }}
              >
                {profile?.role || 'Executive'}{profile?.company ? ` • ${profile.company}` : ''}
              </div>

              {/* Short Biography / Tagline */}
              {profile?.bio && (
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: isLight ? '#52525b' : 'rgba(244, 244, 245, 0.72)',
                    lineHeight: 1.4,
                    maxWidth: '300px',
                    margin: '0 0 14px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {profile.bio}
                </p>
              )}

              {/* Action Buttons Row INSIDE the Card */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  width: '100%',
                  maxWidth: '310px',
                  marginTop: '4px'
                }}
                onClick={e => e.stopPropagation()}
              >
                {profile?.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '8px',
                      background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.09)',
                      border: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.16)',
                      color: isLight ? '#18181b' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      textDecoration: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Phone size={13} color={accentColor} />
                    <span>Call</span>
                  </a>
                )}

                {profile?.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '8px',
                      background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.09)',
                      border: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.16)',
                      color: isLight ? '#18181b' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      textDecoration: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Mail size={13} color={accentColor} />
                    <span>Email</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => downloadVCard(profile)}
                  style={{
                    flex: 1.25,
                    height: '38px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.09)',
                    border: isLight ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.16)',
                    color: isLight ? '#18181b' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Sparkles size={13} color={accentColor} />
                  <span>Save vCard</span>
                </button>
              </div>

              {/* Primary In-Card Expand Portfolio Button */}
              <button
                type="button"
                onClick={onExpand}
                style={{
                  width: '100%',
                  maxWidth: '310px',
                  marginTop: '10px',
                  height: '42px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${glowColor} 0%, ${accentColor} 100%)`,
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: `0 4px 18px ${glowColor}50`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 6px 22px ${glowColor}70`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 18px ${glowColor}50`;
                }}
              >
                <span>View Full Portfolio</span>
                <ArrowUpRight size={15} />
              </button>
            </div>

            {/* Footer Row: Clean NFC Serial Identity — NO Fingerprint Icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                <span
                  style={{
                    fontSize: '0.66rem',
                    color: isLight ? '#71717a' : 'rgba(244, 244, 245, 0.55)',
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
                    color: isLight ? '#18181b' : '#f4f4f5',
                    fontWeight: 600
                  }}
                >
                  {idCode}
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.74rem',
                  color: accentColor,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Tap to Expand</span>
                <ArrowUpRight size={12} />
              </div>
            </div>
          </div>
        </ReflectiveCard>
      </div>

      {/* Subtle Hint Underneath */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: '0.74rem',
          color: isLight ? '#71717a' : '#D5C9E5',
          opacity: 0.7,
          letterSpacing: '0.3px',
          userSelect: 'none'
        }}
      >
        Move cursor over card for 3D metallic reflection • Tap to open portfolio
      </div>
    </motion.div>
  );
}
