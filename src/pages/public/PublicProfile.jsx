/* ==========================================================================
   FLOCARD PREMIUM DIGITAL BUSINESS PROFILE (/p/:slug)
   Redesigned to match Reference Image 1 & Reference Image 2:
   Luxury Obsidian & Cosmic Purple, 2-Column Portfolio Grid,
   Horizontal Profile Lockup, Circular Contact Actions with Labels,
   White 'Save Contact' and Dark 'Share Profile' Pill Buttons.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  Globe,
  Bookmark,
  Share2,
  Check,
  QrCode,
  MapPin,
  Briefcase,
  ArrowUpRight,
  MoreHorizontal,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import { LinkedinIcon, InstagramIcon } from '../../components/SocialIcons';
import QRCode from 'qrcode';
import { useData } from '../../context/DataContext';
import { downloadVCard } from '../../lib/vcard';

export default function PublicProfile({ slug = 'akhil' }) {
  const { getProfileBySlug, profiles } = useData();
  const profile = (getProfileBySlug && getProfileBySlug(slug)) || profiles.find(p => p.slug === slug) || profiles[0];

  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' | 'about' | 'services'
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [selectedWorkImage, setSelectedWorkImage] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://flocard.in/p/${slug}`;

  useEffect(() => {
    QRCode.toDataURL(currentUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#A855F7',
        light: '#0D0915'
      }
    }).then(setQrDataUrl).catch(console.error);
  }, [currentUrl]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.name} — FLOCARD Digital Identity`,
        text: `Connect with ${profile.name} (${profile.role} at ${profile.company})`,
        url: currentUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px', background: '#08060D' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>Profile Not Found</h2>
          <p style={{ color: '#82758F', marginTop: '8px' }}>The requested FLOCARD identity profile does not exist.</p>
          <a href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>Return to Homepage</a>
        </div>
      </div>
    );
  }

  // Fallback thumbnails for portfolio items if not provided
  const defaultThumbnails = [
    '/assets/true_front_card.png',
    '/assets/hero-bg.jpg',
    '/assets/cardbg-purple.png',
    '/assets/ref_page_1.png_front.png'
  ];

  return (
    <div
      className="public-profile-root"
      style={{
        minHeight: '100vh',
        background: '#08060D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 12px 60px',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Ambient Cosmic Purple Glow in Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '680px',
          height: '420px',
          background: 'radial-gradient(ellipse at 50% -10%, rgba(107, 0, 255, 0.45) 0%, rgba(76, 29, 149, 0.2) 45%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Main Luxury Profile Container Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '470px',
          background: 'linear-gradient(180deg, #130B22 0%, #0B0813 100%)',
          border: '1px solid #30223F',
          borderRadius: '36px',
          padding: '24px 20px 28px',
          boxShadow: '0 25px 70px -15px rgba(107, 0, 255, 0.35), 0 0 0 1px rgba(168, 85, 247, 0.15)',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Header Bar: FLOCARD Logo on Left, Options Menu on Right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '16px',
            position: 'relative'
          }}
        >
          {/* Official FLOCARD Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <img
              src="/assets/logo-light.png"
              alt="FLOCARD"
              style={{ height: '22px', width: 'auto', display: 'block' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-heading, Sora)',
                fontWeight: 800,
                fontSize: '1.05rem',
                letterSpacing: '0.04em',
                color: '#FFFFFF'
              }}
            >
              FLOCARD<sup style={{ fontSize: '0.55rem', marginLeft: '2px', color: '#B8AEC8' }}>®</sup>
            </span>
          </div>

          {/* Options Circle Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              aria-label="Profile Options"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid #30223F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B8AEC8',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <MoreHorizontal size={18} />
            </button>

            {/* Menu Dropdown */}
            {showMenuDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  right: 0,
                  width: '180px',
                  background: '#15101D',
                  border: '1px solid #30223F',
                  borderRadius: '14px',
                  padding: '6px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(true);
                    setShowMenuDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <QrCode size={15} color="#A855F7" />
                  <span>Show QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    setShowMenuDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Copy size={15} color="#A855F7" />
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ambient Violet Wave Gradient Effect in Card Header */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: 0,
            width: '260px',
            height: '140px',
            background: 'radial-gradient(circle at 80% 20%, rgba(107, 0, 255, 0.35) 0%, transparent 65%)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Profile Header: Horizontal Lockup (Avatar on Left, Details on Right) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            marginTop: '8px',
            marginBottom: '24px',
            position: 'relative',
            zIndex: 2
          }}
        >
          {/* Avatar with Circular Glowing Purple Border + Verified Badge */}
          <div
            style={{
              width: '106px',
              height: '106px',
              minWidth: '106px',
              borderRadius: '50%',
              padding: '3px',
              background: 'linear-gradient(135deg, #6B00FF 0%, #A855F7 100%)',
              position: 'relative',
              boxShadow: '0 0 24px rgba(107, 0, 255, 0.5), inset 0 0 10px rgba(168, 85, 247, 0.4)'
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

            {/* Verified Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '1px',
                right: '1px',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#6B00FF',
                border: '2.5px solid #0B0813',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(107, 0, 255, 0.7)'
              }}
              title="Verified FLOCARD NFC Profile"
            >
              <Check size={13} strokeWidth={3.2} />
            </div>
          </div>

          {/* Details Column */}
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <h1
              style={{
                fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                fontSize: '1.45rem',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: 0
              }}
            >
              {profile.name}
            </h1>

            <div
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: '#FFFFFF',
                marginTop: '4px'
              }}
            >
              {profile.role}
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#B8AEC8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginTop: '4px'
              }}
            >
              {profile.logo && (
                <img
                  src={profile.logo}
                  alt="Company Logo"
                  style={{ height: '16px', width: 'auto', maxHeight: '18px', objectFit: 'contain', borderRadius: '3px' }}
                />
              )}
              <span>{profile.company}</span>
            </div>

            {profile.bio && (
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#82758F',
                  lineHeight: 1.42,
                  marginTop: '6px',
                  marginBotom: 0
                }}
              >
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Contact Actions (Circular Buttons with Labels Underneath) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '22px',
            width: '100%'
          }}
        >
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                flex: 1
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#1B1425',
                  border: '1px solid #30223F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D8B4FE',
                  transition: 'all 0.2s ease'
                }}
                className="contact-action-btn"
                title="Call Phone"
              >
                <Phone size={17} />
              </div>
              <span style={{ fontSize: '0.7rem', color: '#B8AEC8', fontWeight: 500 }}>Call</span>
            </a>
          )}

          {profile.whatsapp && (
            <a
              href={`https://wa.me/${profile.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                flex: 1
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#1B1425',
                  border: '1px solid #30223F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D8B4FE',
                  transition: 'all 0.2s ease'
                }}
                className="contact-action-btn"
                title="WhatsApp Message"
              >
                <MessageSquare size={17} />
              </div>
              <span style={{ fontSize: '0.7rem', color: '#B8AEC8', fontWeight: 500 }}>WhatsApp</span>
            </a>
          )}

          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                flex: 1
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#1B1425',
                  border: '1px solid #30223F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D8B4FE',
                  transition: 'all 0.2s ease'
                }}
                className="contact-action-btn"
                title="Send Email"
              >
                <Mail size={17} />
              </div>
              <span style={{ fontSize: '0.7rem', color: '#B8AEC8', fontWeight: 500 }}>Email</span>
            </a>
          )}

          {profile.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                flex: 1
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#1B1425',
                  border: '1px solid #30223F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D8B4FE',
                  transition: 'all 0.2s ease'
                }}
                className="contact-action-btn"
                title="LinkedIn Profile"
              >
                <LinkedinIcon size={17} />
              </div>
              <span style={{ fontSize: '0.7rem', color: '#B8AEC8', fontWeight: 500 }}>LinkedIn</span>
            </a>
          )}

          {profile.instagram && (
            <a
              href={profile.instagram}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                flex: 1
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#1B1425',
                  border: '1px solid #30223F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D8B4FE',
                  transition: 'all 0.2s ease'
                }}
                className="contact-action-btn"
                title="Instagram Profile"
              >
                <InstagramIcon size={17} />
              </div>
              <span style={{ fontSize: '0.7rem', color: '#B8AEC8', fontWeight: 500 }}>Instagram</span>
            </a>
          )}

          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                flex: 1
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#1B1425',
                  border: '1px solid #30223F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D8B4FE',
                  transition: 'all 0.2s ease'
                }}
                className="contact-action-btn"
                title="Website"
              >
                <Globe size={17} />
              </div>
              <span style={{ fontSize: '0.7rem', color: '#B8AEC8', fontWeight: 500 }}>Website</span>
            </a>
          )}
        </div>

        {/* Primary Profile Actions: Save Contact (White Pill) & Share Profile (Dark Pill) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '22px',
            width: '100%'
          }}
        >
          {/* Save Contact (Prominent White Pill) */}
          <button
            type="button"
            onClick={() => downloadVCard(profile)}
            style={{
              background: '#FFFFFF',
              color: '#191522',
              border: 'none',
              borderRadius: '9999px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Bookmark size={16} fill="#191522" />
            <span>Save Contact</span>
          </button>

          {/* Share Profile (Dark Surface with Purple Border) */}
          <button
            type="button"
            onClick={handleShare}
            style={{
              background: '#1B1425',
              color: '#FFFFFF',
              border: '1px solid #30223F',
              borderRadius: '9999px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {copied ? <Check size={16} color="#34d399" /> : <Share2 size={16} />}
            <span>{copied ? 'Link Copied!' : 'Share Profile'}</span>
          </button>
        </div>

        {/* Profile Content Tabs (Segmented Pill Bar) */}
        <div
          style={{
            display: 'flex',
            background: '#15101D',
            border: '1px solid #30223F',
            borderRadius: '9999px',
            padding: '4px',
            marginBottom: '20px',
            width: '100%'
          }}
        >
          {[
            { id: 'portfolio', label: 'Portfolio' },
            { id: 'about', label: 'About' },
            { id: 'services', label: 'Services' }
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: '0.82rem',
                  fontWeight: active ? 600 : 500,
                  border: 'none',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  background: active ? '#6B00FF' : 'transparent',
                  color: active ? '#FFFFFF' : '#82758F',
                  boxShadow: active ? '0 2px 10px rgba(107, 0, 255, 0.45)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div style={{ width: '100%', textAlign: 'left' }}>
          {/* ================================================================
              TAB 1: PORTFOLIO (2-Column Grid matching Reference Image 1)
              ================================================================ */}
          {activeTab === 'portfolio' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}
            >
              {(profile.portfolio && profile.portfolio.length > 0 ? profile.portfolio : []).map((item, idx) => {
                const thumbnailSrc = item.image || defaultThumbnails[idx % defaultThumbnails.length];
                return (
                  <div
                    key={item.id || idx}
                    style={{
                      background: '#1B1425',
                      border: '1px solid #30223F',
                      borderRadius: '18px',
                      padding: '12px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease',
                      textDecoration: 'none'
                    }}
                    className="portfolio-card-item"
                  >
                    {/* Thumbnail Image Container */}
                    <div
                      onClick={() => setSelectedWorkImage({ ...item, image: thumbnailSrc })}
                      style={{
                        width: '100%',
                        height: '110px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#0E0A16',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                      title="Click to view full work image"
                    >
                      <img
                        src={thumbnailSrc}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.25s ease'
                        }}
                      />

                      {/* Top-Right Circular Arrow Button (→) */}
                      <a
                        href={item.link || '#'}
                        onClick={(e) => {
                          if (!item.link) e.preventDefault();
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(27, 20, 37, 0.85)',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(6px)',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease'
                        }}
                        title="Open Project"
                      >
                        <ArrowUpRight size={14} />
                      </a>
                    </div>

                    {/* Category Label */}
                    <div
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        color: '#A855F7',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginTop: '10px'
                      }}
                    >
                      {item.category || 'PROJECT'}
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        lineHeight: 1.25,
                        marginTop: '2px',
                        marginBottom: 0
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Short Description */}
                    {item.desc && (
                      <p
                        style={{
                          fontSize: '0.72rem',
                          color: '#82758F',
                          lineHeight: 1.35,
                          marginTop: '4px',
                          marginBottom: 0
                        }}
                      >
                        {item.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ================================================================
              TAB 2: ABOUT
              ================================================================ */}
          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Bio Block */}
              <div
                style={{
                  background: '#1B1425',
                  border: '1px solid #30223F',
                  borderRadius: '18px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Biography
                </div>
                <p style={{ fontSize: '0.82rem', color: '#B8AEC8', lineHeight: 1.6, margin: 0 }}>
                  {profile.bio || 'Professional identity profile powered by FLOCARD contactless hardware.'}
                </p>
              </div>

              {/* Details & Coordinates */}
              <div
                style={{
                  background: '#1B1425',
                  border: '1px solid #30223F',
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  Professional Details
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#82758F' }}>Company</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{profile.company}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#82758F' }}>Designation</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{profile.role}</span>
                </div>
                {profile.location && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <span style={{ color: '#82758F' }}>Base</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{profile.location}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#82758F' }}>Profile URL</span>
                  <span style={{ color: '#A855F7', fontWeight: 600 }}>flocard.in/p/{profile.slug}</span>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: SERVICES
              ================================================================ */}
          {activeTab === 'services' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(profile.services && profile.services.length > 0 ? profile.services : []).map((srv, idx) => (
                <div
                  key={srv.id || idx}
                  style={{
                    background: '#1B1425',
                    border: '1px solid #30223F',
                    borderRadius: '16px',
                    padding: '14px 16px',
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
                      background: 'rgba(107, 0, 255, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#D8B4FE',
                      flexShrink: 0
                    }}
                  >
                    <Briefcase size={17} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        margin: 0
                      }}
                    >
                      {srv.title}
                    </h4>
                    {srv.desc && (
                      <p style={{ fontSize: '0.76rem', color: '#82758F', lineHeight: 1.45, marginTop: '4px', marginBottom: 0 }}>
                        {srv.desc}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Minimal Footer: Powered by FLOCARD NFC */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            marginTop: '32px',
            width: '100%'
          }}
        >
          <div style={{ flex: 1, height: '1px', background: '#30223F' }} />
          <span
            style={{
              fontSize: '0.72rem',
              color: '#82758F',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              fontWeight: 500
            }}
          >
            Powered by FLOCARD NFC
          </span>
          <div style={{ flex: 1, height: '1px', background: '#30223F' }} />
        </div>
      </div>

      {/* QR Code Scan Modal */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              background: '#15101D',
              border: '1px solid #30223F',
              borderRadius: '24px',
              padding: '28px 24px',
              maxWidth: '340px',
              width: '100%',
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#82758F',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3
              style={{
                fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                fontSize: '1.2rem',
                color: '#FFFFFF',
                marginBottom: '6px'
              }}
            >
              Scan to Connect
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#82758F', marginBottom: '18px' }}>
              Point camera at this QR code to open {profile.name}&apos;s profile.
            </p>

            <div
              style={{
                padding: '12px',
                background: '#08060D',
                borderRadius: '16px',
                display: 'inline-block',
                border: '1px solid #30223F'
              }}
            >
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Profile QR Code"
                  style={{ width: '200px', height: '200px', display: 'block', borderRadius: '8px' }}
                />
              )}
            </div>

            <div style={{ marginTop: '14px', fontSize: '0.78rem', color: '#A855F7', fontWeight: 600 }}>
              flocard.in/p/{profile.slug}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Work Image Showcase Lightbox Modal */}
      {selectedWorkImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 3, 10, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedWorkImage(null)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #181126 0%, #0F0A19 100%)',
              border: '1px solid #432E5E',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '560px',
              width: '100%',
              position: 'relative',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 40px rgba(107, 0, 255, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedWorkImage(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid #30223F',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B8AEC8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Close"
            >
              <X size={18} />
            </button>

            {/* Work Image Display */}
            <div
              style={{
                width: '100%',
                maxHeight: '340px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#08060D',
                border: '1px solid #30223F',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={selectedWorkImage.image}
                alt={selectedWorkImage.title}
                style={{
                  width: '100%',
                  maxHeight: '340px',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>

            {/* Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#C084FC',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: 'rgba(107, 0, 255, 0.2)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}
              >
                {selectedWorkImage.category || 'WORK SHOWCASE'}
              </span>
            </div>

            <h3
              style={{
                fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '8px'
              }}
            >
              {selectedWorkImage.title}
            </h3>

            {selectedWorkImage.desc && (
              <p
                style={{
                  fontSize: '0.84rem',
                  color: '#B8AEC8',
                  lineHeight: 1.5,
                  marginBottom: '18px'
                }}
              >
                {selectedWorkImage.desc}
              </p>
            )}

            {selectedWorkImage.link && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <a
                  href={selectedWorkImage.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    background: '#6B00FF',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(107, 0, 255, 0.4)'
                  }}
                >
                  <span>Visit Project Link</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
