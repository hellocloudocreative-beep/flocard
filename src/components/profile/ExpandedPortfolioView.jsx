/* ==========================================================================
   FLOCARD EXPANDED DIGITAL PORTFOLIO
   Shared-element morphing target view with hero lockup,
   real portfolio gallery, project lightbox, vCard export, and reverse collapse.
   ========================================================================== */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MagicBento from '../MagicBento/MagicBento';
import {
  ArrowLeft,
  X,
  Check,
  Share2,
  Download,
  QrCode,
  Sparkles,
  ExternalLink,
  Briefcase,
  Layers,
  MapPin,
  Calendar,
  Building2,
  Copy,
  ChevronRight,
  Maximize2,
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
  GithubIcon,
  YoutubeIcon,
  FacebookIcon
} from '../SocialIcons';
import ProfileAvatar from './ProfileAvatar';
import { resolveProfileLinks, DynamicLinkIcon } from '../../lib/socialLinkResolver';
import { downloadVCard } from '../../lib/vcard';
import { resolveMapUrl } from '../../lib/constants';

export default function ExpandedPortfolioView({
  profile = {},
  onCollapse = () => {},
  isLight = false,
  reducedMotion = false
}) {
  const p = profile || {};
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedProject, setSelectedProject] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Responsive columns for MagicBento: 1 col on mobile (< 600px), 2 on tablet (< 850px), 3 on desktop
  const [bentoColumns, setBentoColumns] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 600) return 1;
      if (window.innerWidth < 850) return 2;
    }
    return 3;
  });

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 600) setBentoColumns(1);
        else if (window.innerWidth < 850) setBentoColumns(2);
        else setBentoColumns(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bentoItems = useMemo(() => {
    if (!p.portfolio || p.portfolio.length === 0) return [];
    const visuals = ['analytics', 'dashboard', 'collaboration', 'automation', 'integration', 'security'];
    const isSingleCol = bentoColumns === 1;
    return p.portfolio.map((item, idx) => ({
      id: item?.id || `bento-${idx}`,
      title: item?.title || '',
      description: item?.description || '',
      label: item?.category || 'Featured Work',
      image: item?.image,
      visual: item?.image ? undefined : visuals[idx % visuals.length],
      colSpan: (isSingleCol || idx !== 0) ? 1 : 2,
      rowSpan: (isSingleCol || idx !== 0) ? 1 : 2,
      onClick: () => setSelectedProject(item)
    }));
  }, [p.portfolio, bentoColumns]);

  const [activeFinish, setActiveFinish] = useState('purple');

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
    gold: '#E9C766',
    purple: '#A855F7'
  };

  const finishGlows = {
    steel: '#64748B',
    gold: '#C9972C',
    purple: profile?.glowColor || '#6B00FF'
  };

  const finishAccents = {
    steel: '#94A3B8',
    gold: '#E9C766',
    purple: profile?.accentColor || '#A855F7'
  };

  const metalTint =
    profile?.cardColor && profile?.cardFinish === 'custom'
      ? profile.cardColor
      : finishTints[activeFinish] || profile?.cardColor || '#A855F7';

  const gradientStart = p.gradientStart || '#130B22';
  const gradientMid = p.gradientMid || '#240F3E';
  const gradientEnd = p.gradientEnd || '#0B0813';
  const accentColor = finishAccents[activeFinish] || p.accentColor || '#A855F7';
  const glowColor = finishGlows[activeFinish] || p.glowColor || '#6B00FF';
  const creamHighlight = p.creamHighlight || '#F5EDE5';
  const photoShape = p.photoShape || 'circle';
  const isCircle = photoShape === 'circle';

  const glowShadow = p.borderGlowIntensity === 'subtle'
    ? `0 20px 60px -15px ${glowColor}30, 0 0 25px ${glowColor}15`
    : `0 35px 95px -20px ${glowColor}55, 0 0 45px ${glowColor}25, 0 0 0 1px ${accentColor}30`;

  const transitionConfig = reducedMotion
    ? { duration: 0.15 }
    : { type: 'spring', stiffness: 290, damping: 29, mass: 0.85 };

  const currentUrl = typeof window !== 'undefined'
    ? window.location.origin + `/p/${profile.slug}`
    : `https://flocard.in/p/${profile.slug}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.name} — FLOCARD Digital Identity`,
        text: `Connect with ${profile.name} (${profile.role} at ${profile.company})`,
        url: currentUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const visibleSections = profile.sectionVisibility || {
    about: true,
    portfolio: true,
    services: true,
    experience: true,
    contact: true
  };

  const tabs = [
    visibleSections.portfolio && { id: 'portfolio', label: 'Portfolio', count: profile.portfolio?.length },
    visibleSections.about && { id: 'about', label: 'About' },
    visibleSections.services && { id: 'services', label: 'Services', count: profile.services?.length },
    visibleSections.experience && { id: 'experience', label: 'Experience', count: profile.experience?.length },
    visibleSections.contact && { id: 'contact', label: 'Contact' }
  ].filter(Boolean);

  const finishPortraitBgs = {
    purple: '/assets/cardbg-purple-portrait.png',
    gold: '/assets/cardbg-gold-portrait.png',
    steel: '/assets/cardbg-platinum-portrait.png',
    platinum: '/assets/cardbg-platinum-portrait.png',
    metal: '/assets/cardbg-metal-portrait.png'
  };

  const portraitBg =
    profile?.cardPortraitBg ||
    finishPortraitBgs[profile?.cardFinish] ||
    finishPortraitBgs[profile?.edition] ||
    finishPortraitBgs.purple;

  // Contact details formatting
  const displayPhone = profile?.phone || '+91 80736 55571';
  const cleanPhone = displayPhone.replace(/[^0-9+]/g, '');
  const rawWhatsapp = profile?.whatsapp || profile?.phone || '918073655571';
  const cleanWhatsapp = String(rawWhatsapp).replace(/[^0-9]/g, '');
  const displayEmail = profile?.email || 'contact@flocard.in';
  
  const displayAddress = profile?.address || profile?.location || '2nd Floor, Archierio Experience Center, 668, 8th Main Rd, above Shivam Sanitary Ware, 7th Sector, HSR Layout, Bengaluru, Karnataka 560102';
  const mapsHref = resolveMapUrl(profile) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`;
  
  const displayWeb = profile?.website
    ? profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : 'vertucardz.com';
  const webHref = profile?.website
    ? (profile.website.startsWith('http') ? profile.website : `https://${profile.website}`)
    : 'https://flocard.in';

  const resolvedLinks = useMemo(() => {
    return resolveProfileLinks(profile);
  }, [profile]);

  // Social & Web links for the floating dark glass pill capsule
  const socialCapsuleLinks = useMemo(() => {
    const list = resolvedLinks.filter(l => l.platform !== 'phone' && l.platform !== 'whatsapp' && l.platform !== 'email');
    if (list.length > 0) return list;
    return [
      { id: 'def_yt', platform: 'youtube', label: 'YouTube', href: 'https://youtube.com', isExternal: true },
      { id: 'def_ig', platform: 'instagram', label: 'Instagram', href: 'https://instagram.com', isExternal: true },
      { id: 'def_li', platform: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com', isExternal: true },
      { id: 'def_fb', platform: 'facebook', label: 'Facebook', href: 'https://facebook.com', isExternal: true },
      { id: 'def_web', platform: 'website', label: 'Website', href: webHref, isExternal: true }
    ];
  }, [resolvedLinks, webHref]);
  return (
    <div
      className="flocard-profile-full-view"
      style={{
        width: '100%',
        maxWidth: '1360px',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      <motion.div
        layoutId="flocard-profile-card-surface"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitionConfig}
        className="flocard-expanded-portfolio-card flocard-profile-full-card"
        style={{
          width: '100%',
          maxWidth: '100%',
          borderRadius: '28px',
          border: `1.5px solid ${accentColor}45`,
          boxShadow: glowShadow,
          backgroundColor: '#0C0816',
          backgroundImage: `linear-gradient(155deg, rgba(16, 9, 28, 0.94) 0%, rgba(9, 6, 16, 0.98) 100%), url(${portraitBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          boxSizing: 'border-box'
        }}
      >
        <div
          className="flocard-profile-card-inner"
          style={{
            position: 'relative',
            zIndex: 3,
            padding: '28px 20px 32px',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Ambient Cream Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${creamHighlight}12 0%, ${accentColor}08 50%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          {/* Responsive Two-Column Layout (Desktop ≥992px: 2 columns; Mobile: 1 column) */}
          <div className="flocard-profile-two-column">
            {/* Left Column: Brand, Avatar, Identity, Direct Contact, Social Capsule, NFC Badge, CTAs */}
            <motion.div
              className="flocard-profile-left-col"
              initial={reducedMotion ? {} : { opacity: 0, x: -16 }}
              animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
              transition={reducedMotion ? {} : { duration: 0.4, ease: 'easeOut' }}
            >
              {/* 1. Studio / Brand Logo & Name Header (Top of card, centered) - Only when logo, company, or tagline exists */}
              {Boolean(profile.logo || profile.company || profile.tagline) && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '18px',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  {profile.logo && (
                    <img
                      src={profile.logo}
                      alt={profile.company || 'Company Logo'}
                      style={{
                        maxHeight: '44px',
                        maxWidth: '220px',
                        objectFit: 'contain',
                        display: 'block',
                        marginBottom: '6px'
                      }}
                    />
                  )}
                  {profile.company && !profile.logo && (
                    <span
                      style={{
                        fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                        fontWeight: 800,
                        fontSize: '0.96rem',
                        letterSpacing: '0.12em',
                        color: '#FFFFFF',
                        textTransform: 'uppercase',
                        marginBottom: '4px'
                      }}
                    >
                      {profile.company}
                    </span>
                  )}
                  {profile.tagline && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        letterSpacing: '0.14em',
                        color: '#D5C9E5',
                        textTransform: 'uppercase',
                        opacity: 0.85,
                        fontWeight: 600
                      }}
                    >
                      {profile.tagline}
                    </span>
                  )}
                </div>
              )}

          {/* 2. Centered Circular Avatar */}
          <div style={{ position: 'relative', marginBottom: '14px', zIndex: 2 }}>
            <ProfileAvatar
              profile={profile}
              size={124}
              glowColor={glowColor}
              accentColor={accentColor}
              isCircle={true}
              transitionConfig={transitionConfig}
            />
            {profile.isVerified !== false && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: glowColor,
                  border: '2.5px solid #0B0813',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: `0 3px 10px ${glowColor}80`
                }}
                title="Verified FLOCARD Profile"
              >
                <Check size={14} strokeWidth={3.2} />
              </div>
            )}
          </div>

          {/* 3. Name & Role (Centered) */}
          <h1
            style={{
              fontFamily: "var(--font-heading, 'Sora', sans-serif)",
              fontSize: 'clamp(1.35rem, 5vw, 1.8rem)',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              margin: '0 0 4px',
              textAlign: 'center',
              lineHeight: 1.2,
              position: 'relative',
              zIndex: 2
            }}
          >
            {profile.name}
          </h1>

          <div
            style={{
              fontSize: 'clamp(0.92rem, 3vw, 1.05rem)',
              fontWeight: 600,
              color: '#D5C9E5',
              textAlign: 'center',
              marginBottom: '16px',
              position: 'relative',
              zIndex: 2
            }}
          >
            {profile.role}
          </div>

          {/* 4. Contact Number Header & Clickable Link */}
          <div style={{ textAlign: 'center', marginBottom: '16px', position: 'relative', zIndex: 2 }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#E2D9F3',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '3px'
              }}
            >
              Contact Number:
            </div>
            <a
              href={`tel:${cleanPhone}`}
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#60A5FA',
                textDecoration: 'underline',
                letterSpacing: '0.02em',
                display: 'inline-block'
              }}
            >
              {displayPhone}
            </a>
          </div>

          {/* 5. Direct Round Action Buttons (Call, WhatsApp, Email) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              marginBottom: '18px',
              position: 'relative',
              zIndex: 2
            }}
          >
            {/* Call */}
            <a
              href={`tel:${cleanPhone}`}
              title="Call Phone"
              aria-label="Call"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                border: '1.5px solid rgba(255, 255, 255, 0.45)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                transition: 'transform 0.18s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <PhoneIcon size={20} color="#FFFFFF" />
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${cleanWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Message on WhatsApp"
              aria-label="WhatsApp"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                border: '1.5px solid rgba(255, 255, 255, 0.45)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                transition: 'transform 0.18s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <WhatsappIcon size={20} color="#FFFFFF" />
            </a>

            {/* Email */}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                title="Send Email"
                aria-label="Email"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  border: '1.5px solid rgba(255, 255, 255, 0.45)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                  transition: 'transform 0.18s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <MailIcon size={20} color="#FFFFFF" />
              </a>
            )}
          </div>

          {/* 6. Floating Dark Glass Pill Capsule with Social Icons */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(18, 12, 28, 0.82)',
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              boxShadow: `0 8px 30px rgba(0, 0, 0, 0.45), 0 0 20px ${glowColor}18`,
              backdropFilter: 'blur(20px)',
              marginBottom: '18px',
              maxWidth: '100%',
              flexWrap: 'wrap',
              boxSizing: 'border-box',
              position: 'relative',
              zIndex: 2
            }}
          >
            {socialCapsuleLinks.map((link) => (
              <a
                key={link.id || link.platform}
                href={link.href}
                target={link.isExternal ? '_blank' : undefined}
                rel={link.isExternal ? 'noopener noreferrer' : undefined}
                title={link.title || link.label}
                aria-label={link.label}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0C0816',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  transition: 'transform 0.16s ease',
                  flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <DynamicLinkIcon link={link} size={18} color="#0C0816" />
              </a>
            ))}
          </div>

          {/* 7. Experience Center / Address Block */}
          <a
            href={mapsHref || '#'}
            target={mapsHref ? '_blank' : '_self'}
            rel="noopener noreferrer"
            onClick={e => { if (!mapsHref) e.preventDefault(); }}
            title={mapsHref ? 'Click to open in Google Maps' : 'Office address'}
            style={{
              display: 'block',
              textAlign: 'left',
              marginBottom: '14px',
              maxWidth: '440px',
              width: '100%',
              padding: '14px 16px',
              boxSizing: 'border-box',
              position: 'relative',
              zIndex: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              textDecoration: 'none',
              cursor: mapsHref ? 'pointer' : 'default',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              if (mapsHref) {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${accentColor}20`;
              }
            }}
            onMouseLeave={e => {
              if (mapsHref) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '6px'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color={accentColor} />
                <span>{profile?.address ? 'Office Address:' : 'Location:'}</span>
              </div>
              {mapsHref && (
                <span
                  style={{ fontSize: '0.74rem', color: accentColor, fontWeight: 700 }}
                >
                  Directions ↗
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: '0.82rem',
                color: '#D5C9E5',
                lineHeight: 1.55,
                margin: 0,
                overflowWrap: 'anywhere',
                opacity: 0.92
              }}
            >
              {displayAddress}
            </p>
          </a>

          {/* 8. Direct Website / Domain Link */}
          <a
            href={webHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              color: '#D5C9E5',
              fontSize: '0.88rem',
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '0.04em',
              marginBottom: '22px',
              position: 'relative',
              zIndex: 2
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
            onMouseLeave={e => e.currentTarget.style.color = '#D5C9E5'}
          >
            {displayWeb}
          </a>

          {/* 9. Master Action Buttons: Save Contact vCard & Share Profile */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              width: '100%',
              marginBottom: '28px',
              boxSizing: 'border-box',
              position: 'relative',
              zIndex: 2
            }}
          >
            <button
              type="button"
              onClick={() => downloadVCard(profile)}
              style={{
                padding: '11px 24px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                color: '#130B22',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(255,255,255,0.25)',
                transition: 'transform 0.18s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Download size={16} />
              <span>Save Contact (vCard)</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              style={{
                padding: '11px 22px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontWeight: 600,
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = accentColor}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            >
              {copiedLink ? <Check size={16} color="#10B981" /> : <Share2 size={16} />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Profile'}</span>
            </button>
          </div>
        </motion.div>

        {/* Right Column: Staggered Content Tabs (Portfolio, About, Services, Experience, Contact) */}
        <motion.div
          className="flocard-profile-right-col"
              initial={reducedMotion ? {} : { opacity: 0, x: 16 }}
              animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
              transition={reducedMotion ? {} : { duration: 0.45, delay: 0.08, ease: 'easeOut' }}
              style={{ width: '100%', position: 'relative', zIndex: 2 }}
            >

        {/* Section Tabs */}
        {tabs.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '12px',
              marginBottom: '24px',
              overflowX: 'auto'
            }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: active ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    color: active ? '#FFFFFF' : '#D5C9E5',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        backgroundColor: active ? accentColor : 'rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF'
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 1: Portfolio Gallery */}
        {activeTab === 'portfolio' && (
          <div>
            {!profile.portfolio || profile.portfolio.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: '#D5C9E5', opacity: 0.7 }}>
                <Briefcase size={36} color="rgba(255, 255, 255, 0.2)" style={{ margin: '0 auto 10px' }} />
                <div>No published portfolio items yet.</div>
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <MagicBento
                  columns={bentoColumns}
                  rowHeight={bentoColumns === 1 ? 170 : 210}
                  gap={bentoColumns === 1 ? 10 : 14}
                  radius={20}
                  theme={isLight ? 'light' : 'dark'}
                  glowColor={accentColor}
                  enableBorderGlow={true}
                  enableSpotlight={true}
                  spotlightRadius={280}
                  enableStars={true}
                  enableTilt={!reducedMotion}
                  clickEffect={true}
                  items={bentoItems}
                  onItemClick={(_, index) => {
                    if (profile.portfolio && profile.portfolio[index]) {
                      setSelectedProject(profile.portfolio[index]);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: About Section */}
        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', color: '#FFFFFF' }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '20px', padding: '22px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.05rem', fontWeight: 700 }}>About {profile.name}</h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#D5C9E5', lineHeight: 1.6 }}>
                {profile.bio || `${profile.name} is the ${profile.role} at ${profile.company}, driving innovation through modern connected NFC digital identity.`}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '0.74rem', color: '#D5C9E5', textTransform: 'uppercase', fontWeight: 600 }}>Organization</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>{profile.company}</div>
              </div>
              <a
                href={mapsHref || '#'}
                target={mapsHref ? '_blank' : '_self'}
                rel="noopener noreferrer"
                onClick={e => { if (!mapsHref) e.preventDefault(); }}
                title={mapsHref ? 'Click to open in Google Maps' : 'Location details'}
                style={{
                  display: 'block',
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  textDecoration: 'none',
                  cursor: mapsHref ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  if (mapsHref) {
                    e.currentTarget.style.borderColor = accentColor;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 20px ${accentColor}20`;
                  }
                }}
                onMouseLeave={e => {
                  if (mapsHref) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: '#D5C9E5', textTransform: 'uppercase', fontWeight: 600 }}>Location</span>
                  {mapsHref && (
                    <span
                      style={{ fontSize: '0.74rem', color: accentColor, fontWeight: 700 }}
                    >
                      Directions ↗
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px', color: '#FFFFFF' }}>{profile.location || profile.address || 'Global'}</div>
                {profile.address && profile.location && profile.address !== profile.location && (
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>{profile.address}</div>
                )}
              </a>
            </div>
          </div>
        )}

        {/* Tab 3: Services */}
        {activeTab === 'services' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(!profile.services || profile.services.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: '#D5C9E5', opacity: 0.7 }}>
                <Layers size={36} color="rgba(255, 255, 255, 0.2)" style={{ margin: '0 auto 10px' }} />
                <div>No services listed.</div>
              </div>
            ) : (
              profile.services.map((srv, idx) => (
                <div
                  key={srv.id || idx}
                  style={{
                    padding: '18px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: `${glowColor}25`,
                      color: accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {srv.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#D5C9E5', lineHeight: 1.5 }}>
                      {srv.description || srv.desc}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Experience */}
        {activeTab === 'experience' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(!profile.experience || profile.experience.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: '#D5C9E5', opacity: 0.7 }}>
                <Building2 size={36} color="rgba(255, 255, 255, 0.2)" style={{ margin: '0 auto 10px' }} />
                <div>No experience entries listed.</div>
              </div>
            ) : (
              profile.experience.map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  style={{
                    padding: '18px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {exp.role}
                      </h4>
                      <div style={{ fontSize: '0.82rem', color: accentColor, fontWeight: 600 }}>
                        {exp.company}
                      </div>
                    </div>
                    {exp.period && (
                      <span style={{ fontSize: '0.74rem', color: '#D5C9E5', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '6px' }}>
                        {exp.period}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#D5C9E5', lineHeight: 1.5 }}>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Contact Direct */}
        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '22px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                Contact & Address Book
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: '0.84rem', color: '#D5C9E5', lineHeight: 1.5 }}>
                Save verified contact card directly into your phone’s contacts with full email, phone, location, and social links.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => downloadVCard(profile)}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Download size={14} />
                  <span>Download vCard (.vcf)</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Share2 size={14} />
                  <span>Share Profile Link</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signature Divider */}
        <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.74rem', color: '#D5C9E5', opacity: 0.7 }}>
            Verified FLOCARD Digital Identity
          </div>
        </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

  {/* Project Lightbox Modal */}
      {selectedProject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 3, 10, 0.88)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedProject(null)}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              backgroundColor: '#130B22',
              borderRadius: '24px',
              border: `1px solid ${accentColor}50`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${glowColor}30`,
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '100%', height: '280px', position: 'relative' }}>
              <img
                src={selectedProject.image || '/assets/true_front_card.png'}
                alt={selectedProject.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '22px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: `${accentColor}25`,
                  color: accentColor,
                  fontWeight: 700
                }}
              >
                {selectedProject.category || 'Portfolio'}
              </span>
              <h3 style={{ margin: '8px 0', fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                {selectedProject.title}
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: '0.86rem', color: '#D5C9E5', lineHeight: 1.55 }}>
                {selectedProject.description}
              </p>
              {selectedProject.link && (
                <a
                  href={selectedProject.link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <span>Visit Project Website</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
