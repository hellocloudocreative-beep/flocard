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
import FullScreenDigitalProfile from '../../components/profile/FullScreenDigitalProfile';
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
          <p style={{ color: '#82758F', marginTop: '8px' }}>The requested FLOCARDS identity profile does not exist.</p>
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

  const glowColor = profile.glowColor || '#6B00FF';
  const accentColor = profile.accentColor || '#A855F7';

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
        padding: 0,
        position: 'relative',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Floating CardNav (Seamless Overlay) */}
      <div
        style={{
          width: '100%',
          maxWidth: '1360px',
          padding: '16px 20px 0',
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          boxSizing: 'border-box'
        }}
      >
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

      {/* Full-Screen Continuous Digital Profile */}
      <FullScreenDigitalProfile
        profile={profile}
        isLight={isLight}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
