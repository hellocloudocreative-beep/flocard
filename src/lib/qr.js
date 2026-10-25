/* ==========================================================================
   FLOCARDS SMART QR COMPANION ENGINE
   Deterministic, high-resolution, vector SVG & print-ready PNG generator.
   Ensures permanent canonical routing to https://flocard.in/:slug
   ========================================================================== */

import QRCode from 'qrcode';

export const CANONICAL_BASE_URL = 'https://flocard.in';

// Build canonical permanent URL
export function getCanonicalProfileUrl(slug) {
  if (!slug) return CANONICAL_BASE_URL;
  const cleanSlug = String(slug).toLowerCase().trim().replace(/^\/+/, '');
  return `${CANONICAL_BASE_URL}/${cleanSlug}`;
}

// Generate QR Code PNG Data URL
export async function generateQrDataUrl(text, options = {}) {
  const {
    width = 600,
    margin = 2,
    errorCorrectionLevel = 'H',
    darkColor = '#000000',
    lightColor = '#FFFFFF'
  } = options;

  try {
    return await QRCode.toDataURL(text, {
      width,
      margin,
      errorCorrectionLevel,
      color: {
        dark: darkColor,
        light: lightColor
      }
    });
  } catch (err) {
    console.error('Error generating QR Data URL:', err);
    throw err;
  }
}

// Generate QR Code SVG String
export async function generateQrSvgString(text, options = {}) {
  const {
    margin = 2,
    errorCorrectionLevel = 'H',
    darkColor = '#000000',
    lightColor = '#FFFFFF'
  } = options;

  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin,
      errorCorrectionLevel,
      color: {
        dark: darkColor,
        light: lightColor
      }
    });
  } catch (err) {
    console.error('Error generating QR SVG:', err);
    throw err;
  }
}

// Download Print-Ready PNG (High Resolution 2048x2048)
export async function downloadQrPng(text, filename = 'flocard-qr.png', width = 2048) {
  try {
    const dataUrl = await generateQrDataUrl(text, {
      width,
      margin: 3,
      errorCorrectionLevel: 'H',
      darkColor: '#000000',
      lightColor: '#FFFFFF'
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to download QR PNG:', err);
  }
}

// Download Scalable Vector SVG
export async function downloadQrSvg(text, filename = 'flocard-qr.svg') {
  try {
    const svgString = await generateQrSvgString(text, {
      margin: 3,
      errorCorrectionLevel: 'H',
      darkColor: '#000000',
      lightColor: '#FFFFFF'
    });

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download QR SVG:', err);
  }
}
