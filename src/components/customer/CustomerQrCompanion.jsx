/* ==========================================================================
   FLOCARDS CUSTOMER SMART QR COMPANION
   Customer dashboard component for downloading print-ready PNG, vector SVG,
   sharing permanent canonical profile URLs, and placement previewing.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Download,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Sliders,
  Maximize2
} from 'lucide-react';
import {
  generateQrDataUrl,
  downloadQrPng,
  downloadQrSvg,
  getCanonicalProfileUrl
} from '../../lib/qr';
import QrPlacementStudio from '../qr/QrPlacementStudio';

export default function CustomerQrCompanion({ profiles = [], onSelectProfile }) {
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Fallback demo profile if customer has none yet
  const activeProfile = profiles[selectedProfileIndex] || {
    name: 'My Digital Profile',
    role: 'Executive',
    company: 'FLOCARDS Member',
    slug: 'me',
    status: 'published'
  };

  const isPublished = (activeProfile.status || 'published').toLowerCase() === 'published';
  const targetUrl = getCanonicalProfileUrl(activeProfile.slug);

  const loadQr = () => {
    setIsRegenerating(true);
    generateQrDataUrl(targetUrl, {
      width: 480,
      margin: 3,
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        setQrDataUrl(url);
        setIsRegenerating(false);
      })
      .catch((err) => {
        console.error('Failed to load QR code:', err);
        setIsRegenerating(false);
      });
  };

  useEffect(() => {
    loadQr();
  }, [targetUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${activeProfile.name} — FLOCARD Digital Profile`,
        text: `Scan or tap to connect with ${activeProfile.name}:`,
        url: targetUrl
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(27, 16, 44, 0.95) 0%, rgba(13, 8, 22, 0.98) 100%)',
          border: '1px solid #6B00FF35',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #6B00FF 0%, #A855F7 100%)',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                <Sparkles size={13} />
                Smart QR Companion
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Digital Profile QR & Print Assets
              </h2>
            </div>
            <p style={{ color: '#A59BB6', fontSize: '0.86rem', marginTop: '6px', marginBottom: 0 }}>
              Permanent smart QR code synchronized with your NFC business card.
              Works universally on all iOS and Android smartphone cameras without apps.
            </p>
          </div>

          {/* Toggle Placement Studio */}
          <button
            type="button"
            onClick={() => setShowStudio(!showStudio)}
            style={{
              background: showStudio ? 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)' : '#221438',
              border: '1px solid #4D2D7D',
              color: '#FFFFFF',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sliders size={15} />
            <span>{showStudio ? 'Back to Simple View' : 'Card & Poster Preview Studio'}</span>
          </button>
        </div>

        {/* Profile Switcher (If multiple profiles exist) */}
        {profiles.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
            {profiles.map((p, idx) => (
              <button
                key={p.id || idx}
                type="button"
                onClick={() => setSelectedProfileIndex(idx)}
                style={{
                  background: selectedProfileIndex === idx ? '#6B00FF' : '#19102B',
                  border: selectedProfileIndex === idx ? '1px solid #A855F7' : '1px solid #362254',
                  color: '#FFFFFF',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {p.name} (@{p.slug})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main View: Simple QR Card or Studio */}
      {showStudio ? (
        <QrPlacementStudio profile={activeProfile} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Left Column: QR Code Display Card */}
          <div
            style={{
              background: '#130B22',
              border: '1px solid #2B1B44',
              borderRadius: '18px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Status Pill */}
            <div style={{ marginBottom: '16px' }}>
              {isPublished ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: '#10B98120',
                    color: '#34D399',
                    border: '1px solid #10B98140'
                  }}
                >
                  <CheckCircle2 size={13} />
                  Live Published Profile
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: '#F59E0B20',
                    color: '#FBBF24',
                    border: '1px solid #F59E0B40'
                  }}
                >
                  <AlertCircle size={13} />
                  Unpublished Profile (Draft)
                </span>
              )}
            </div>

            {/* Print-Ready Scannable White Canvas */}
            <div
              style={{
                background: '#FFFFFF',
                padding: '20px',
                borderRadius: '20px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                marginBottom: '20px'
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`${activeProfile.name} QR Code`}
                  style={{ width: '220px', height: '220px', display: 'block' }}
                />
              ) : (
                <div style={{ width: '220px', height: '220px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Loading QR...
                </div>
              )}
            </div>

            {/* Profile Title & Permanent URL */}
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF' }}>
              {activeProfile.name}
            </h3>
            <p style={{ margin: '4px 0 16px', fontSize: '0.84rem', color: '#9387A6' }}>
              {activeProfile.role} • {activeProfile.company}
            </p>

            {/* Permanent Link Capsule */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0B0515',
                border: '1px solid #362254',
                padding: '8px 14px',
                borderRadius: '10px',
                marginBottom: '20px',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}
            >
              <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#C084FC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {targetUrl}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy URL"
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#10B981' : '#A855F7',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {/* Share & Regenerate */}
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                type="button"
                onClick={handleShare}
                style={{
                  flex: 1,
                  background: '#24143D',
                  border: '1px solid #48297A',
                  color: '#C4B5FD',
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Share2 size={15} />
                <span>Share Profile</span>
              </button>

              <button
                type="button"
                onClick={loadQr}
                title="Regenerate QR"
                style={{
                  background: '#1F1530',
                  border: '1px solid #3E2963',
                  color: '#C4B9D8',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <RotateCw size={15} className={isRegenerating ? 'spin-animation' : ''} />
              </button>
            </div>
          </div>

          {/* Right Column: Print & Asset Download Options */}
          <div
            style={{
              background: '#130B22',
              border: '1px solid #2B1B44',
              borderRadius: '18px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                Download Print & Media Assets
              </h3>
              <p style={{ margin: '6px 0 20px', fontSize: '0.84rem', color: '#9387A6', lineHeight: 1.5 }}>
                Directly export your official QR code for physical manufacturing, brochures, office signage, or social media graphics.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* PNG Card */}
                <div
                  style={{
                    background: '#1A0F2E',
                    border: '1px solid #3A235E',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.92rem' }}>
                      Everyday High-Res PNG (2048 × 2048)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#9387A6', marginTop: '2px' }}>
                      Ready for email signatures, presentations, social banners, and digital graphics.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadQrPng(targetUrl, `flocard-qr-${activeProfile.slug}.png`, 2048)}
                    style={{
                      background: '#2D194C',
                      border: '1px solid #552F8F',
                      color: '#E9D5FF',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Download size={14} />
                    <span>Download PNG</span>
                  </button>
                </div>

                {/* SVG Card */}
                <div
                  style={{
                    background: '#1A0F2E',
                    border: '1px solid #3A235E',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.92rem' }}>
                      Scalable Vector SVG (Lossless)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#9387A6', marginTop: '2px' }}>
                      For professional CMYK print shops, laser engraving machines, and vector posters.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadQrSvg(targetUrl, `flocard-qr-${activeProfile.slug}.svg`)}
                    style={{
                      background: 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Download size={14} />
                    <span>Download SVG</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Information Callout */}
            <div
              style={{
                marginTop: '24px',
                background: '#0B0515',
                border: '1px solid #2B1B44',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <QrCode size={18} color="#A855F7" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '0.78rem', color: '#9387A6', lineHeight: 1.5 }}>
                <strong style={{ color: '#EDE8F5' }}>Dynamic Routing Guarantee:</strong> If you ever update your profile username or bio details, your printed QR codes and NFC card continue routing to your latest verified digital identity without reprinting.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
