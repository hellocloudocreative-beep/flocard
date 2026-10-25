/* ==========================================================================
   FLOCARD PREMIUM MORPHING DIGITAL PROFILE & PORTFOLIO SYSTEM (/p/:slug)
   Orchestrates shared-element morphing between:
   1. CompactProfileCard (Interactive glowing gradient identity card)
   2. ExpandedPortfolioView (Full-page digital portfolio & gallery)
   Supports URL queries (?view=full / ?view=compact), opening preferences,
   browser history popstate (Back button collapse), and Escape key navigation.
   ========================================================================== */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import ExpandedPortfolioView from '../../components/profile/ExpandedPortfolioView';
import CardNav from '../../components/CardNav/CardNav';
import { downloadVCard } from '../../lib/vcard';
import { INITIAL_PROFILES } from '../../lib/storage';

export default function PublicProfile({ slug = 'alex' }) {
  const { getProfileBySlug, profiles } = useData();
  const { isLight: visitorIsLight } = useTheme();

  // Resolve authoritative profile
  const profile = useMemo(() => {
    const cleanSlug = (slug || '').trim().toLowerCase();
    const list = Array.isArray(profiles) ? profiles : [];
    const initialList = Array.isArray(INITIAL_PROFILES) ? INITIAL_PROFILES : [];
    return (getProfileBySlug && getProfileBySlug(cleanSlug)) ||
      list.find(p => p && p.slug && p.slug.trim().toLowerCase() === cleanSlug) ||
      initialList.find(p => p && p.slug && p.slug.trim().toLowerCase() === cleanSlug) ||
      ((cleanSlug === 'alex' || cleanSlug === 'akhil') ? (list.find(p => p && (p.id === 'prof_alex_001' || p.slug === 'alex')) || initialList[0] || list[0]) : null) ||
      list[0] ||
      initialList[0];
  }, [getProfileBySlug, profiles, slug]);

  // Saved theme preference or visitor theme
  const isLight = profile?.themeMode ? profile.themeMode === 'light' : visitorIsLight;

  // Reduced motion preference detection
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const listener = (e) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Profile not found fallback
  if (!profile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
          background: '#08060D'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff', fontFamily: "var(--font-heading, 'Sora', sans-serif)" }}>
            Profile Not Found
          </h2>
          <p style={{ color: '#82758F', marginTop: '8px' }}>The requested FLOCARD identity profile does not exist.</p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '10px 24px',
              borderRadius: '9999px',
              backgroundColor: '#6B00FF',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  const backgroundText = profile.backgroundTypography || 'FLOCARD';
  const glowColor = profile.glowColor || '#6B00FF';
  const accentColor = profile.accentColor || '#A855F7';
  const edition = profile?.edition;
  const finish = profile?.cardFinish;
  const metalTint =
    profile?.cardColor && finish === 'custom'
      ? profile.cardColor
      : edition === 'gold' || finish === 'gold'
        ? '#E9C766'
        : edition === 'platinum' || edition === 'steel' || finish === 'steel'
          ? '#E2E8F0'
          : profile?.accentColor || '#A855F7';

  const portraitBg =
    profile?.cardPortraitBg ||
    (finish === 'gold' || edition === 'gold')
      ? '/assets/cardbg-gold-portrait.png'
      : (finish === 'steel' || finish === 'platinum' || edition === 'platinum' || edition === 'steel')
        ? '/assets/cardbg-platinum-portrait.png'
        : (finish === 'metal' || edition === 'metal')
          ? '/assets/cardbg-metal-portrait.png'
          : '/assets/cardbg-purple-portrait.png';

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://flocard.in/p/${profile.slug}`;
    if (navigator.share) {
      navigator.share({
        title: `${profile.name} — FLOCARD Digital Identity`,
        text: `Connect with ${profile.name} (${profile.role} at ${profile.company})`,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const navItems = useMemo(() => [
    {
      label: 'Profile',
      description: `${profile?.name || 'Identity'} • ${profile?.role || 'Executive'}`,
      links: [
        { label: 'Save Contact vCard', onClick: () => downloadVCard(profile) },
        { label: 'Share Profile', onClick: handleShare }
      ]
    },
    {
      label: 'Editions',
      description: 'FLOCARD Luxury NFC smart business cards.',
      links: [
        { label: 'Purple Edition (Signature)', href: '/#pricing' },
        { label: '24K Gold Edition', href: '/#pricing' },
        { label: 'Platinum Edition', href: '/#pricing' }
      ]
    },
    {
      label: 'Platform',
      description: 'Digital Profiles, NFC Hardware & Tracking',
      links: [
        { label: 'Create Card', href: '/designer' }
      ]
    }
  ], [profile]);

  return (
    <div
      className={`public-profile-root ${isLight ? 'is-light' : ''}`}
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        background: isLight ? '#F8F7FC' : '#08060D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '20px 14px 60px',
        position: 'relative',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Authentic Portrait Card Artwork Backdrop for Profile Background */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${portraitBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: isLight ? 0.08 : 0.16,
          filter: 'blur(50px)',
          transform: 'scale(1.15)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Subtle Oversized Background Watermark Logo */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(280px, 55vw, 680px)',
          maxWidth: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLight ? 0.04 : 0.028,
          filter: isLight ? 'invert(1) grayscale(1)' : 'none',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <img
          src="/assets/logo-light.png"
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Cinematic Ambient Glow Lighting */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          maxWidth: '100%',
          height: '100vh',
          background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${glowColor}35 0%, ${accentColor}18 35%, transparent 75%), radial-gradient(circle 800px at 50% 85%, ${metalTint}15 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Top Floating CardNav */}
      <div style={{ width: '100%', maxWidth: '1360px', marginBottom: '24px', position: 'relative', zIndex: 40, boxSizing: 'border-box' }}>
        <CardNav
          logo={
            <img
              src={isLight ? '/assets/logo-dark.png' : '/assets/logo-light.png'}
              alt="FLOCARD"
              style={{
                height: '24px',
                width: 'auto',
                display: 'block',
                objectFit: 'contain'
              }}
            />
          }
          logoAlt="FLOCARD"
          logoHref="/"
          items={navItems}
          cta={{ label: 'Get FLOCARD', href: '/' }}
          theme={isLight ? 'light' : 'dark'}
          surface="glass"
          accentColor={accentColor}
          openOn="click"
          cardEffect="rise"
        />
      </div>

      {/* Direct Full-Screen Profile Presentation */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box'
        }}
      >
        <ExpandedPortfolioView
          profile={profile}
          isLight={isLight}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* Global Minimal Footer */}
      <footer
        style={{
          marginTop: '36px',
          textAlign: 'center',
          color: '#82758F',
          fontSize: '0.74rem',
          letterSpacing: '0.5px',
          position: 'relative',
          zIndex: 10
        }}
      >
        <span>FLOCARD Digital Profile System • </span>
        <a
          href="/"
          style={{ color: '#A855F7', textDecoration: 'none', fontWeight: 600 }}
        >
          Get Your FLOCARD
        </a>
      </footer>
    </div>
  );
}
