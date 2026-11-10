/* ==========================================================================
   FLOCARDS FULL-SCREEN CONTINUOUS DIGITAL PROFILE
   Complete, vertically scrollable website combining modern digital business
   identity with Discord & Facebook-style profile customization:
   - Full viewport responsive width (mobile, tablet, desktop)
   - Profile Banner with overlapping Profile Picture (circular / rounded-square)
   - Verified Badge & Company Brand
   - Direct Contact Actions (Call, WhatsApp, Email, Save vCard, Share Profile)
   - Social & Web Link Capsule
   - Continuous Natural Vertical Layout (NO tabs hiding content, NO morphing locks)
   - Real Business Hours with live open/closed status badge
   - Working Appointment Booking with server validation & concurrency protection
   - Image-led Services Showcase with direct booking actions
   - Portfolio Gallery with full-screen lightbox
   - Video Portfolio (YouTube & Shorts embeds)
   - UPI Payments & Dynamic QR Code
   - Private-by-default Bank Details (explicit consent only)
   - Smart QR & NFC Connect Section
   ========================================================================== */

import React, { useState, useMemo } from 'react';
import {
  Check,
  Share2,
  Download,
  Phone,
  Mail,
  MapPin,
  Building2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { PhoneIcon, MailIcon, WhatsappIcon } from '../SocialIcons';
import ProfileAvatar from './ProfileAvatar';
import ProfileBanner from './ProfileBanner';
import BusinessHoursSection from './BusinessHoursSection';
import AppointmentBookingSection from './AppointmentBookingSection';
import ServicesSection from './ServicesSection';
import PortfolioSection from './PortfolioSection';
import VideoPortfolioSection from './VideoPortfolioSection';
import PaymentSection from './PaymentSection';
import BankDetailsSection from './BankDetailsSection';
import { resolveProfileLinks, DynamicLinkIcon } from '../../lib/socialLinkResolver';
import { resolveMapUrl } from '../../lib/constants';
import { downloadVCard } from '../../lib/vcard';
import { generateQrDataUrl, downloadQrPng, downloadQrSvg } from '../../lib/qr';
import { getProfileTheme } from '../../lib/themeService';

export default function FullScreenDigitalProfile({
  profile = {},
  isLight = false,
  reducedMotion = false
}) {
  const p = profile || {};
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedServiceIdForBooking, setSelectedServiceIdForBooking] = useState(null);

  const activeTheme = useMemo(() => getProfileTheme(p.theme || p.cardFinish || p.edition), [p.theme, p.cardFinish, p.edition]);
  const accentColor = p.accentColor || activeTheme.accentColor;
  const glowColor = p.glowColor || activeTheme.glowColor;
  const photoShape = p.photoShape || 'circle';
  const isCircle = photoShape === 'circle';

  const currentUrl = typeof window !== 'undefined'
    ? (window.location.origin + `/p/${p.slug}`)
    : `https://flocard.in/p/${p.slug}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${p.name} — FLOCARD Digital Identity`,
        text: `Connect with ${p.name} (${p.role} at ${p.company})`,
        url: currentUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Section visibility gates
  const secVis = p.sectionVisibility || {
    banner: true,
    about: true,
    hours: true,
    booking: true,
    services: true,
    portfolio: true,
    videos: true,
    payments: true,
    bankDetails: false,
    experience: true,
    contact: true,
    qrCompanion: true
  };

  // Contact info
  const displayPhone = p.phone || '+91 97782 78552';
  const cleanPhone = String(displayPhone).replace(/[^0-9+]/g, '');
  const rawWhatsapp = p.whatsapp || p.phone || '919778278552';
  const cleanWhatsapp = String(rawWhatsapp).replace(/[^0-9]/g, '');
  const displayEmail = p.email || 'contact@flocard.in';
  const displayAddress = [p.address, p.location].filter(Boolean).join(', ') || p.address || p.location || '';
  const mapsLink = resolveMapUrl(p);

  // Resolved social links
  const resolvedLinks = useMemo(() => resolveProfileLinks(p), [p]);
  const socialCapsuleLinks = useMemo(() => {
    const list = resolvedLinks.filter(l => l.platform !== 'phone' && l.platform !== 'whatsapp' && l.platform !== 'email');
    if (list.length > 0) return list;
    return [
      { id: 'def_yt', platform: 'youtube', label: 'YouTube', href: 'https://youtube.com', isExternal: true },
      { id: 'def_ig', platform: 'instagram', label: 'Instagram', href: 'https://instagram.com', isExternal: true },
      { id: 'def_li', platform: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com', isExternal: true },
      { id: 'def_web', platform: 'website', label: 'Website', href: p.website || 'https://flocard.in', isExternal: true }
    ];
  }, [resolvedLinks, p.website]);

  // Banner visibility check
  const hasBanner = Boolean(
    secVis.banner !== false &&
    p.banner &&
    p.banner.enabled !== false &&
    (p.banner.url || p.banner.type === 'gradient' || p.banner.type === 'color' || p.banner.type === 'video' || p.banner.type === 'image')
  );

  return (
    <article
      className={`flocard-fullscreen-profile ${isLight ? 'theme-light' : 'theme-dark'}`}
      style={{
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100vh',
        backgroundColor: isLight ? activeTheme.pageBgLight : activeTheme.pageBgDark,
        color: isLight ? '#0F172A' : '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}
    >
      {/* =========================================================================
          PART 1: DISCORD/FACEBOOK-STYLE COVER BANNER
          ========================================================================= */}
      {hasBanner && (
        <ProfileBanner
          banner={p.banner}
          accentColor={accentColor}
          glowColor={glowColor}
          isLight={isLight}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Main Content Column (Full-width with elegant responsive max-width) */}
      <div
        className="flocard-profile-content-container"
        style={{
          width: '100%',
          maxWidth: '1160px',
          padding: '0 20px 80px',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* =========================================================================
            PART 2: PROFILE HEADER & OVERLAPPING IDENTITY
            ========================================================================= */}
        <header
          className="flocard-profile-header"
          style={{
            marginTop: hasBanner ? '-64px' : '28px',
            marginBottom: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            position: 'relative',
            zIndex: 20
          }}
        >
          {/* Top Overlap Row: Avatar + Brand/Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              width: '100%',
              flexWrap: 'wrap',
              gap: '18px',
              marginBottom: '16px'
            }}
          >
            {/* Avatar with Verified Badge */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  padding: '4px',
                  backgroundColor: isLight ? activeTheme.pageBgLight : activeTheme.pageBgDark,
                  borderRadius: isCircle ? '50%' : '26px',
                  boxShadow: `0 12px 36px rgba(0,0,0,0.4), 0 0 24px ${glowColor}30`,
                  display: 'inline-block'
                }}
              >
                <ProfileAvatar
                  profile={p}
                  size={128}
                  glowColor={glowColor}
                  accentColor={accentColor}
                  isCircle={isCircle}
                />
              </div>

              {p.isVerified !== false && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: activeTheme.verifiedBadgeBg || glowColor,
                    border: `3px solid ${isLight ? activeTheme.pageBgLight : activeTheme.pageBgDark}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeTheme.verifiedBadgeColor || '#FFFFFF',
                    boxShadow: `0 4px 12px ${glowColor}80`
                  }}
                  title="Verified FLOCARD Digital Profile"
                >
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Quick Action Buttons (Save Contact vCard & Share Profile) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={() => downloadVCard(p)}
                style={{
                  padding: '11px 22px',
                  borderRadius: '9999px',
                  backgroundColor: activeTheme.buttonBg || accentColor,
                  color: activeTheme.buttonText || '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: `0 6px 20px ${glowColor}40`,
                  transition: 'transform 0.18s ease'
                }}
              >
                <Download size={15} />
                <span>Save Contact (vCard)</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                style={{
                  padding: '11px 20px',
                  borderRadius: '9999px',
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
                  color: isLight ? '#130B22' : '#FFFFFF',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255, 255, 255, 0.2)'}`,
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                {copiedLink ? <Check size={15} color="#10B981" /> : <Share2 size={15} />}
                <span>{copiedLink ? 'Link Copied!' : 'Share Profile'}</span>
              </button>
            </div>
          </div>

          {/* Identity Information (Name, Role, Company, Bio) */}
          <div style={{ width: '100%' }}>
            <h1
              style={{
                fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                fontSize: 'clamp(1.75rem, 4.5vw, 2.5rem)',
                fontWeight: 800,
                color: isLight ? '#0F172A' : '#FFFFFF',
                margin: '0 0 6px',
                lineHeight: 1.15,
                letterSpacing: '-0.02em'
              }}
            >
              {p.name}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                fontSize: 'clamp(0.95rem, 2.5vw, 1.12rem)',
                fontWeight: 600,
                color: accentColor,
                marginBottom: '10px'
              }}
            >
              <span>{p.role}</span>
              {p.company && (
                <>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span style={{ color: isLight ? '#334155' : '#D1D5DB' }}>{p.company}</span>
                </>
              )}
            </div>

            {/* Location Pill Header */}
            {(p.location || p.address) && (
              <div style={{ marginBottom: '12px' }}>
                <a
                  href={mapsLink || '#'}
                  target={mapsLink ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  onClick={e => { if (!mapsLink) e.preventDefault(); }}
                  title={mapsLink ? 'Open location in Google Maps' : 'Location details'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 14px',
                    borderRadius: '9999px',
                    backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.07)',
                    border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.12)'}`,
                    color: isLight ? '#334155' : '#E2E8F0',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: mapsLink ? 'pointer' : 'default',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={e => {
                    if (mapsLink) {
                      e.currentTarget.style.borderColor = accentColor;
                      e.currentTarget.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (mapsLink) {
                      e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.07)';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <MapPin size={13} color={accentColor} />
                  <span>{p.location || p.address}</span>
                  {mapsLink && <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>↗</span>}
                </a>
              </div>
            )}

            {p.bio && (
              <p
                style={{
                  fontSize: 'clamp(0.88rem, 2vw, 0.98rem)',
                  color: isLight ? '#475569' : '#D5C9E5',
                  lineHeight: 1.6,
                  maxWidth: '720px',
                  margin: '0 0 18px'
                }}
              >
                {p.bio}
              </p>
            )}

            {/* Direct Communication Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '18px'
              }}
            >
              {cleanPhone && (
                <a
                  href={`tel:${cleanPhone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255, 255, 255, 0.08)',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.15)'}`,
                    color: isLight ? '#0F172A' : '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: '0.84rem',
                    fontWeight: 600
                  }}
                >
                  <Phone size={14} color={accentColor} />
                  <span>Call {displayPhone}</span>
                </a>
              )}

              {cleanWhatsapp && (
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(37, 211, 102, 0.14)',
                    border: '1px solid rgba(37, 211, 102, 0.35)',
                    color: '#25D366',
                    textDecoration: 'none',
                    fontSize: '0.84rem',
                    fontWeight: 600
                  }}
                >
                  <WhatsappIcon size={16} color="#25D366" />
                  <span>WhatsApp</span>
                </a>
              )}

              {displayEmail && (
                <a
                  href={`mailto:${displayEmail}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255, 255, 255, 0.08)',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.15)'}`,
                    color: isLight ? '#0F172A' : '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: '0.84rem',
                    fontWeight: 600
                  }}
                >
                  <Mail size={14} color={accentColor} />
                  <span>Email</span>
                </a>
              )}
            </div>

            {/* Social Links Capsule */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(18, 12, 28, 0.85)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.15)'}`,
                boxShadow: isLight ? '0 2px 10px rgba(0,0,0,0.04)' : '0 6px 20px rgba(0,0,0,0.4)',
                flexWrap: 'wrap'
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
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: isLight ? '#F1F5F9' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0C0816',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'transform 0.16s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <DynamicLinkIcon link={link} size={17} color="#0C0816" />
                </a>
              ))}
            </div>
          </div>
        </header>

        {/* Divider */}
        <div style={{ height: '1px', width: '100%', backgroundColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)', margin: '16px 0' }} />

        {/* =========================================================================
            PART 3: ABOUT / LOCATION SECTION
            ========================================================================= */}
        {secVis.about !== false && Boolean(p.company || p.location || p.address) && (
          <section
            className="flocard-profile-section flocard-about-section"
            style={{ padding: '24px 0', width: '100%' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: (p.company && (p.location || p.address)) ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr',
                gap: '14px'
              }}
            >
              {p.company && (
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: '16px',
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: accentColor, marginBottom: '4px' }}>
                    <Building2 size={14} />
                    <span>Organization</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    {p.company}
                  </div>
                </div>
              )}

              {(p.location || p.address) && (
                <a
                  href={mapsLink || '#'}
                  target={mapsLink ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  onClick={e => { if (!mapsLink) e.preventDefault(); }}
                  title={mapsLink ? 'Click to open in Google Maps' : 'Location details'}
                  style={{
                    display: 'block',
                    padding: '18px 20px',
                    borderRadius: '16px',
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                    textDecoration: 'none',
                    cursor: mapsLink ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    if (mapsLink) {
                      e.currentTarget.style.borderColor = accentColor;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}22`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (mapsLink) {
                      e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: accentColor }}>
                      <MapPin size={14} />
                      <span>Location / Base</span>
                    </div>
                    {mapsLink && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: accentColor
                        }}
                      >
                        <span>Directions</span>
                        <ExternalLink size={12} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    {p.location || p.address}
                  </div>
                  {p.address && p.location && p.address !== p.location && (
                    <div style={{ fontSize: '0.8rem', color: isLight ? '#64748B' : '#94A3B8', marginTop: '4px', lineHeight: 1.4 }}>
                      {p.address}
                    </div>
                  )}
                </a>
              )}
            </div>
          </section>
        )}

        {/* =========================================================================
            PART 4: BUSINESS HOURS SECTION
            ========================================================================= */}
        {secVis.hours !== false && (
          <BusinessHoursSection
            businessHours={p.businessHours}
            accentColor={accentColor}
            glowColor={glowColor}
            isLight={isLight}
          />
        )}

        {/* =========================================================================
            PART 5: SERVICES SHOWCASE SECTION
            ========================================================================= */}
        {secVis.services !== false && (
          <ServicesSection
            services={p.services}
            whatsapp={cleanWhatsapp}
            email={p.email}
            onSelectServiceForBooking={(srvId) => setSelectedServiceIdForBooking(srvId)}
            accentColor={accentColor}
            glowColor={glowColor}
            isLight={isLight}
          />
        )}

        {/* =========================================================================
            PART 6: APPOINTMENT BOOKING SECTION
            ========================================================================= */}
        {secVis.booking !== false && (
          <AppointmentBookingSection
            profile={p}
            businessHours={p.businessHours}
            bookingConfig={p.bookingConfig}
            preselectedServiceId={selectedServiceIdForBooking}
            accentColor={accentColor}
            glowColor={glowColor}
            isLight={isLight}
          />
        )}

        {/* =========================================================================
            PART 7: PORTFOLIO GALLERY SECTION
            ========================================================================= */}
        {secVis.portfolio !== false && (
          <PortfolioSection
            portfolio={p.portfolio}
            accentColor={accentColor}
            glowColor={glowColor}
            isLight={isLight}
          />
        )}

        {/* =========================================================================
            PART 8: VIDEO PORTFOLIO SECTION
            ========================================================================= */}
        {secVis.videos !== false && (
          <VideoPortfolioSection
            videos={p.videos}
            accentColor={accentColor}
            glowColor={glowColor}
            isLight={isLight}
          />
        )}

        {/* =========================================================================
            PART 9: PAYMENT OPTIONS SECTION (UPI & QR)
            ========================================================================= */}
        {secVis.payments !== false && (
          <PaymentSection
            paymentConfig={p.paymentConfig}
            accentColor={accentColor}
            glowColor={glowColor}
            isLight={isLight}
          />
        )}

        {/* =========================================================================
            PART 10: PUBLIC BANK DETAILS (Explicit Owner Consent Only)
            ========================================================================= */}
        {secVis.bankDetails !== false && (
          <BankDetailsSection
            bankDetails={p.bankDetails}
            accentColor={accentColor}
            glowColor={glowColor}
            isLight={isLight}
          />
        )}

        {/* =========================================================================
            PART 11: SMART QR COMPANION & NFC CONNECT
            ========================================================================= */}
        {secVis.qrCompanion !== false && (
          <section
            className="flocard-profile-section flocard-qr-section"
            style={{
              width: '100%',
              margin: '0 auto',
              padding: '36px 0',
              position: 'relative',
              zIndex: 2,
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                borderRadius: '24px',
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
                boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.05)' : '0 12px 36px rgba(0,0,0,0.3)',
                padding: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '24px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ maxWidth: '480px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: accentColor, marginBottom: '6px' }}>
                  <Sparkles size={14} />
                  <span>NFC & QR Companion</span>
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: isLight ? '#0F172A' : '#FFFFFF',
                    margin: '0 0 8px'
                  }}
                >
                  Connect in Seconds with FLOCARD
                </h3>
                <p style={{ fontSize: '0.86rem', color: isLight ? '#475569' : '#D1D5DB', lineHeight: 1.55, margin: 0 }}>
                  Scan the companion QR code or tap your luxury FLOCARD NFC business card against any smartphone to open this digital profile instantly.
                </p>

                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => downloadQrPng(currentUrl, `FLOCARD-${p.slug || 'identity'}`)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'}`,
                      backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                      color: isLight ? '#0F172A' : '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={13} />
                    <span>Download PNG QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadQrSvg(currentUrl, `FLOCARD-${p.slug || 'identity'}`)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'}`,
                      backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                      color: isLight ? '#0F172A' : '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={13} />
                    <span>Download Vector SVG</span>
                  </button>
                </div>
              </div>

              {/* Minimal Brand Badge */}
              <div
                style={{
                  padding: '16px 22px',
                  borderRadius: '16px',
                  backgroundColor: isLight ? '#F1F5F9' : activeTheme.cardBg,
                  border: `1px solid ${accentColor}30`,
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>
                  Platform Host
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                  flocard.in/{p.slug}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Global Minimal Branding Footer */}
        <footer
          style={{
            marginTop: '36px',
            textAlign: 'center',
            color: isLight ? '#64748B' : '#82758F',
            fontSize: '0.75rem',
            letterSpacing: '0.5px'
          }}
        >
          <span>FLOCARDS Digital Business Identity Platform • </span>
          <a
            href="/"
            style={{ color: accentColor, textDecoration: 'none', fontWeight: 700 }}
          >
            Create Your FLOCARD
          </a>
        </footer>
      </div>
    </article>
  );
}
