/* ==========================================================================
   FLOCARD PREMIUM MORPHING DIGITAL PROFILE & PORTFOLIO SYSTEM (/p/:slug)
   Orchestrates shared-element morphing between:
   1. CompactProfileCard (Interactive glowing gradient identity card)
   2. ExpandedPortfolioView (Full-page digital portfolio & gallery)
   Supports URL queries (?view=full / ?view=compact), opening preferences,
   browser history popstate (Back button collapse), and Escape key navigation.
   ========================================================================== */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import CompactProfileCard from '../../components/profile/CompactProfileCard';
import ExpandedPortfolioView from '../../components/profile/ExpandedPortfolioView';
import CardNav from '../../components/CardNav/CardNav';
import { downloadVCard } from '../../lib/vcard';
import { INITIAL_PROFILES } from '../../lib/storage';

export default function PublicProfile({ slug = 'akhil' }) {
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
      (cleanSlug === 'akhil' ? (list.find(p => p && p.id === 'prof_akhil_001') || initialList[0] || list[0]) : null) ||
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

  // Determine initial view state from URL query and profile openingPreference
  const computeInitialExpanded = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');

    if (viewParam === 'full') return true;
    if (viewParam === 'compact') return false;

    // Default based on saved opening preference
    if (profile?.openingPreference === 'full') return true;
    return false; // Default to compact expandable card
  }, [profile]);

  const [isExpanded, setIsExpanded] = useState(computeInitialExpanded);

  // Sync state if slug/profile changes
  useEffect(() => {
    setIsExpanded(computeInitialExpanded());
  }, [slug, computeInitialExpanded]);

  // Sync URL search query with expansion state & handle browser Back/Forward
  const handleExpand = useCallback(() => {
    if (profile?.openingPreference === 'compact_only') {
      return; // Customer locked profile to compact only
    }

    setIsExpanded(true);

    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('view', 'full');
      window.history.pushState({ view: 'full', slug }, '', currentUrl.toString());
    }
  }, [profile, slug]);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);

    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('view');
      window.history.pushState({ view: 'compact', slug }, '', currentUrl.toString());
    }
  }, [slug]);

  // Listen to browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'full') {
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to Escape key to collapse when expanded
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        handleCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, handleCollapse]);

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

  const navItems = useMemo(() => [
    {
      label: 'Profile',
      description: `${profile?.name || 'Identity'} • ${profile?.role || 'Executive'}`,
      links: [
        { label: isExpanded ? 'Collapse to Card' : 'Expand Profile', onClick: isExpanded ? handleCollapse : handleExpand },
        { label: 'Save Contact vCard', onClick: () => downloadVCard(profile) }
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
      description: 'AI Concierge, Digital Profiles & Tracking',
      links: [
        { label: 'AI Concierge', href: '/ai-concierge' },
        { label: 'Create Card', href: '/designer' }
      ]
    }
  ], [profile, isExpanded, handleCollapse, handleExpand]);

  return (
    <div
      className={`public-profile-root ${isLight ? 'is-light' : ''}`}
      style={{
        minHeight: '100vh',
        background: isLight ? '#F8F7FC' : '#08060D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isExpanded ? '24px 16px 80px' : '24px 16px',
        position: 'relative',
        overflowX: 'hidden',
        transition: 'padding 0.5s ease'
      }}
    >
      {/* Subtle Oversized Background Watermark Logo (FLOCARD Brand Logo Mark, not plain text) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(280px, 55vw, 680px)',
          maxWidth: '680px',
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

      {/* Cinematic Ambient Purple Radial Glow Lighting */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '840px',
          height: '520px',
          background: `radial-gradient(ellipse at 50% -10%, ${glowColor}40 0%, ${accentColor}18 45%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Top Floating CardNav */}
      <div style={{ width: '100%', maxWidth: '780px', marginBottom: '20px', position: 'relative', zIndex: 40 }}>
        <CardNav
          logo="/assets/logo-light.png"
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

      {/* Shared-Element Morphing Container via Motion */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isExpanded ? (
            <CompactProfileCard
              key="compact-card"
              profile={profile}
              onExpand={handleExpand}
              isLight={isLight}
              reducedMotion={reducedMotion}
            />
          ) : (
            <ExpandedPortfolioView
              key="expanded-portfolio"
              profile={profile}
              onCollapse={handleCollapse}
              isLight={isLight}
              reducedMotion={reducedMotion}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Global Minimal Footer */}
      <footer
        style={{
          marginTop: isExpanded ? '40px' : '24px',
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
