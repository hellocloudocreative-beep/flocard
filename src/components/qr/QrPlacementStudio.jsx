/* ==========================================================================
   FLOCARDS SMART QR PLACEMENT STUDIO
   Interactive preview on NFC Business Card, Promotional Poster,
   Desk Display Stand, and Digital Lockscreen Graphic.
   Preserves scannability, quiet zone, and high-contrast pattern.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Download,
  ExternalLink,
  Layers,
  Sparkles,
  Maximize2,
  Sliders,
  CheckCircle,
  Smartphone,
  CreditCard,
  FileText,
  Monitor
} from 'lucide-react';
import {
  generateQrDataUrl,
  downloadQrPng,
  downloadQrSvg,
  getCanonicalProfileUrl
} from '../../lib/qr';

export default function QrPlacementStudio({
  profile = { name: 'Alex Morgan', role: 'Executive Design Lead', company: 'FLOCARDS Luxury', slug: 'alex' }
}) {
  const [format, setFormat] = useState('card'); // 'card' | 'poster' | 'desk' | 'digital'
  const [qrSize, setQrSize] = useState(120);
  const [placement, setPlacement] = useState('bottom-right'); // 'bottom-right' | 'bottom-left' | 'center' | 'top-right'
  const [theme, setTheme] = useState('signature-purple'); // 'signature-purple' | 'gold-edition' | 'stealth-noir' | 'clean-light'
  const [qrDataUrl, setQrDataUrl] = useState('');

  const targetUrl = getCanonicalProfileUrl(profile?.slug || 'alex');

  useEffect(() => {
    generateQrDataUrl(targetUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H'
    }).then(setQrDataUrl).catch(console.error);
  }, [targetUrl]);

  // Placement coordinates
  const getPlacementStyle = () => {
    switch (placement) {
      case 'bottom-left':
        return { bottom: '24px', left: '24px' };
      case 'top-right':
        return { top: '24px', right: '24px' };
      case 'center':
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'bottom-right':
      default:
        return { bottom: '24px', right: '24px' };
    }
  };

  // Background styling
  const getBackgroundStyle = () => {
    switch (theme) {
      case 'gold-edition':
        return {
          background: 'linear-gradient(135deg, #1C170E 0%, #2A2214 50%, #151109 100%)',
          border: '1.5px solid #E9C76655',
          textColor: '#E9C766',
          subColor: '#D4AF37'
        };
      case 'stealth-noir':
        return {
          background: 'linear-gradient(135deg, #121216 0%, #0A0A0D 100%)',
          border: '1.5px solid #2A2A35',
          textColor: '#FFFFFF',
          subColor: '#9CA3AF'
        };
      case 'clean-light':
        return {
          background: 'linear-gradient(135deg, #F8F7FC 0%, #EDE9F6 100%)',
          border: '1.5px solid #D8D1E8',
          textColor: '#1A1426',
          subColor: '#6B5E80'
        };
      case 'signature-purple':
      default:
        return {
          background: 'linear-gradient(135deg, #160B26 0%, #0B0415 100%)',
          border: '1.5px solid #6B00FF55',
          textColor: '#FFFFFF',
          subColor: '#C4B5FD'
        };
    }
  };

  const currentTheme = getBackgroundStyle();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Format & Style Controls */}
      <div
        style={{
          background: '#130B22',
          border: '1px solid #2E1B4A',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Mockup Format Selector */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'card', label: 'NFC Business Card', icon: CreditCard },
            { id: 'poster', label: 'Promo Poster (A4)', icon: FileText },
            { id: 'desk', label: 'Acrylic Desk Stand', icon: Monitor },
            { id: 'digital', label: 'Digital Lockscreen', icon: Smartphone }
          ].map((item) => {
            const Icon = item.icon;
            const active = format === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFormat(item.id)}
                style={{
                  background: active ? 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)' : '#1D1331',
                  border: active ? '1px solid #8B5CF6' : '1px solid #362254',
                  color: active ? '#FFFFFF' : '#B8AEC8',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Theme and Placement Selectors */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{
              background: '#0B0515',
              border: '1px solid #362254',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="signature-purple">Signature Purple</option>
            <option value="gold-edition">24K Gold Edition</option>
            <option value="stealth-noir">Stealth Gunmetal</option>
            <option value="clean-light">Clean Studio Light</option>
          </select>

          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            style={{
              background: '#0B0515',
              border: '1px solid #362254',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-right">Top Right</option>
            <option value="center">Center</option>
          </select>
        </div>
      </div>

      {/* Interactive Studio Preview Canvas */}
      <div
        style={{
          background: '#090412',
          border: '1px solid #24143D',
          borderRadius: '18px',
          padding: '40px 20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '440px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107, 0, 255, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Mockup Disclaimer Badge */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '20px',
            fontSize: '0.72rem',
            background: '#1D1331',
            border: '1px solid #3D2660',
            color: '#B8AEC8',
            padding: '4px 10px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={12} color="#A855F7" />
          <span>Interactive Placement Mockup (Illustrative Reference)</span>
        </div>

        {/* ===================== FORMAT 1: NFC CARD ===================== */}
        {format === 'card' && (
          <div
            style={{
              width: '460px',
              height: '270px',
              maxWidth: '95vw',
              borderRadius: '16px',
              background: currentTheme.background,
              border: currentTheme.border,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.1)',
              position: 'relative',
              padding: '24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Front info */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, letterSpacing: '0.12em', color: currentTheme.textColor }}>
                  FLOCARD<sup style={{ fontSize: '0.6em', color: currentTheme.subColor }}>®</sup>
                </span>
                <span style={{ fontSize: '0.7rem', color: currentTheme.subColor, fontWeight: 600 }}>
                  NFC SMART CARD
                </span>
              </div>
              <div style={{ marginTop: '30px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: currentTheme.textColor }}>
                  {profile?.name || 'Alex Morgan'}
                </div>
                <div style={{ fontSize: '0.82rem', color: currentTheme.subColor, marginTop: '2px' }}>
                  {profile?.role || 'Executive Design Lead'}
                </div>
                <div style={{ fontSize: '0.76rem', color: currentTheme.subColor, opacity: 0.8 }}>
                  {profile?.company || 'FLOCARDS Luxury'}
                </div>
              </div>
            </div>

            {/* Smart QR Overlay with Scannable Quiet Zone */}
            <div
              style={{
                position: 'absolute',
                ...getPlacementStyle(),
                background: '#FFFFFF',
                padding: '6px',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Companion QR"
                  style={{ width: `${qrSize}px`, height: `${qrSize}px`, display: 'block' }}
                />
              )}
            </div>

            <div style={{ fontSize: '0.68rem', color: currentTheme.subColor, opacity: 0.6 }}>
              Tap NFC or scan companion QR
            </div>
          </div>
        )}

        {/* ===================== FORMAT 2: PROMOTIONAL POSTER ===================== */}
        {format === 'poster' && (
          <div
            style={{
              width: '320px',
              height: '460px',
              maxWidth: '90vw',
              borderRadius: '16px',
              background: currentTheme.background,
              border: currentTheme.border,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
              position: 'relative',
              padding: '30px 24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', color: currentTheme.subColor }}>
              CONNECT INSTANTLY
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: currentTheme.textColor, marginTop: '6px' }}>
              {profile?.name || 'Alex Morgan'}
            </div>
            <div style={{ fontSize: '0.85rem', color: currentTheme.subColor }}>
              {profile?.role || 'Executive Design Lead'} • {profile?.company || 'FLOCARDS'}
            </div>

            {/* QR Box in Center/Configured */}
            <div
              style={{
                marginTop: '36px',
                background: '#FFFFFF',
                padding: '12px',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
              }}
            >
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Companion QR"
                  style={{ width: '140px', height: '140px', display: 'block' }}
                />
              )}
            </div>

            <div style={{ marginTop: 'auto', fontSize: '0.78rem', color: currentTheme.subColor, fontWeight: 600 }}>
              Scan QR to save verified contact card
            </div>
            <div style={{ fontSize: '0.72rem', color: currentTheme.textColor, opacity: 0.8, marginTop: '2px', fontFamily: 'monospace' }}>
              {targetUrl}
            </div>
          </div>
        )}

        {/* ===================== FORMAT 3: DESK DISPLAY STAND ===================== */}
        {format === 'desk' && (
          <div
            style={{
              width: '340px',
              height: '340px',
              maxWidth: '90vw',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, rgba(30, 20, 50, 0.9) 0%, rgba(12, 6, 22, 0.95) 100%)',
              border: '2px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
              position: 'relative',
              padding: '28px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#A855F7', letterSpacing: '0.1em' }}>
              RECEPTION & DESK STAND
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginTop: '4px' }}>
              {profile?.name}
            </div>

            <div
              style={{
                margin: '18px 0',
                background: '#FFFFFF',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
              }}
            >
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Companion QR"
                  style={{ width: '130px', height: '130px', display: 'block' }}
                />
              )}
            </div>

            <div style={{ fontSize: '0.76rem', color: '#C4B5FD', fontWeight: 600 }}>
              Instant Contactless Profile
            </div>
          </div>
        )}

        {/* ===================== FORMAT 4: DIGITAL LOCKSCREEN ===================== */}
        {format === 'digital' && (
          <div
            style={{
              width: '260px',
              height: '460px',
              borderRadius: '32px',
              background: '#0F091A',
              border: '3px solid #39245C',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
              position: 'relative',
              padding: '24px 18px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            {/* Notch */}
            <div style={{ width: '80px', height: '16px', background: '#000000', borderRadius: '10px', marginBottom: '20px' }} />

            <div style={{ fontSize: '0.7rem', color: '#9387A6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Digital Contact Card
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
              {profile?.name}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#A855F7' }}>
              {profile?.role}
            </div>

            <div
              style={{
                margin: '30px 0',
                background: '#FFFFFF',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
              }}
            >
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Companion QR"
                  style={{ width: '130px', height: '130px', display: 'block' }}
                />
              )}
            </div>

            <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: '#B8AEC8' }}>
              Save as Phone Lockscreen Wallpaper
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls & Download Actions */}
      <div
        style={{
          background: '#130B22',
          border: '1px solid #2E1B4A',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.84rem', color: '#C4B5FD', fontWeight: 600 }}>
            Permanent Destination:
          </div>
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#FFFFFF',
              background: '#0B0515',
              border: '1px solid #362254',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{targetUrl}</span>
            <ExternalLink size={13} color="#A855F7" />
          </a>
        </div>

        {/* Clean Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => downloadQrPng(targetUrl, `flocard-qr-${profile?.slug || 'alex'}.png`, 2048)}
            style={{
              background: '#24143D',
              border: '1px solid #48297A',
              color: '#C4B5FD',
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
            <Download size={14} />
            <span>Download PNG (2048px)</span>
          </button>

          <button
            type="button"
            onClick={() => downloadQrSvg(targetUrl, `flocard-qr-${profile?.slug || 'alex'}.svg`)}
            style={{
              background: 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)',
              border: 'none',
              color: '#FFFFFF',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            <span>Download Vector SVG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
