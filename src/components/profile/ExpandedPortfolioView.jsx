/* ==========================================================================
   FLOCARD EXPANDED DIGITAL PORTFOLIO
   Shared-element morphing target view with hero lockup,
   real portfolio gallery, project lightbox, vCard export, and reverse collapse.
   ========================================================================== */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MagicBento from '../MagicBento/MagicBento';
import ReflectiveCard from '../ReflectiveCard/ReflectiveCard';
import {
  ArrowLeft,
  X,
  Check,
  Share2,
  Download,
  Phone,
  Mail,
  Globe,
  MessageSquare,
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
  Maximize2
} from 'lucide-react';
import { LinkedinIcon, InstagramIcon, TwitterIcon, GithubIcon } from '../SocialIcons';
import { downloadVCard } from '../../lib/vcard';

export default function ExpandedPortfolioView({
  profile = {},
  onCollapse,
  isLight = false,
  reducedMotion = false
}) {
  const p = profile || {};
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedProject, setSelectedProject] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const bentoItems = useMemo(() => {
    if (!p.portfolio || p.portfolio.length === 0) return [];
    const visuals = ['analytics', 'dashboard', 'collaboration', 'automation', 'integration', 'security'];
    return p.portfolio.map((item, idx) => ({
      id: item?.id || `bento-${idx}`,
      title: item?.title || '',
      description: item?.description || '',
      label: item?.category || 'Featured Work',
      image: item?.image,
      visual: item?.image ? undefined : visuals[idx % visuals.length],
      colSpan: idx === 0 ? 2 : 1,
      rowSpan: idx === 0 ? 2 : 1,
      onClick: () => setSelectedProject(item)
    }));
  }, [p.portfolio]);

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
    : { duration: 0.72, ease: [0.16, 1, 0.3, 1] };

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

  return (
    <motion.div
      layoutId="profile-card-container"
      transition={transitionConfig}
      style={{
        width: '100%',
        maxWidth: '900px',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <ReflectiveCard
        theme={isLight ? 'light' : 'dark'}
        tint={metalTint}
        webcam={false}
        metalness={0.92}
        roughness={0.28}
        blurStrength={6}
        shine={1.25}
        glare={0.45}
        bevel={2}
        enableTilt={!reducedMotion}
        tiltStrength={2}
        width="100%"
        height="auto"
        radius={20}
        className="flocard-reflective-expanded"
        style={{
          width: '100%',
          maxWidth: '900px',
          borderRadius: '20px',
          zIndex: 1
        }}
        bodyStyle={{
          borderRadius: '20px',
          border: `1px solid ${accentColor}45`,
          boxShadow: glowShadow,
          background: `linear-gradient(155deg, ${gradientMid} 0%, ${gradientStart} 45%, ${gradientEnd} 100%)`
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            padding: '24px 20px 36px',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
      {/* Ambient Cream Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${creamHighlight}12 0%, ${accentColor}08 50%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Top Bar with Brand & Back/Collapse Control */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          zIndex: 2,
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Brand Lockup (Single clean brand logo, matching navbar without duplicate text) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <img
            src={isLight ? '/assets/FLOCARD_black_transparent.png' : '/assets/FLOCARD_white_transparent.png'}
            alt="FLOCARD"
            style={{ height: '24px', width: 'auto', display: 'block', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline-block';
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-heading, 'Sora', sans-serif)",
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '0.04em',
              color: '#FFFFFF',
              display: 'none'
            }}
          >
            FLOCARD<sup style={{ fontSize: '0.52rem', marginLeft: '2px', color: '#D5C9E5' }}>®</sup>
          </span>
        </div>

        {/* Right Actions: Collapse Control & QR Code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Back/Collapse to Card Button */}
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse back to compact card"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${accentColor}50`,
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.borderColor = accentColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = `${accentColor}50`;
            }}
          >
            <ArrowLeft size={15} />
            <span>Collapse to Card</span>
            <span
              style={{
                fontSize: '0.62rem',
                padding: '2px 5px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#D5C9E5',
                marginLeft: '4px'
              }}
            >
              Esc
            </span>
          </button>

          {/* Quick QR & Share Icons */}
          <button
            type="button"
            onClick={handleShare}
            title={copiedLink ? "Link copied!" : "Share Profile"}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: copiedLink ? '#10B981' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Hero Lockup (Shared Photo, Name, Role) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '24px',
          marginBottom: '28px',
          position: 'relative',
          zIndex: 2,
          flexWrap: 'wrap'
        }}
      >
        {/* Shared Photo */}
        <motion.div
          layoutId="profile-card-avatar"
          transition={transitionConfig}
          style={{
            width: isCircle ? '124px' : '118px',
            height: isCircle ? '124px' : '136px',
            minWidth: isCircle ? '124px' : '118px',
            borderRadius: isCircle ? '50%' : '24px',
            padding: '3px',
            background: `linear-gradient(135deg, ${glowColor} 0%, ${accentColor} 100%)`,
            boxShadow: `0 0 30px ${glowColor}60, inset 0 0 12px ${accentColor}40`,
            position: 'relative',
            flexShrink: 0
          }}
        >
          <img
            src={profile.avatar || profile.logo || '/assets/akhil.jpg'}
            alt={profile.name}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: isCircle ? '50%' : '21px',
              objectFit: 'cover',
              display: 'block'
            }}
          />

          {profile.isVerified !== false && (
            <div
              style={{
                position: 'absolute',
                bottom: isCircle ? '4px' : '-2px',
                right: isCircle ? '4px' : '-2px',
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
              title="Verified FLOCARD NFC Profile"
            >
              <Check size={14} strokeWidth={3.2} />
            </div>
          )}
        </motion.div>

        {/* Hero Identity Text */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <motion.h1
              layoutId="profile-card-name"
              transition={transitionConfig}
              style={{
                fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: 0
              }}
            >
              {profile.name}
            </motion.h1>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 9px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10B981',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
            >
              <Sparkles size={11} />
              <span>Verified Identity</span>
            </span>
          </div>

          <motion.div
            layoutId="profile-card-role"
            transition={transitionConfig}
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#FFFFFF',
              marginBottom: '6px'
            }}
          >
            {profile.role}
          </motion.div>

          <motion.div
            layoutId="profile-card-company"
            transition={transitionConfig}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#D5C9E5',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}
          >
            <span>{profile.company}</span>
            {profile.location && (
              <>
                <span style={{ opacity: 0.4 }}>•</span>
                <span style={{ opacity: 0.85, textTransform: 'none' }}>{profile.location}</span>
              </>
            )}
          </motion.div>

          {profile.bio && (
            <p
              style={{
                fontSize: '0.9rem',
                color: '#D5C9E5',
                lineHeight: 1.55,
                margin: '6px 0 16px',
                opacity: 0.95
              }}
            >
              {profile.bio}
            </p>
          )}

          {/* Master Action Buttons: White Save Contact Pill + Dark Share Pill */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => downloadVCard(profile)}
              style={{
                padding: '10px 22px',
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
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Download size={16} />
              <span>Save Contact (vCard)</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              style={{
                padding: '10px 20px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                fontWeight: 600,
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'}
            >
              {copiedLink ? <Check size={16} color="#10B981" /> : <Share2 size={16} />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staggered Expanded Content */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        {/* Contact Icons Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            marginBottom: '28px',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#D5C9E5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Direct Connect:
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                title={`Call ${profile.phone}`}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Phone size={16} color={accentColor} />
              </a>
            )}

            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                title={`Email ${profile.email}`}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Mail size={16} color={accentColor} />
              </a>
            )}

            {profile.whatsapp && (
              <a
                href={`https://wa.me/${profile.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp Message"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#25D366',
                  textDecoration: 'none'
                }}
              >
                <MessageSquare size={16} />
              </a>
            )}

            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                title={`Visit ${profile.website}`}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  textDecoration: 'none'
                }}
              >
                <Globe size={16} color={accentColor} />
              </a>
            )}

            {/* Social Links */}
            {profile.socialLinks?.linkedin && (
              <a
                href={profile.socialLinks.linkedin}
                target="_blank"
                rel="noreferrer"
                title="LinkedIn"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(10, 102, 194, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0A66C2',
                  textDecoration: 'none'
                }}
              >
                <LinkedinIcon size={16} />
              </a>
            )}

            {profile.socialLinks?.instagram && (
              <a
                href={profile.socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                title="Instagram"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(225, 48, 108, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E1306C',
                  textDecoration: 'none'
                }}
              >
                <InstagramIcon size={16} />
              </a>
            )}
          </div>
        </div>

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
                  columns={3}
                  rowHeight={210}
                  gap={14}
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
              <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '0.74rem', color: '#D5C9E5', textTransform: 'uppercase', fontWeight: 600 }}>Location</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>{profile.location || 'Global'}</div>
              </div>
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

        {/* Bottom Collapse Banner */}
        <div style={{ textAlign: 'center', marginTop: '36px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            type="button"
            onClick={onCollapse}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${accentColor}40`,
              color: '#FFFFFF',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={15} />
            <span>Collapse Back to Profile Card</span>
          </button>
          <div style={{ fontSize: '0.72rem', color: '#D5C9E5', opacity: 0.6, marginTop: '8px' }}>
            Verified FLOCARD Digital Identity • One Tap Every Connection
          </div>
        </div>
      </motion.div>
    </div>
  </ReflectiveCard>

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
    </motion.div>
  );
}
