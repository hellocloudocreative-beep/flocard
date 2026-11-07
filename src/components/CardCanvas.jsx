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
  onLogoWarningChange = null,
  adminPrintMode = false
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const isAdminPrint = Boolean(adminPrintMode);
  const editionInfo = EDITIONS[edition] || EDITIONS.purple;
  const defaults = editionInfo.defaults || {};
  const height = Math.round(width / 1.585);

  // Resolved custom colors with edition fallbacks or admin print override
  const customColors = config.customColors || {};
  const colors = isAdminPrint ? {
    primaryAccent: '#000000',
    secondaryAccent: '#000000',
    nameColor: '#000000',
    roleColor: '#000000',
    detailsColor: '#000000',
    taglineColor: '#000000',
    nfcColor: '#000000',
    qrColor: '#000000'
  } : {
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
  const rawLogo = config.customerLogo;
  const customerLogo = {
    url: typeof rawLogo === 'string' ? rawLogo : (rawLogo?.url || config.front?.customLogo || null),
    originalUrl: (typeof rawLogo === 'object' && rawLogo?.originalUrl) || (typeof rawLogo === 'string' ? rawLogo : null),
    transparentUrl: (typeof rawLogo === 'object' && rawLogo?.transparentUrl) || (typeof rawLogo === 'string' ? rawLogo : null),
    size: (typeof rawLogo === 'object' && typeof rawLogo?.size === 'number') ? rawLogo.size : 100, // percentage 50 - 200
    rotation: (typeof rawLogo === 'object' && typeof rawLogo?.rotation === 'number') ? rawLogo.rotation : 0, // degrees -180 to 180
    posX: (typeof rawLogo === 'object' && typeof rawLogo?.posX === 'number') ? rawLogo.posX : 0, // offset in px
    posY: (typeof rawLogo === 'object' && typeof rawLogo?.posY === 'number') ? rawLogo.posY : 0,
    showCircleBadge: (typeof rawLogo === 'object' && rawLogo?.showCircleBadge !== undefined) ? rawLogo.showCircleBadge : true
  };

  // FLOCARD logo configuration & scaling
  const flocardLogo = {
    size: config.flocardLogo?.size ?? 100, // percentage 60 - 150
    position: config.flocardLogo?.position || (templateType === 'customer_logo' ? 'bottom-right' : 'top-left')
  };

  const isMetal = !isAdminPrint && edition === 'metal';
  const isGold = !isAdminPrint && edition === 'gold';
  const isPlatinum = !isAdminPrint && edition === 'platinum';
  const isWhite = isAdminPrint || edition === 'white';

  const isGoldText = !isAdminPrint && (
    (colors.nameColor && (colors.nameColor.toLowerCase() === '#e9c766' || colors.nameColor.toLowerCase() === '#d4af37')) ||
    (colors.primaryAccent && (colors.primaryAccent.toLowerCase() === '#e9c766' || colors.primaryAccent.toLowerCase() === '#d4af37'))
  );

  const getCardLogoSrc = () => {
    if (isAdminPrint) return "/assets/flocard-logo-dark.png";
    if (isGold) return "/assets/flocard-logo-gold.png";
    if (isPlatinum) return "/assets/flocard-logo-platinum.png";
    if (isWhite) {
      return isGoldText ? "/assets/flocard-logo-gold.png" : "/assets/flocard-logo-dark.png";
    }
    return "/assets/flocard-logo-white.png";
  };

  const front = {
    name: 'YOUR NAME',
    role: 'YOUR ROLE',
    details: '',
    tagline: 'Your Tagline',
    showTagline: true,
    showNfc: isMetal ? false : true,
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
    qrUrl: 'https://flocard.in/p/demo',
    subtext: 'SCAN ME',
    showNfcSpecs: true,
    specsText: 'NFC | PORTFOLIO | CONTACT | CONNECT',
    brandUrl: 'flocard.in/yourname',
    ...(config.back || {})
  };

  // Liquid Chrome, Gunmetal & Gold Foil Text Style (Refined metallic typography & hierarchy)
  const getMetallicTextStyle = (baseColor, options = {}, element = 'name') => {
    if (isMetal) {
      if (element === 'name') {
        return {
          color: '#FFFFFF',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 55%, #CBD5E1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.95))',
          ...options
        };
      }
      if (element === 'role') {
        return {
          color: '#E2E8F0',
          letterSpacing: '0.38em',
          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.9))',
          ...options
        };
      }
      if (element === 'tagline') {
        return {
          color: '#94A3B8',
          ...options
        };
      }
      if (element === 'details') {
        return {
          color: '#CBD5E1',
          ...options
        };
      }
      return {
        color: '#FFFFFF',
        ...options
      };
    }
    if (isGold) {
      if (element === 'name') {
        return {
          color: '#E9C766', // Solid champagne gold fallback for unsupported background-clip
          background: 'linear-gradient(100deg, #FFF0A6 0%, #E9C766 35%, #C9972C 70%, #FFE8A0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.9))',
          ...options
        };
      }
      if (element === 'role') {
        // Softer champagne gold, smaller uppercase letters with elegant spacing
        return {
          color: '#E9C766',
          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.85))',
          ...options
        };
      }
      if (element === 'tagline') {
        // Muted warm gold, regular weight, understated
        return {
          color: '#C5A059',
          ...options
        };
      }
      if (element === 'details') {
        return {
          color: '#E9C766',
          ...options
        };
      }
      return {
        color: '#E9C766',
        ...options
      };
    }
    if (isPlatinum) {
      if (element === 'name') {
        return {
          color: '#E2E8F0', // Solid platinum silver fallback
          background: 'linear-gradient(100deg, #FFFFFF 0%, #F1F5F9 25%, #CBD5E1 55%, #94A3B8 80%, #FFFFFF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.9))',
          ...options
        };
      }
      if (element === 'role') {
        // Softer clean platinum silver, smaller uppercase letters with elegant spacing
        return {
          color: '#E2E8F0',
          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.85))',
          ...options
        };
      }
      if (element === 'tagline') {
        // Muted cool silver, regular weight, understated
        return {
          color: '#94A3B8',
          ...options
        };
      }
      if (element === 'details') {
        return {
          color: '#E2E8F0',
          ...options
        };
      }
      return {
        color: '#E2E8F0',
        ...options
      };
    }
    if (isWhite) {
      const isGoldText = (colors.nameColor && (colors.nameColor.toLowerCase() === '#e9c766' || colors.nameColor.toLowerCase() === '#d4af37')) ||
                         (colors.primaryAccent && (colors.primaryAccent.toLowerCase() === '#e9c766' || colors.primaryAccent.toLowerCase() === '#d4af37'));
      if (isGoldText) {
        if (element === 'name') {
          return {
            color: '#D4AF37',
            background: 'linear-gradient(100deg, #D4AF37 0%, #B8860B 50%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15))',
            ...options
          };
        }
        if (element === 'role') {
          return {
            color: '#B8860B',
            letterSpacing: '0.28em',
            ...options
          };
        }
        if (element === 'tagline') {
          return {
            color: '#996515',
            ...options
          };
        }
        if (element === 'details') {
          return {
            color: '#B8860B',
            ...options
          };
        }
        return {
          color: '#D4AF37',
          ...options
        };
      }

      // Default Black text on Pure White card
      if (element === 'name') {
        return {
          color: colors.nameColor || '#000000',
          filter: 'none',
          ...options
        };
      }
      if (element === 'role') {
        return {
          color: colors.roleColor || '#1A1A1A',
          letterSpacing: '0.24em',
          ...options
        };
      }
      if (element === 'tagline') {
        return {
          color: colors.taglineColor || '#475569',
          ...options
        };
      }
      if (element === 'details') {
        return {
          color: colors.detailsColor || '#1E293B',
          ...options
        };
      }
      return {
        color: colors.nameColor || '#000000',
        ...options
      };
    }
    return {
      color: baseColor,
      ...options
    };
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
    const isGoldText = (colors.nameColor && (colors.nameColor.toLowerCase() === '#e9c766' || colors.nameColor.toLowerCase() === '#d4af37')) ||
                       (colors.primaryAccent && (colors.primaryAccent.toLowerCase() === '#e9c766' || colors.primaryAccent.toLowerCase() === '#d4af37'));
    const defaultWhiteQr = isGoldText ? '#D4AF37' : '#000000';
    const qrColor = customColors.qrColor || (isWhite ? defaultWhiteQr : (colors.qrColor || '#FFFFFF'));

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
  }, [back.qrUrl, colors.qrColor, customColors.qrColor, isWhite, colors.nameColor, colors.primaryAccent]);

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

    // 1. Clean solid background matching text contrast (Solid Black or Solid White, NO gradients, NO web textures)
    let solidBg = '#000000';
    if (isAdminPrint) {
      solidBg = '#FFFFFF';
    } else if (edition === 'white') {
      solidBg = '#FFFFFF';
    } else {
      const nColor = (colors.nameColor || '').toLowerCase();
      const isDarkText = nColor === '#000000' || nColor === '#111111' || nColor === '#1a1a1a';
      solidBg = isDarkText ? '#FFFFFF' : (customColors.cardBg || '#000000');
    }
    ctx.fillStyle = solidBg;
    ctx.fillRect(0, 0, exportW, exportH);

    renderCanvasElements(ctx, exportW, exportH);

    function renderCanvasElements(ctx, w, h) {
      // Edge stroke with restrained highlight
      ctx.strokeStyle = isAdminPrint
        ? 'rgba(0, 0, 0, 0.45)'
        : edition === 'white'
        ? 'rgba(0, 0, 0, 0.12)'
        : edition === 'gold'
        ? 'rgba(233, 199, 102, 0.4)'
        : edition === 'metal'
        ? 'rgba(148, 163, 184, 0.35)'
        : edition === 'platinum'
        ? 'rgba(226, 232, 240, 0.3)'
        : 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = isAdminPrint ? 2 : 4;
      ctx.stroke();

      // Helper for metallic specular gradients on Canvas text
      const createMetallicGradient = (x1, y1, x2, y2, type) => {
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        if (type === 'gold') {
          // Refined metallic champagne gold gradient: Highlight #FFF0A6, Champagne #E9C766, Rich gold #C9972C, Light champagne #FFE8A0
          g.addColorStop(0, '#FFF0A6');
          g.addColorStop(0.35, '#E9C766');
          g.addColorStop(0.70, '#C9972C');
          g.addColorStop(1.0, '#FFE8A0');
        } else if (type === 'platinum') {
          // Refined metallic platinum & silver gradient: Specular #FFFFFF, Luster #F1F5F9, Chrome #CBD5E1, Polished silver #94A3B8, Highlight #FFFFFF
          g.addColorStop(0, '#FFFFFF');
          g.addColorStop(0.25, '#F1F5F9');
          g.addColorStop(0.55, '#CBD5E1');
          g.addColorStop(0.80, '#94A3B8');
          g.addColorStop(1.0, '#FFFFFF');
        }
        return g;
      };

      const getNameFill = (x, y, textW, textH, fallbackColor) => {
        if (isAdminPrint) return '#000000';
        if (isWhite) {
          if (isGoldText) return createMetallicGradient(x, y - textH, x + textW, y, 'gold');
          return colors.nameColor || '#000000';
        }
        if (isGold) return createMetallicGradient(x, y - textH, x + textW, y, 'gold');
        if (isPlatinum) return createMetallicGradient(x, y - textH, x + textW, y, 'platinum');
        if (isMetal) return '#FFFFFF';
        return fallbackColor;
      };

      const getRoleFill = (x, y, textW, textH, fallbackColor) => {
        if (isAdminPrint) return '#000000';
        if (isWhite) {
          if (isGoldText) return '#B8860B';
          return colors.roleColor || '#1A1A1A';
        }
        if (isGold) return '#E9C766'; // Softer champagne gold for professional role
        if (isPlatinum) return '#E2E8F0'; // Refined clean silver for professional role
        if (isMetal) return '#E2E8F0';
        return fallbackColor;
      };

      const getTaglineFill = (x, y, textW, textH, fallbackColor) => {
        if (isAdminPrint) return '#000000';
        if (isWhite) {
          if (isGoldText) return '#996515';
          return colors.taglineColor || '#475569';
        }
        if (isGold) return '#C5A059'; // Muted warm gold, understated
        if (isPlatinum) return '#94A3B8'; // Muted cool silver, understated
        if (isMetal) return '#94A3B8';
        return fallbackColor;
      };

      if (templateType === 'standard') {
        // ====================================================================
        // THEME 1 (Pages 1–3 of PDF: Standard FLOCARD Design)
        // ====================================================================
        if (side === 'front') {
          // NFC Icon vertically centered on the right
          if (front.showNfc) {
            drawNfcSymbol(ctx, Math.round(w * 0.825), Math.round(h * 0.428), colors.nfcColor, Math.round(w * 0.076), edition);
          }

          // Optional Customer Logo on top-left of Template 1 front
          if (customerLogo.url) {
            const cImg = new Image();
            cImg.src = customerLogo.url;
            const drawT1Logo = () => {
              const lScale = (customerLogo.size || 100) / 100;
              const lW = Math.round(w * 0.28 * lScale);
              const lH = Math.round(h * 0.16 * lScale);
              const lX = Math.round(w * 0.08) + ((customerLogo.posX || 0) * 2);
              const lY = Math.round(h * 0.12) + ((customerLogo.posY || 0) * 2);
              ctx.save();
              ctx.translate(lX + lW / 2, lY + lH / 2);
              if (customerLogo.rotation) {
                ctx.rotate((customerLogo.rotation * Math.PI) / 180);
              }
              if (isAdminPrint) {
                const off = document.createElement('canvas');
                off.width = Math.max(1, Math.round(lW));
                off.height = Math.max(1, Math.round(lH));
                const oCtx = off.getContext('2d');
                if (oCtx) {
                  oCtx.drawImage(cImg, 0, 0, off.width, off.height);
                  oCtx.globalCompositeOperation = 'source-in';
                  oCtx.fillStyle = '#000000';
                  oCtx.fillRect(0, 0, off.width, off.height);
                  ctx.drawImage(off, -(lW / 2), -(lH / 2), lW, lH);
                } else {
                  ctx.drawImage(cImg, -(lW / 2), -(lH / 2), lW, lH);
                }
              } else {
                ctx.drawImage(cImg, -(lW / 2), -(lH / 2), lW, lH);
              }
              ctx.restore();
            };
            if (cImg.complete && cImg.naturalWidth > 0) {
              drawT1Logo();
            } else {
              cImg.onload = drawT1Logo;
            }
          }

          // Name, Role, Details, Tagline on bottom-left with metallic shine
          const startX = Math.round(w * 0.08);
          const nameFontSize = front.fontSize === 'large' ? 58 : front.fontSize === 'small' ? 46 : 52;
          const nameY = front.details ? (h - 165) : (h - 150);
          ctx.fillStyle = getNameFill(startX, nameY, 360, nameFontSize, colors.nameColor);
          ctx.font = `${isGold || isPlatinum ? '600' : 'bold'} ${nameFontSize}px "${front.fontFamily || 'Space Grotesk'}", sans-serif`;
          ctx.fillText((front.name || 'YOUR NAME').toUpperCase(), startX, nameY);

          const roleY = front.details ? (h - 115) : (h - 96);
          ctx.fillStyle = getRoleFill(startX, roleY, 300, 30, colors.roleColor);
          ctx.font = `600 30px "${front.roleFontFamily || 'Inter'}", sans-serif`;
          ctx.letterSpacing = '8px';
          ctx.fillText((front.role || 'R O L E').toUpperCase(), startX, roleY);
          ctx.letterSpacing = '0px';

          if (front.details) {
            const detailsY = h - 74;
            ctx.fillStyle = isGold ? '#E9C766' : isPlatinum ? '#E2E8F0' : (colors.detailsColor || colors.roleColor);
            ctx.font = `400 18px "${front.detailsFontFamily || front.roleFontFamily || 'Inter'}", sans-serif`;
            ctx.letterSpacing = '2px';
            ctx.fillText(front.details.toUpperCase(), startX, detailsY);
            ctx.letterSpacing = '0px';
          }

          if (front.showTagline && front.tagline) {
            const tagY = h - 42;
            ctx.fillStyle = getTaglineFill(startX, tagY, 250, 19, colors.taglineColor);
            ctx.font = `400 19px "${front.taglineFontFamily || front.roleFontFamily || 'Inter'}", sans-serif`;
            ctx.fillText(front.tagline, startX, tagY);
          }
        } else {
          // Back: FLOCARD logo top-left
          drawFlocardLogo(ctx, Math.round(w * 0.095), Math.round(h * 0.17), Math.round(w * 0.275), flocardLogo.size, edition);

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
            drawNfcSymbol(ctx, Math.round(w * 0.825), Math.round(h * 0.428), colors.nfcColor, Math.round(w * 0.076), edition);
          }

          // Tagline bottom-left
          if (front.showTagline && front.tagline) {
            const startX = Math.round(w * 0.08);
            const tagY = h - 48;
            ctx.fillStyle = getTaglineFill(startX, tagY, 250, 19, colors.taglineColor);
            ctx.font = `400 19px "${front.taglineFontFamily || front.roleFontFamily || 'Inter'}", sans-serif`;
            ctx.fillText(front.tagline, startX, tagY);
          }

          // Customer Logo in Center
          const centerX = (w * 0.49) + (customerLogo.posX * 2);
          const centerY = (h * 0.50) + (customerLogo.posY * 2);
          const radius = Math.round(w * 0.178 * (customerLogo.size / 100));

          if (customerLogo.showCircleBadge && !isAdminPrint) {
            ctx.strokeStyle = isGold ? 'rgba(233, 199, 102, 0.45)' : 'rgba(255, 255, 255, 0.45)';
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
              ctx.save();
              ctx.translate(centerX, centerY);
              if (customerLogo.rotation) {
                ctx.rotate((customerLogo.rotation * Math.PI) / 180);
              }
              if (isAdminPrint) {
                const off = document.createElement('canvas');
                off.width = Math.max(1, Math.round(imgW));
                off.height = Math.max(1, Math.round(imgH));
                const oCtx = off.getContext('2d');
                if (oCtx) {
                  oCtx.drawImage(cImg, 0, 0, off.width, off.height);
                  oCtx.globalCompositeOperation = 'source-in';
                  oCtx.fillStyle = '#000000';
                  oCtx.fillRect(0, 0, off.width, off.height);
                  ctx.drawImage(off, -(imgW / 2), -(imgH / 2), imgW, imgH);
                } else {
                  ctx.drawImage(cImg, -(imgW / 2), -(imgH / 2), imgW, imgH);
                }
              } else {
                ctx.drawImage(cImg, -(imgW / 2), -(imgH / 2), imgW, imgH);
              }
              ctx.restore();
            };
            if (cImg.complete && cImg.naturalWidth > 0) {
              drawT2Logo();
            } else {
              cImg.onload = drawT2Logo;
            }
          } else {
            ctx.fillStyle = isGold
              ? createMetallicGradient(centerX - 80, centerY - 20, centerX + 80, centerY + 20, 'gold')
              : isPlatinum
              ? createMetallicGradient(centerX - 80, centerY - 20, centerX + 80, centerY + 20, 'platinum')
              : '#FFFFFF';
            ctx.font = `${isGold ? '600' : 'bold'} 26px "Space Grotesk", sans-serif`;
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

          // Name, Role, Details bottom-left with metallic shine
          const startX = Math.round(w * 0.08);
          const nameFontSize = front.fontSize === 'large' ? 58 : front.fontSize === 'small' ? 46 : 52;
          const nameY = front.details ? (h - 132) : (h - 118);
          ctx.fillStyle = getNameFill(startX, nameY, 360, nameFontSize, colors.nameColor);
          ctx.font = `${isGold || isPlatinum ? '600' : 'bold'} ${nameFontSize}px "${front.fontFamily || 'Space Grotesk'}", sans-serif`;
          ctx.fillText((front.name || 'YOUR NAME').toUpperCase(), startX, nameY);

          const roleY = front.details ? (h - 85) : (h - 68);
          ctx.fillStyle = getRoleFill(startX, roleY, 300, 30, colors.roleColor);
          ctx.font = `600 30px "${front.roleFontFamily || 'Inter'}", sans-serif`;
          ctx.letterSpacing = '8px';
          ctx.fillText((front.role || 'R O L E').toUpperCase(), startX, roleY);
          ctx.letterSpacing = '0px';

          if (front.details) {
            const detailsY = h - 46;
            ctx.fillStyle = isGold ? '#E9C766' : isPlatinum ? '#E2E8F0' : (colors.detailsColor || colors.roleColor);
            ctx.font = `400 18px "${front.detailsFontFamily || front.roleFontFamily || 'Inter'}", sans-serif`;
            ctx.letterSpacing = '2px';
            ctx.fillText(front.details.toUpperCase(), startX, detailsY);
            ctx.letterSpacing = '0px';
          }

          // FLOCARD Logo bottom-right (aligned under QR code)
          drawFlocardLogo(ctx, Math.round(w * 0.635), Math.round(h * 0.78), Math.round(w * 0.285), flocardLogo.size, edition);
        }
      }

      ctx.restore();
    }
  }, [side, templateType, edition, front, back, colors, customerLogo, flocardLogo, qrDataUrl]);

  const isCompact = width < 350;

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
          backgroundImage: (isAdminPrint || isWhite) ? 'none' : (editionInfo.bgImage ? `url(${editionInfo.bgImage})` : 'none'),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: (isAdminPrint || isWhite) ? '#FFFFFF' : editionInfo.cardBg,
          border: isAdminPrint ? '1.5px solid rgba(0, 0, 0, 0.45)' : (isWhite ? '1px solid rgba(0, 0, 0, 0.12)' : editionInfo.border),
          boxShadow: isAdminPrint
            ? '0 10px 30px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.12)'
            : (isWhite
            ? '0 14px 40px -10px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08)'
            : edition === 'gold'
            ? 'inset 0 0 0 1px rgba(255, 240, 166, 0.08), 0 14px 40px -10px rgba(0, 0, 0, 0.85), 0 0 20px rgba(201, 151, 44, 0.12)'
            : edition === 'metal'
            ? 'inset 0 0 0 1px rgba(226, 232, 240, 0.08), 0 14px 40px -10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(148, 163, 184, 0.12)'
            : `0 12px 40px -10px ${editionInfo.glow}`),
          padding: 0,
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Subtle Ambient Light Flare Layer with Brushed Reflections */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: isAdminPrint ? 'none' : 'block',
            background: isWhite
              ? 'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.8), transparent 60%)'
              : edition === 'purple'
              ? 'radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.18), transparent 50%)'
              : edition === 'gold'
              ? 'linear-gradient(135deg, rgba(255, 240, 166, 0.04) 0%, transparent 40%, rgba(201, 151, 44, 0.03) 100%), radial-gradient(circle at 85% 15%, rgba(233, 199, 102, 0.08) 0%, transparent 45%)'
              : edition === 'metal'
              ? 'radial-gradient(circle at 85% 20%, rgba(226, 232, 240, 0.14), transparent 50%), linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)'
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
                      <defs>
                        <linearGradient id="nfcGoldGrad-standard-front" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFF0A6" />
                          <stop offset="35%" stopColor="#E9C766" />
                          <stop offset="70%" stopColor="#C9972C" />
                          <stop offset="100%" stopColor="#FFE8A0" />
                        </linearGradient>
                        <linearGradient id="nfcPlatGrad-standard-front" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="25%" stopColor="#F1F5F9" />
                          <stop offset="55%" stopColor="#CBD5E1" />
                          <stop offset="80%" stopColor="#94A3B8" />
                          <stop offset="100%" stopColor="#FFFFFF" />
                        </linearGradient>
                        <filter id="nfcGoldGlow-standard-front" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.85" />
                        </filter>
                        <filter id="nfcPlatGlow-standard-front" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.85" />
                        </filter>
                      </defs>
                      <g filter={isGold ? "url(#nfcGoldGlow-standard-front)" : isPlatinum ? "url(#nfcPlatGlow-standard-front)" : undefined}>
                        <path d="M 4.67 36.07 A 27.50 27.50 0 0 1 4.67 69.93" stroke={isGold ? "url(#nfcGoldGrad-standard-front)" : isPlatinum ? "url(#nfcPlatGrad-standard-front)" : "currentColor"} strokeWidth="8.5" strokeLinecap="round" />
                        <path d="M 21.02 25.37 A 47.00 47.00 0 0 1 21.02 80.63" stroke={isGold ? "url(#nfcGoldGrad-standard-front)" : isPlatinum ? "url(#nfcPlatGrad-standard-front)" : "currentColor"} strokeWidth="8.5" strokeLinecap="round" />
                        <path d="M 37.47 14.86 A 66.50 66.50 0 0 1 37.47 91.14" stroke={isGold ? "url(#nfcGoldGrad-standard-front)" : isPlatinum ? "url(#nfcPlatGrad-standard-front)" : "currentColor"} strokeWidth="8.5" strokeLinecap="round" />
                        <path d="M 54.30 4.91 A 86.00 86.00 0 0 1 54.30 101.09" stroke={isGold ? "url(#nfcGoldGrad-standard-front)" : isPlatinum ? "url(#nfcPlatGrad-standard-front)" : "currentColor"} strokeWidth="8.5" strokeLinecap="round" />
                      </g>
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
                        maxHeight: `${Math.round(width * 0.14 * (customerLogo.size / 100))}px`,
                        objectFit: 'contain',
                        transform: `translate(${customerLogo.posX}px, ${customerLogo.posY}px) rotate(${customerLogo.rotation || 0}deg)`,
                        filter: isAdminPrint ? 'brightness(0)' : 'none'
                      }}
                    />
                  </div>
                )}

                {/* Front: Name, Role, Tagline on Lower-Left with Refined Metallic Gold Hierarchy */}
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
                      fontSize: isCompact
                        ? (front.fontSize === 'large' ? '1.38rem' : front.fontSize === 'small' ? '1.05rem' : '1.20rem')
                        : (front.fontSize === 'large' ? '1.78rem' : front.fontSize === 'small' ? '1.34rem' : '1.54rem'),
                      fontWeight: isGold || isPlatinum || isMetal ? 700 : 800,
                      letterSpacing: '0.04em',
                      lineHeight: 1.15,
                      ...getMetallicTextStyle(colors.nameColor, {}, 'name')
                    }}
                  >
                    {front.name || 'YOUR NAME'}
                  </div>

                  <div
                    style={{
                      fontFamily: front.roleFontFamily ? `"${front.roleFontFamily}", sans-serif` : 'var(--font-sans)',
                      fontSize: isCompact ? '0.68rem' : '0.90rem',
                      letterSpacing: isMetal ? '0.36em' : '0.32em',
                      fontWeight: 600,
                      marginTop: isCompact ? '5px' : '8px',
                      textTransform: 'uppercase',
                      ...getMetallicTextStyle(colors.roleColor, {}, 'role')
                    }}
                  >
                    {front.role || 'R O L E'}
                  </div>

                  {front.details && (
                    <div
                      style={{
                        fontFamily: front.detailsFontFamily ? `"${front.detailsFontFamily}", sans-serif` : (front.roleFontFamily ? `"${front.roleFontFamily}", sans-serif` : 'var(--font-sans)'),
                        fontSize: isCompact ? '0.46rem' : '0.64rem',
                        letterSpacing: '0.12em',
                        fontWeight: 400,
                        marginTop: isCompact ? '3px' : '4px',
                        textTransform: 'uppercase',
                        opacity: 0.95,
                        ...getMetallicTextStyle(colors.detailsColor || colors.roleColor, {}, 'details')
                      }}
                    >
                      {front.details}
                    </div>
                  )}

                  {front.showTagline && front.tagline && (
                    <div
                      style={{
                        fontFamily: (front.taglineFontFamily || front.roleFontFamily) ? `"${front.taglineFontFamily || front.roleFontFamily}", sans-serif` : 'var(--font-sans)',
                        fontSize: isCompact ? '0.46rem' : '0.62rem',
                        marginTop: isCompact ? '6px' : '12px',
                        letterSpacing: '0.02em',
                        fontWeight: 400,
                        ...getMetallicTextStyle(colors.taglineColor, {}, 'tagline')
                      }}
                    >
                      {front.tagline}
                    </div>
                  )}
                </div>
              </>
            )}

            {side === 'back' && (
              <>
                {/* Back Left: Official FLOCARD logo (Preserving artwork) */}
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
                    src={getCardLogoSrc()}
                    alt="FLOCARD"
                    style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.src = isWhite ? '/assets/flocard-logo-dark.png' : '/assets/flocard-logo-white.png';
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      fontSize: '1.4rem',
                      color: isGold ? '#E9C766' : '#ffffff',
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
                      <defs>
                        <linearGradient id="nfcGoldGrad-customer_logo-front" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFF0A6" />
                          <stop offset="35%" stopColor="#E9C766" />
                          <stop offset="70%" stopColor="#C9972C" />
                          <stop offset="100%" stopColor="#FFE8A0" />
                        </linearGradient>
                        <linearGradient id="nfcPlatGrad-customer_logo-front" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="25%" stopColor="#F1F5F9" />
                          <stop offset="55%" stopColor="#CBD5E1" />
                          <stop offset="80%" stopColor="#94A3B8" />
                          <stop offset="100%" stopColor="#FFFFFF" />
                        </linearGradient>
                        <filter id="nfcGoldGlow-customer_logo-front" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.85" />
                        </filter>
                        <filter id="nfcPlatGlow-customer_logo-front" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.85" />
                        </filter>
                      </defs>
                      <g filter={isGold ? "url(#nfcGoldGlow-customer_logo-front)" : isPlatinum ? "url(#nfcPlatGlow-customer_logo-front)" : undefined}>
                        <path d="M 4.67 36.07 A 27.50 27.50 0 0 1 4.67 69.93" stroke={isGold ? "url(#nfcGoldGrad-customer_logo-front)" : isPlatinum ? "url(#nfcPlatGrad-customer_logo-front)" : "currentColor"} strokeWidth="8.5" strokeLinecap="round" />
                        <path d="M 21.02 25.37 A 47.00 47.00 0 0 1 21.02 80.63" stroke={isGold ? "url(#nfcGoldGrad-customer_logo-front)" : isPlatinum ? "url(#nfcPlatGrad-customer_logo-front)" : "currentColor"} strokeWidth="8.5" strokeLinecap="round" />
                        <path d="M 37.47 14.86 A 66.50 66.50 0 0 1 37.47 91.14" stroke={isGold ? "url(#nfcGoldGrad-customer_logo-front)" : isPlatinum ? "url(#nfcPlatGrad-customer_logo-front)" : "currentColor"} strokeWidth="8.5" strokeLinecap="round" />
                        <path d="M 54.30 4.91 A 86.00 86.00 0 0 1 54.30 101.09" stroke={isGold ? "url(#nfcGoldGrad-customer_logo-front)" : isPlatinum ? "url(#nfcPlatGrad-customer_logo-front)" : "currentColor"} strokeWidth="8.5" strokeLinecap="round" />
                      </g>
                    </svg>
                  </div>
                )}

                {/* Center: Prominent Customer Logo Badge with Resizing & Drag */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '49%',
                    transform: `translate(calc(-50% + ${customerLogo.posX}px), calc(-50% + ${customerLogo.posY}px)) rotate(${customerLogo.rotation || 0}deg)`,
                    width: `${Math.round(width * 0.355 * (customerLogo.size / 100))}px`,
                    height: `${Math.round(width * 0.355 * (customerLogo.size / 100))}px`,
                    borderRadius: '50%',
                    border: (customerLogo.showCircleBadge && !isAdminPrint) ? (isGold ? '1.5px solid rgba(233, 199, 102, 0.45)' : '1.5px solid rgba(255, 255, 255, 0.45)') : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: (customerLogo.showCircleBadge && !isAdminPrint) ? 'rgba(0, 0, 0, 0.45)' : 'transparent',
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
                        display: 'block',
                        filter: isAdminPrint ? 'brightness(0)' : 'none'
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: `${Math.max(0.7, 0.82 * (customerLogo.size / 100))}rem`,
                        letterSpacing: '0.14em',
                        fontWeight: isGold ? 600 : 700,
                        ...getMetallicTextStyle('#FFFFFF', {}, 'name')
                      }}
                    >
                      YOUR LOGO
                    </span>
                  )}
                </div>

                {/* Front Bottom-Left: Tagline */}
                {front.showTagline && front.tagline && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '8%',
                      bottom: '8.5%',
                      zIndex: 3,
                      fontFamily: (front.taglineFontFamily || front.roleFontFamily) ? `"${front.taglineFontFamily || front.roleFontFamily}", sans-serif` : 'var(--font-sans)',
                      fontSize: isCompact ? '0.46rem' : '0.62rem',
                      letterSpacing: '0.02em',
                      fontWeight: 400,
                      ...getMetallicTextStyle(colors.taglineColor, {}, 'tagline')
                    }}
                  >
                    {front.tagline}
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

                {/* Back Bottom-Left: Name & Role with Refined Metallic Gold Hierarchy */}
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
                      fontSize: isCompact
                        ? (front.fontSize === 'large' ? '1.38rem' : front.fontSize === 'small' ? '1.05rem' : '1.20rem')
                        : (front.fontSize === 'large' ? '1.78rem' : front.fontSize === 'small' ? '1.34rem' : '1.54rem'),
                      fontWeight: isGold || isPlatinum || isMetal ? 700 : 800,
                      letterSpacing: '0.04em',
                      lineHeight: 1.15,
                      ...getMetallicTextStyle(colors.nameColor, {}, 'name')
                    }}
                  >
                    {front.name || 'YOUR NAME'}
                  </div>

                  <div
                    style={{
                      fontFamily: front.roleFontFamily ? `"${front.roleFontFamily}", sans-serif` : 'var(--font-sans)',
                      fontSize: isCompact ? '0.68rem' : '0.90rem',
                      letterSpacing: isMetal ? '0.36em' : '0.32em',
                      fontWeight: 600,
                      marginTop: isCompact ? '5px' : '8px',
                      textTransform: 'uppercase',
                      ...getMetallicTextStyle(colors.roleColor, {}, 'role')
                    }}
                  >
                    {front.role || 'R O L E'}
                  </div>

                  {front.details && (
                    <div
                      style={{
                        fontFamily: front.detailsFontFamily ? `"${front.detailsFontFamily}", sans-serif` : (front.roleFontFamily ? `"${front.roleFontFamily}", sans-serif` : 'var(--font-sans)'),
                        fontSize: isCompact ? '0.46rem' : '0.64rem',
                        letterSpacing: '0.12em',
                        fontWeight: 400,
                        marginTop: isCompact ? '3px' : '4px',
                        textTransform: 'uppercase',
                        opacity: 0.95,
                        ...getMetallicTextStyle(colors.detailsColor || colors.roleColor, {}, 'details')
                      }}
                    >
                      {front.details}
                    </div>
                  )}
                </div>

                {/* Back Bottom-Right: Official FLOCARD Logo (aligned under QR code, preserving artwork) */}
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
                    src={getCardLogoSrc()}
                    alt="FLOCARD"
                    style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.src = isWhite ? '/assets/flocard-logo-dark.png' : '/assets/flocard-logo-white.png';
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      fontSize: '1.25rem',
                      color: isGold ? '#E9C766' : '#ffffff',
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

function drawNfcSymbol(ctx, x, y, color, targetW = 76, edition = null) {
  const scale = targetW / 76;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  let strokeStyle = color || '#FFFFFF';
  if (edition === 'gold') {
    const nfcGrad = ctx.createLinearGradient(0, 0, 76, 106);
    nfcGrad.addColorStop(0, '#FFF0A6');
    nfcGrad.addColorStop(0.35, '#E9C766');
    nfcGrad.addColorStop(0.70, '#C9972C');
    nfcGrad.addColorStop(1, '#FFE8A0');
    strokeStyle = nfcGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
  } else if (edition === 'platinum') {
    const nfcGrad = ctx.createLinearGradient(0, 0, 76, 106);
    nfcGrad.addColorStop(0, '#FFFFFF');
    nfcGrad.addColorStop(0.25, '#F1F5F9');
    nfcGrad.addColorStop(0.55, '#CBD5E1');
    nfcGrad.addColorStop(0.80, '#94A3B8');
    nfcGrad.addColorStop(1, '#FFFFFF');
    strokeStyle = nfcGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
  }

  ctx.strokeStyle = strokeStyle;
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

function drawFlocardLogo(ctx, x, y, targetWidth = 297, scale = 100, edition = null) {
  ctx.save();
  ctx.translate(x, y);
  const s = scale / 100;
  ctx.scale(s, s);

  const logoImg = new Image();
  logoImg.src = edition === 'gold' ? '/assets/flocard-logo-gold.png' : edition === 'platinum' ? '/assets/flocard-logo-platinum.png' : '/assets/flocard-logo-white.png';
  const drawLogo = (img) => {
    const aspect = img.naturalWidth / img.naturalHeight;
    const targetH = targetWidth / aspect;
    ctx.drawImage(img, 0, 0, targetWidth, targetH);
  };

  if (logoImg.complete && logoImg.naturalWidth > 0) {
    drawLogo(logoImg);
  } else {
    logoImg.onload = () => drawLogo(logoImg);
    ctx.fillStyle = edition === 'gold' ? '#E9C766' : '#FFFFFF';
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.fillText('FLOCARD', 0, 32);
  }

  ctx.restore();
}
