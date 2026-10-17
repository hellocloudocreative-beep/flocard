/* ==========================================================================
   FLOCARD INTERACTIVE CARD CANVAS & ARTWORK RENDERER
   Renders standard ISO/IEC 7810 ID-1 proportions (85.6 x 54 mm, ratio 1.585)
   Supports Theme 1 (Pages 1–3) & Theme 2 (Pages 4–6), Custom Backgrounds,
   Logo Scaling, Full Color Customization, and Industrial 300 DPI Exports.
   ========================================================================== */

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { EDITIONS, TEMPLATES } from '../lib/constants';

export default function CardCanvas({
  side = 'front', // 'front' | 'back'
  templateType = 'standard', // 'standard' (Pages 1-3) | 'customer_logo' (Pages 4-6)
  edition = 'purple',
  config = {},
  showGuides = false,
  showBleed = false,
  canvasRef = null, // for direct PNG/PDF export
  width = 540,
  scale = 1,
  className = '',
  onLogoWarningChange = null
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const editionInfo = EDITIONS[edition] || EDITIONS.purple;
  const defaults = editionInfo.defaults || {};
  const height = Math.round(width / 1.585);

  // Resolved custom colors with edition fallbacks
  const customColors = config.customColors || {};
  const colors = {
    primaryAccent: customColors.primaryAccent || defaults.primaryAccent || editionInfo.accentColor,
    secondaryAccent: customColors.secondaryAccent || defaults.secondaryAccent || editionInfo.secondaryColor,
    nameColor: customColors.nameColor || defaults.nameColor || '#FFFFFF',
    roleColor: customColors.roleColor || defaults.roleColor || '#D8B4FE',
    detailsColor: customColors.detailsColor || defaults.detailsColor || customColors.roleColor || defaults.roleColor || '#D8B4FE',
    taglineColor: customColors.taglineColor || defaults.taglineColor || '#B9AEC9',
    nfcColor: customColors.nfcColor || defaults.nfcColor || '#FFFFFF',
    qrColor: customColors.qrColor || defaults.qrColor || '#FFFFFF'
  };

  // Customer logo configuration & scaling
  const customerLogo = {
    url: config.customerLogo?.url || config.front?.customLogo || null,
    size: config.customerLogo?.size ?? 100, // percentage 50 - 200
    posX: config.customerLogo?.posX ?? 0, // offset in px
    posY: config.customerLogo?.posY ?? 0,
    showCircleBadge: config.customerLogo?.showCircleBadge ?? true
  };

  // FLOCARD logo configuration & scaling
  const flocardLogo = {
    size: config.flocardLogo?.size ?? 100, // percentage 60 - 150
    position: config.flocardLogo?.position || (templateType === 'customer_logo' ? 'bottom-right' : 'top-left')
  };

  const front = {
    name: 'AKHIL ANVAR',
    role: 'CEO & FOUNDER',
    details: '',
    tagline: 'One Tap Every Connection',
    showTagline: true,
    showNfc: true,
    showSubtext: false,
    subtext: 'TAP TO CONNECT',
    fontSize: 'medium',
    alignment: 'left',
    fontFamily: 'Space Grotesk',
    roleFontFamily: 'Inter',
    detailsFontFamily: 'Inter',
    taglineFontFamily: 'Inter',
    ...(config.front || config)
  };

  const back = {
    qrUrl: 'https://flocard.in/p/akhil',
    subtext: 'SCAN ME',
    showNfcSpecs: true,
    specsText: 'NFC | PORTFOLIO | CONTACT | CONNECT',
    brandUrl: 'flocard.in/akhil',
    ...(config.back || {})
  };

  // Check if customer logo exceeds safe printable area
  const baseBadgeDiameter = 120;
  const scaledDiameter = (baseBadgeDiameter * (customerLogo.size / 100));
  const isLogoExceedingSafeArea = (
    templateType === 'customer_logo' &&
    side === 'front' &&
    (scaledDiameter > 175 || Math.abs(customerLogo.posX) > 60 || Math.abs(customerLogo.posY) > 40)
  );

  useEffect(() => {
    if (onLogoWarningChange) {
      onLogoWarningChange(isLogoExceedingSafeArea);
    }
  }, [isLogoExceedingSafeArea, onLogoWarningChange]);

  // Generate QR code data URL whenever QR parameters change
  useEffect(() => {
    const targetUrl = back.qrUrl || 'https://flocard.in';
    const qrColor = colors.qrColor || '#FFFFFF';

    QRCode.toDataURL(targetUrl, {
      width: 256,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: qrColor,
        light: '#00000000'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR Gen error:', err));
  }, [back.qrUrl, colors.qrColor]);

  // Canvas drawing for 300 DPI exports (1080x681)
  const localExportCanvasRef = useRef(null);
  const activeCanvasRef = canvasRef || localExportCanvasRef;

  useEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const exportW = 1080;
    const exportH = Math.round(1080 / 1.585);
    canvas.width = exportW;
    canvas.height = exportH;

    ctx.clearRect(0, 0, exportW, exportH);

    // Rounded Card Boundary Clipping (3.18mm standard radius scaled)
    const cornerRadius = 38;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, exportW, exportH, cornerRadius);
    ctx.clip();

    // 1. Draw base fallback gradient
    const grad = ctx.createLinearGradient(0, 0, exportW, exportH);
    if (edition === 'purple') {
      grad.addColorStop(0, '#090510');
      grad.addColorStop(0.5, '#1e0836');
      grad.addColorStop(1, '#090510');
    } else if (edition === 'gold') {
      grad.addColorStop(0, '#100e0a');
      grad.addColorStop(0.5, '#282010');
      grad.addColorStop(1, '#0c0a07');
    } else {
      grad.addColorStop(0, '#0a0d13');
      grad.addColorStop(0.5, '#1a202c');
      grad.addColorStop(1, '#0a0d13');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, exportW, exportH);

    // 2. Draw authentic texture background if available
    const bgImg = new Image();
    bgImg.src = editionInfo.bgImage;
    bgImg.onload = () => {
      ctx.drawImage(bgImg, 0, 0, exportW, exportH);
      renderCanvasElements(ctx, exportW, exportH);
    };
    bgImg.onerror = () => {
      renderCanvasElements(ctx, exportW, exportH);
    };

    function renderCanvasElements(ctx, w, h) {
      // Edge stroke
      ctx.strokeStyle = edition === 'gold' ? 'rgba(212, 175, 55, 0.4)' : edition === 'platinum' ? 'rgba(226, 232, 240, 0.3)' : 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();

      if (templateType === 'standard') {
        // ====================================================================
        // THEME 1 (Pages 1–3 of PDF: Standard FLOCARD Design)
        // ====================================================================
        if (side === 'front') {
          // NFC Icon vertically centered on the right
          if (front.showNfc) {
            drawNfcSymbol(ctx, Math.round(w * 0.825), Math.round(h * 0.428), colors.nfcColor, Math.round(w * 0.076));
          }

          // Optional Customer Logo on top-left of Template 1 front
          if (customerLogo.url) {
            const cImg = new Image();
            cImg.src = customerLogo.url;
            const drawT1Logo = () => {
              const lW = Math.round(w * 0.28);
              const lH = Math.round(h * 0.16);
              ctx.drawImage(cImg, Math.round(w * 0.08), Math.round(h * 0.12), lW, lH);
            };
            if (cImg.complete && cImg.naturalWidth > 0) {
              drawT1Logo();
            } else {
              cImg.onload = drawT1Logo;
            }
          }

          // Name, Role, Details, Tagline on bottom-left
          ctx.fillStyle = colors.nameColor;
          ctx.font = `bold 44px "${front.fontFamily || 'Space Grotesk'}", sans-serif`;
          ctx.fillText((front.name || 'YOUR NAME').toUpperCase(), Math.round(w * 0.08), front.details ? (h - 156) : (h - 142));

          ctx.fillStyle = colors.roleColor;
          ctx.font = `500 24px "${front.roleFontFamily || 'Inter'}", sans-serif`;
          ctx.letterSpacing = '8px';
          ctx.fillText((front.role || 'R O L E').toUpperCase(), Math.round(w * 0.08), front.details ? (h - 110) : (h - 92));
          ctx.letterSpacing = '0px';

          if (front.details) {
            ctx.fillStyle = colors.detailsColor || colors.roleColor;
            ctx.font = `400 18px "${front.detailsFontFamily || front.roleFontFamily || 'Inter'}", sans-serif`;
            ctx.letterSpacing = '2px';
            ctx.fillText(front.details.toUpperCase(), Math.round(w * 0.08), h - 74);
            ctx.letterSpacing = '0px';
          }

          if (front.showTagline) {
            ctx.fillStyle = colors.taglineColor;
            ctx.font = `19px "${front.taglineFontFamily || front.roleFontFamily || 'Inter'}", sans-serif`;
            ctx.fillText(front.tagline || 'One Tap Every Connection', Math.round(w * 0.08), h - 42);
          }
        } else {
          // Back: FLOCARD logo top-left
          drawFlocardLogo(ctx, Math.round(w * 0.095), Math.round(h * 0.17), Math.round(w * 0.275), flocardLogo.size);

          // QR Code on right (aligned with logo top)
          if (qrDataUrl) {
            const qrImg = new Image();
            qrImg.src = qrDataUrl;
            qrImg.onload = () => {
              const qrSize = Math.round(w * 0.285);
              const qrX = Math.round(w * 0.635);
              const qrY = Math.round(h * 0.17);
              ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            };
          }
        }
      } else {
        // ====================================================================
        // THEME 2 (Pages 4–6 of PDF: Customer Logo + FLOCARD Logo)
        // ====================================================================
        if (side === 'front') {
          // NFC Waves vertically centered on the right
          if (front.showNfc) {
            drawNfcSymbol(ctx, Math.round(w * 0.825), Math.round(h * 0.428), colors.nfcColor, Math.round(w * 0.076));
          }

          // Tagline bottom-left
          if (front.showTagline) {
            ctx.fillStyle = colors.taglineColor;
            ctx.font = `19px "${front.taglineFontFamily || front.roleFontFamily || 'Inter'}", sans-serif`;
            ctx.fillText(front.tagline || 'One Tap Every Connection', Math.round(w * 0.08), h - 48);
          }

          // Customer Logo in Center
          const centerX = (w * 0.49) + (customerLogo.posX * 2);
          const centerY = (h * 0.50) + (customerLogo.posY * 2);
          const radius = Math.round(w * 0.178 * (customerLogo.size / 100));

          if (customerLogo.showCircleBadge) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
          }

          if (customerLogo.url) {
            const cImg = new Image();
            cImg.src = customerLogo.url;
            const drawT2Logo = () => {
              const imgW = radius * 1.5;
              const imgH = radius * 1.5;
              ctx.drawImage(cImg, centerX - (imgW / 2), centerY - (imgH / 2), imgW, imgH);
            };
            if (cImg.complete && cImg.naturalWidth > 0) {
              drawT2Logo();
            } else {
              cImg.onload = drawT2Logo;
            }
          } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 26px "Space Grotesk", sans-serif';
            ctx.textAlign = 'center';
            ctx.letterSpacing = '3px';
            ctx.fillText('YOUR LOGO', centerX, centerY + 8);
            ctx.textAlign = 'left';
            ctx.letterSpacing = '0px';
          }
        } else {
          // Theme 2 Back:
          // QR Code top right
          if (qrDataUrl) {
            const qrImg = new Image();
            qrImg.src = qrDataUrl;
            qrImg.onload = () => {
              const qrSize = Math.round(w * 0.285);
              const qrX = Math.round(w * 0.635);
              const qrY = Math.round(h * 0.17);
              ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            };
          }

          // Name, Role, Details bottom-left
          ctx.fillStyle = colors.nameColor;
          ctx.font = `bold 44px "${front.fontFamily || 'Space Grotesk'}", sans-serif`;
          ctx.fillText((front.name || 'YOUR NAME').toUpperCase(), Math.round(w * 0.08), front.details ? (h - 124) : (h - 110));

          ctx.fillStyle = colors.roleColor;
          ctx.font = `500 24px "${front.roleFontFamily || 'Inter'}", sans-serif`;
          ctx.letterSpacing = '8px';
          ctx.fillText((front.role || 'R O L E').toUpperCase(), Math.round(w * 0.08), front.details ? (h - 80) : (h - 65));
          ctx.letterSpacing = '0px';

          if (front.details) {
            ctx.fillStyle = colors.detailsColor || colors.roleColor;
            ctx.font = `400 18px "${front.detailsFontFamily || front.roleFontFamily || 'Inter'}", sans-serif`;
            ctx.letterSpacing = '2px';
            ctx.fillText(front.details.toUpperCase(), Math.round(w * 0.08), h - 46);
            ctx.letterSpacing = '0px';
          }

          // FLOCARD Logo bottom-right (aligned under QR code)
          drawFlocardLogo(ctx, Math.round(w * 0.635), Math.round(h * 0.78), Math.round(w * 0.285), flocardLogo.size);
        }
      }

      ctx.restore();
    }
  }, [side, templateType, edition, front, back, colors, customerLogo, flocardLogo, qrDataUrl]);

  return (
    <div
      className={`card-canvas-container ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Visual Live Card Render with Texture & CSS Layers */}
      <div
        className={`card-surface-artwork card-theme-${edition}`}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          backgroundImage: `url(${editionInfo.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: editionInfo.cardBg,
          border: editionInfo.border,
          boxShadow: `0 12px 40px -10px ${editionInfo.glow}`,
          padding: 0,
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Subtle Ambient Light Flare Layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: edition === 'purple'
              ? 'radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.18), transparent 50%)'
              : edition === 'gold'
              ? 'radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.2), transparent 50%)'
              : 'radial-gradient(circle at 80% 20%, rgba(226, 232, 240, 0.18), transparent 50%)',
            pointerEvents: 'none'
          }}
        />

        {/* ==================================================================
            TEMPLATE 1: STANDARD FLOCARD DESIGN (Pages 1–3 of PDF)
            ================================================================== */}
        {templateType === 'standard' && (
          <>
            {side === 'front' && (
              <>
                {/* Front: NFC Icon vertically centered on the right */}
                {front.showNfc && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '10%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: `${Math.max(22, Math.round(width * 0.075))}px`,
                      height: `${Math.max(30, Math.round(width * 0.075 * (106 / 76)))}px`,
                      color: colors.nfcColor,
                      zIndex: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg
                      viewBox="0 0 76 106"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ width: '100%', height: '100%', display: 'block' }}
                    >
                      <path d="M 4.67 36.07 A 27.50 27.50 0 0 1 4.67 69.93" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" />
                      <path d="M 21.02 25.37 A 47.00 47.00 0 0 1 21.02 80.63" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" />
                      <path d="M 37.47 14.86 A 66.50 66.50 0 0 1 37.47 91.14" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" />
                      <path d="M 54.30 4.91 A 86.00 86.00 0 0 1 54.30 101.09" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {/* Front: Optional Customer Logo in Standard Template */}
                {customerLogo.url && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '8%',
                      top: '12%',
                      maxWidth: `${Math.round(width * 0.30)}px`,
                      maxHeight: `${Math.round(width * 0.16)}px`,
                      zIndex: 3,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <img
                      src={customerLogo.url}
                      alt="Customer Logo"
                      style={{
                        maxWidth: '100%',
                        maxHeight: `${Math.round(width * 0.14)}px`,
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                )}

                {/* Front: Name, Role, Tagline on Lower-Left */}
                <div
                  style={{
                    position: 'absolute',
                    left: '8%',
                    bottom: '8.5%',
                    zIndex: 3,
                    textAlign: 'left'
                  }}
                >
                  <div
                    style={{
                      fontFamily: front.fontFamily ? `"${front.fontFamily}", sans-serif` : 'var(--font-display)',
                      fontSize: front.fontSize === 'large' ? '1.45rem' : front.fontSize === 'small' ? '1.1rem' : '1.26rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: colors.nameColor,
                      lineHeight: 1.15
                    }}
                  >
                    {front.name || 'YOUR NAME'}
                  </div>

                  <div
                    style={{
                      fontFamily: front.roleFontFamily ? `"${front.roleFontFamily}", sans-serif` : 'var(--font-sans)',
                      fontSize: '0.74rem',
                      letterSpacing: '0.36em',
                      fontWeight: 500,
                      color: colors.roleColor,
                      marginTop: '6px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {front.role || 'R O L E'}
                  </div>

                  {front.details && (
                    <div
                      style={{
                        fontFamily: front.detailsFontFamily ? `"${front.detailsFontFamily}", sans-serif` : (front.roleFontFamily ? `"${front.roleFontFamily}", sans-serif` : 'var(--font-sans)'),
                        fontSize: '0.64rem',
                        letterSpacing: '0.12em',
                        fontWeight: 400,
                        color: colors.detailsColor || colors.roleColor,
                        marginTop: '4px',
                        textTransform: 'uppercase',
                        opacity: 0.95
                      }}
                    >
                      {front.details}
                    </div>
                  )}

                  {front.showTagline && (
                    <div
                      style={{
                        fontFamily: (front.taglineFontFamily || front.roleFontFamily) ? `"${front.taglineFontFamily || front.roleFontFamily}", sans-serif` : 'var(--font-sans)',
                        fontSize: '0.62rem',
                        color: colors.taglineColor,
                        marginTop: '12px',
                        letterSpacing: '0.02em',
                        fontWeight: 400
                      }}
                    >
                      {front.tagline || 'One Tap Every Connection'}
                    </div>
                  )}
                </div>
              </>
            )}

            {side === 'back' && (
              <>
                {/* Back Left: Official FLOCARD logo */}
                <div
                  style={{
                    position: 'absolute',
                    left: '8.5%',
                    top: '17%',
                    width: `${Math.round(width * 0.275 * (flocardLogo.size / 100))}px`,
                    zIndex: 3
                  }}
                >
                  <img
                    src="/assets/logo-light.png"
                    alt="FLOCARD"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      fontSize: '1.4rem',
                      color: '#ffffff',
                      display: 'none'
                    }}
                  >
                    <span style={{ color: colors.primaryAccent }}>FLO</span>CARD
                  </span>
                </div>

                {/* Back Right: Scannable QR Code */}
                <div
                  style={{
                    position: 'absolute',
                    right: '8%',
                    top: '16%',
                    width: `${Math.round(width * 0.285)}px`,
                    height: `${Math.round(width * 0.285)}px`,
                    zIndex: 3
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      padding: '4px',
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: `1px solid ${editionInfo.border}`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        style={{ width: '100%', height: '100%', display: 'block', borderRadius: '6px' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }} />
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ==================================================================
            TEMPLATE 2: CUSTOMER LOGO + FLOCARD LOGO (Pages 4–6 of PDF)
            ================================================================== */}
        {templateType === 'customer_logo' && (
          <>
            {side === 'front' && (
              <>
                {/* Front: NFC Icon vertically centered on the right */}
                {front.showNfc && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '10%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: `${Math.max(22, Math.round(width * 0.075))}px`,
                      height: `${Math.max(30, Math.round(width * 0.075 * (106 / 76)))}px`,
                      color: colors.nfcColor,
                      zIndex: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg
                      viewBox="0 0 76 106"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ width: '100%', height: '100%', display: 'block' }}
                    >
                      <path d="M 4.67 36.07 A 27.50 27.50 0 0 1 4.67 69.93" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" />
                      <path d="M 21.02 25.37 A 47.00 47.00 0 0 1 21.02 80.63" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" />
                      <path d="M 37.47 14.86 A 66.50 66.50 0 0 1 37.47 91.14" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" />
                      <path d="M 54.30 4.91 A 86.00 86.00 0 0 1 54.30 101.09" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {/* Center: Prominent Customer Logo Badge with Resizing & Drag */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '49%',
                    transform: `translate(calc(-50% + ${customerLogo.posX}px), calc(-50% + ${customerLogo.posY}px))`,
                    width: `${Math.round(width * 0.355 * (customerLogo.size / 100))}px`,
                    height: `${Math.round(width * 0.355 * (customerLogo.size / 100))}px`,
                    borderRadius: '50%',
                    border: customerLogo.showCircleBadge ? '1.5px solid rgba(255, 255, 255, 0.45)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: customerLogo.showCircleBadge ? 'rgba(0, 0, 0, 0.45)' : 'transparent',
                    zIndex: 3,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {customerLogo.url ? (
                    <img
                      src={customerLogo.url}
                      alt="Customer Logo"
                      style={{
                        width: '82%',
                        height: '82%',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: `${Math.max(0.7, 0.82 * (customerLogo.size / 100))}rem`,
                        letterSpacing: '0.14em',
                        color: '#FFFFFF',
                        fontWeight: 700
                      }}
                    >
                      YOUR LOGO
                    </span>
                  )}
                </div>

                {/* Front Bottom-Left: Tagline */}
                {front.showTagline && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '8%',
                      bottom: '8.5%',
                      zIndex: 3,
                      fontFamily: (front.taglineFontFamily || front.roleFontFamily) ? `"${front.taglineFontFamily || front.roleFontFamily}", sans-serif` : 'var(--font-sans)',
                      fontSize: '0.62rem',
                      color: colors.taglineColor,
                      letterSpacing: '0.02em',
                      fontWeight: 400
                    }}
                  >
                    {front.tagline || 'One Tap Every Connection'}
                  </div>
                )}
              </>
            )}

            {side === 'back' && (
              <>
                {/* Back Top-Right: QR Code */}
                <div
                  style={{
                    position: 'absolute',
                    right: '8%',
                    top: '16%',
                    width: `${Math.round(width * 0.285)}px`,
                    height: `${Math.round(width * 0.285)}px`,
                    zIndex: 3
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      padding: '4px',
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: `1px solid ${editionInfo.border}`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        style={{ width: '100%', height: '100%', display: 'block', borderRadius: '6px' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }} />
                    )}
                  </div>
                </div>

                {/* Back Bottom-Left: Name & Role */}
                <div
                  style={{
                    position: 'absolute',
                    left: '8%',
                    bottom: '12%',
                    zIndex: 3,
                    textAlign: 'left'
                  }}
                >
                  <div
                    style={{
                      fontFamily: front.fontFamily ? `"${front.fontFamily}", sans-serif` : 'var(--font-display)',
                      fontSize: front.fontSize === 'large' ? '1.45rem' : front.fontSize === 'small' ? '1.1rem' : '1.26rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: colors.nameColor,
                      lineHeight: 1.15
                    }}
                  >
                    {front.name || 'YOUR NAME'}
                  </div>

                  <div
                    style={{
                      fontFamily: front.roleFontFamily ? `"${front.roleFontFamily}", sans-serif` : 'var(--font-sans)',
                      fontSize: '0.74rem',
                      letterSpacing: '0.36em',
                      fontWeight: 500,
                      color: colors.roleColor,
                      marginTop: '6px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {front.role || 'R O L E'}
                  </div>

                  {front.details && (
                    <div
                      style={{
                        fontFamily: front.detailsFontFamily ? `"${front.detailsFontFamily}", sans-serif` : (front.roleFontFamily ? `"${front.roleFontFamily}", sans-serif` : 'var(--font-sans)'),
                        fontSize: '0.64rem',
                        letterSpacing: '0.12em',
                        fontWeight: 400,
                        color: colors.detailsColor || colors.roleColor,
                        marginTop: '4px',
                        textTransform: 'uppercase',
                        opacity: 0.95
                      }}
                    >
                      {front.details}
                    </div>
                  )}
                </div>

                {/* Back Bottom-Right: Official FLOCARD Logo (aligned under QR code) */}
                <div
                  style={{
                    position: 'absolute',
                    right: '8%',
                    bottom: '12%',
                    width: `${Math.round(width * 0.285 * (flocardLogo.size / 100))}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    zIndex: 3
                  }}
                >
                  <img
                    src="/assets/logo-light.png"
                    alt="FLOCARD"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      fontSize: '1.25rem',
                      color: '#ffffff',
                      display: 'none'
                    }}
                  >
                    <span style={{ color: colors.primaryAccent }}>FLO</span>CARD
                  </span>
                </div>
              </>
            )}
          </>
        )}

        {/* Guides Overlay (Dotted safe area margins: 3mm) */}
        {showGuides && (
          <div
            style={{
              position: 'absolute',
              inset: '16px',
              border: isLogoExceedingSafeArea ? '1.5px dashed #ef4444' : '1px dashed rgba(255, 255, 255, 0.4)',
              borderRadius: '8px',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '6px',
                fontSize: '0.55rem',
                color: isLogoExceedingSafeArea ? '#ef4444' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: isLogoExceedingSafeArea ? 700 : 500,
                letterSpacing: '0.08em'
              }}
            >
              {isLogoExceedingSafeArea ? '⚠️ SAFE AREA EXCEEDED (3mm)' : 'SAFE AREA (3mm)'}
            </span>
          </div>
        )}

        {/* Bleed Margin Overlay */}
        {showBleed && (
          <div
            style={{
              position: 'absolute',
              inset: '4px',
              border: '1px solid rgba(239, 68, 68, 0.6)',
              borderRadius: '12px',
              pointerEvents: 'none',
              zIndex: 11
            }}
          >
            <span
              style={{
                position: 'absolute',
                bottom: '4px',
                left: '6px',
                fontSize: '0.55rem',
                color: 'rgba(239, 68, 68, 0.8)',
                letterSpacing: '0.08em'
              }}
            >
              TRIM LINE
            </span>
          </div>
        )}
      </div>

      {/* Hidden high-res canvas used for clean 300 DPI exports */}
      <canvas ref={activeCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}

function drawNfcSymbol(ctx, x, y, color, targetW = 76) {
  const scale = targetW / 76;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color || '#FFFFFF';
  ctx.lineWidth = 8.5;
  ctx.lineCap = 'round';

  const cx = -17.0;
  const cy = 53.0;

  const arcs = [
    { r: 27.5, deg: 38.0 },
    { r: 47.0, deg: 36.0 },
    { r: 66.5, deg: 35.0 },
    { r: 86.0, deg: 34.0 }
  ];

  for (const { r, deg } of arcs) {
    const rad = (deg * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -rad, rad, false);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFlocardLogo(ctx, x, y, targetWidth = 297, scale = 100) {
  ctx.save();
  ctx.translate(x, y);
  const s = scale / 100;
  ctx.scale(s, s);

  const logoImg = new Image();
  logoImg.src = '/assets/logo-light.png';
  const drawLogo = (img) => {
    const aspect = img.naturalWidth / img.naturalHeight;
    const targetH = targetWidth / aspect;
    ctx.drawImage(img, 0, 0, targetWidth, targetH);
  };

  if (logoImg.complete && logoImg.naturalWidth > 0) {
    drawLogo(logoImg);
  } else {
    logoImg.onload = () => drawLogo(logoImg);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.fillText('FLOCARD', 0, 32);
  }

  ctx.restore();
}
