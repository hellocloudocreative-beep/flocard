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
import { getProfileTheme } from '../../lib/themeService';

export default function PublicProfile({ slug = 'alex' }) {
  const { getProfileBySlug, profiles } = useData();
  const { isLight: visitorIsLight } = useTheme();

  const [cloudProfile, setCloudProfile] = useState(null);
  const [isSearchingCloud, setIsSearchingCloud] = useState(true);

  // Normalize slug: strip slashes, decode URL
  const cleanSlug = useMemo(() => {
    try {
      return decodeURIComponent(slug || '')
        .trim()
        .toLowerCase()
        .replace(/^\/+|\/+$/g, '');
    } catch {
      return (slug || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    }
  }, [slug]);

  // Synchronous resolution from local context & initial data
  const localMatch = useMemo(() => {
    if (!cleanSlug) return null;
    const list = Array.isArray(profiles) ? profiles : [];
    const initialList = Array.isArray(INITIAL_PROFILES) ? INITIAL_PROFILES : [];

    if (getProfileBySlug) {
      const match = getProfileBySlug(cleanSlug);
      if (match) return match;
    }

    // 1. Exact match
    const fromList = list.find(p => p && p.slug && p.slug.trim().toLowerCase() === cleanSlug);
    if (fromList) return fromList;

    // 2. Normalized alphanumeric match (e.g. anzizm matches anzizm7 or anzizm-7)
    const norm = cleanSlug.replace(/[^a-z0-9]/g, '');
    const normMatch = list.find(p => {
      if (!p?.slug) return false;
      const pNorm = p.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      return pNorm === norm || pNorm.startsWith(norm) || norm.startsWith(pNorm);
    });
    if (normMatch) return normMatch;

    const fromInit = initialList.find(p => p && p.slug && p.slug.trim().toLowerCase() === cleanSlug);
    if (fromInit) return fromInit;

    // 3. Demo fallback if explicitly alex or akhil
    if (cleanSlug === 'alex' || cleanSlug === 'akhil') {
      return list.find(p => p && (p.id === 'prof_alex_001' || p.slug === 'alex')) || initialList[0] || null;
    }
    return null;
  }, [getProfileBySlug, profiles, cleanSlug]);

  // Direct Supabase Cloud Fetch fallback if not found in local cache
  useEffect(() => {
    let isMounted = true;
    const fetchFromSupabase = async () => {
      if (localMatch) {
        setIsSearchingCloud(false);
        return;
      }
      if (!cleanSlug) {
        setIsSearchingCloud(false);
        return;
      }

      setIsSearchingCloud(true);
      try {
        const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('../../lib/supabase.js');
        if (!isSupabaseConfigured) {
          if (isMounted) setIsSearchingCloud(false);
          return;
        }
        const client = supabaseAdmin || supabase;
        if (!client) {
          if (isMounted) setIsSearchingCloud(false);
          return;
        }

        // Direct fetch querying exact slug, slug with prefix/suffix (e.g. anzizm or anzizm7)
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .or(`slug.ilike.${cleanSlug},slug.ilike.${cleanSlug}%,slug.ilike.%${cleanSlug}%`)
          .order('created_at', { ascending: false })
          .limit(1);

        if (isMounted) {
          if (!error && Array.isArray(data) && data.length > 0) {
            const cp = data[0];
            const rawPortfolio = Array.isArray(cp.portfolio) ? cp.portfolio : [];
            const bannerEntry = rawPortfolio.find(x => x && x._isBannerConfig);
            const banner = cp.banner || bannerEntry?.banner || null;
            const cleanPortfolio = rawPortfolio.filter(x => !x || !x._isBannerConfig);
            const avatarZoom = cp.avatar_zoom ?? bannerEntry?.avatarZoom ?? 100;
            const avatarPosX = cp.avatar_pos_x ?? bannerEntry?.avatarPosX ?? 50;
            const avatarPosY = cp.avatar_pos_y ?? bannerEntry?.avatarPosY ?? 50;
            const photoShape = cp.photo_shape ?? bannerEntry?.photoShape ?? 'circle';

            const mapped = {
              id: cp.id,
              slug: cp.slug,
              name: cp.name || cp.slug,
              role: cp.role || '',
              company: cp.company || '',
              tagline: cp.tagline || '',
              bio: cp.bio || '',
              avatar: cp.avatar_url || '',
              avatar_url: cp.avatar_url || '',
              theme: cp.theme || 'gold',
              phone: cp.phone || '',
              email: cp.email || '',
              whatsapp: cp.whatsapp || '',
              website: cp.website || '',
              linkedin: cp.linkedin || '',
              instagram: cp.instagram || '',
              twitter: cp.twitter || '',
              github: cp.github || '',
              location: cp.location || '',
              services: Array.isArray(cp.services) ? cp.services : [],
              portfolio: cleanPortfolio,
              vcard_enabled: cp.vcard_enabled !== false,
              status: cp.status || 'active',
              views_count: cp.views_count || 0,
              save_count: cp.save_count || 0,
              banner: banner || { enabled: true, url: '/assets/hero-bg.jpg', zoom: 100, positionX: 50, positionY: 45 },
              avatarZoom,
              avatarPosX,
              avatarPosY,
              photoShape,
              updatedAt: cp.updated_at || cp.created_at
            };

            setCloudProfile(mapped);

            // Cache into browser storage
            try {
              const { StorageEngine } = await import('../../lib/storage.js');
              const local = StorageEngine.getProfiles();
              const idx = local.findIndex(p => p.slug === mapped.slug || p.id === mapped.id);
              if (idx >= 0) local[idx] = { ...local[idx], ...mapped };
              else local.push(mapped);
              StorageEngine.saveLocalProfiles(local);
            } catch (_) {}
          }
          setIsSearchingCloud(false);
        }
      } catch (e) {
        if (isMounted) setIsSearchingCloud(false);
      }
    };

    fetchFromSupabase();
    return () => { isMounted = false; };
  }, [cleanSlug, localMatch]);

  const profile = localMatch || cloudProfile;

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

  // Searching state
  if (!profile && isSearchingCloud) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
          background: '#08060D',
          color: '#FFFFFF'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid rgba(168, 85, 247, 0.2)',
            borderTopColor: '#A855F7',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px'
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600 }}>
          Loading FLOCARD Digital Identity...
        </span>
      </div>
    );
  }

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

  const activeTheme = useMemo(() => getProfileTheme(profile.theme || profile.cardFinish || profile.edition), [profile.theme, profile.cardFinish, profile.edition]);
  const glowColor = profile.glowColor || activeTheme.glowColor;
  const accentColor = profile.accentColor || activeTheme.accentColor;

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
        background: isLight ? activeTheme.pageBgLight : activeTheme.pageBgDark,
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
