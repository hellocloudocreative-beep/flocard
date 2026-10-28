/* ==========================================================================
   FLOCARDS PRINT-READY PREPRESS & ASSET DOWNLOAD PANEL
   Industrial CR80 ISO/IEC 7810 ID-1 Artwork Generation
   Provides:
   1. Download Card PDF (Dual-sided, 85.60 x 53.98 mm + 3mm bleed & crop marks)
   2. Download Front Artwork (Print-ready PDF & 300 DPI PNG)
   3. Download Back Artwork (Print-ready PDF & 300 DPI PNG)
   4. Download Transparent Logo (Isolated logo with automatic background removal)
   5. Download Original Logo (Unmodified uploaded source)
   6. Download Additional Assets (300 DPI QR Code PNG & Vector SVG)
   ========================================================================== */

import React, { useState } from 'react';
import {
  Printer,
  Download,
  Image as ImageIcon,
  QrCode,
  Layers,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Sparkles,
  FileText,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import {
  generateCardPrintPDF,
  renderAuthoritativeCardCanvas,
  generateIsolatedLogoAsset,
  downloadArtworkFile,
  CARD_DIMENSIONS_MM,
  BASE_ARTWORK_PIXELS
} from '../../lib/cardArtworkService';
import { normalizeCardDesign } from '../CustomerCardPreview';
import QRCode from 'qrcode';

export default function OrderPrintDownloadsPanel({
  order = null,
  isLight = false,
  isAdmin = true,
  onAssetGenerated = null
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTask, setActiveTask] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!order) return null;

  const normalized = normalizeCardDesign(order);
  const { edition, templateType, config } = normalized;
  const customerLogoObj = config?.customerLogo;
  const hasLogo = Boolean(customerLogoObj?.url);
  const isSvgLogo = typeof customerLogoObj?.url === 'string' && (
    customerLogoObj.url.includes('image/svg+xml') || customerLogoObj.url.endsWith('.svg')
  );

  const orderRef = order.orderReference || order.id || 'FLOCARD';
  const clientName = (config?.front?.name || order.customerName || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage('');
    } else {
      setSuccessMessage(msg);
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  // 1. Download Dual-Sided Print-Ready PDF
  const handleDownloadFullPDF = async (withBleed = true) => {
    setIsProcessing(true);
    setActiveTask(withBleed ? 'Generating Prepress PDF with Bleed...' : 'Generating Trimmed Card PDF...');
    setErrorMessage('');

    try {
      const result = await generateCardPrintPDF(order, {
        mode: 'dual',
        withBleed,
        download: true
      });
      showNotification(`✓ Downloaded ${result.filename} (${withBleed ? '91.6 x 60mm with 3mm Bleed' : '85.6 x 54mm Exact Trim'})`);
      if (onAssetGenerated) onAssetGenerated('card_pdf', result);
    } catch (err) {
      console.error('[PrintPanel] Error generating PDF:', err);
      showNotification(err.message || 'Failed to generate print-ready PDF.', true);
    } finally {
      setIsProcessing(false);
      setActiveTask('');
    }
  };

  // 2. Download Front Artwork (PDF or PNG)
  const handleDownloadFront = async (format = 'pdf') => {
    setIsProcessing(true);
    setActiveTask(`Generating Front Artwork (${format.toUpperCase()})...`);
    setErrorMessage('');

    try {
      if (format === 'pdf') {
        const result = await generateCardPrintPDF(order, {
          mode: 'front',
          withBleed: true,
          download: true
        });
        showNotification(`✓ Downloaded ${result.filename}`);
      } else {
        const canvas = await renderAuthoritativeCardCanvas(order, 'front', { withBleed: false });
        downloadArtworkFile(canvas, `${orderRef}_${clientName}_front_300dpi.png`);
        showNotification(`✓ Downloaded ${orderRef}_front_300dpi.png`);
      }
    } catch (err) {
      console.error('[PrintPanel] Error exporting front:', err);
      showNotification(err.message || 'Failed to export front artwork.', true);
    } finally {
      setIsProcessing(false);
      setActiveTask('');
    }
  };

  // 3. Download Back Artwork (PDF or PNG)
  const handleDownloadBack = async (format = 'pdf') => {
    setIsProcessing(true);
    setActiveTask(`Generating Back Artwork (${format.toUpperCase()})...`);
    setErrorMessage('');

    try {
      if (format === 'pdf') {
        const result = await generateCardPrintPDF(order, {
          mode: 'back',
          withBleed: true,
          download: true
        });
        showNotification(`✓ Downloaded ${result.filename}`);
      } else {
        const canvas = await renderAuthoritativeCardCanvas(order, 'back', { withBleed: false });
        downloadArtworkFile(canvas, `${orderRef}_${clientName}_back_300dpi.png`);
        showNotification(`✓ Downloaded ${orderRef}_back_300dpi.png`);
      }
    } catch (err) {
      console.error('[PrintPanel] Error exporting back:', err);
      showNotification(err.message || 'Failed to export back artwork.', true);
    } finally {
      setIsProcessing(false);
      setActiveTask('');
    }
  };

  // 4. Download Transparent Logo PNG (Isolated with background removed)
  const handleDownloadTransparentLogo = async () => {
    if (!hasLogo) return;
    setIsProcessing(true);
    setActiveTask('Isolating logo & removing background...');
    setErrorMessage('');

    try {
      const result = await generateIsolatedLogoAsset(order, { format: 'transparent_png' });
      if (!result.success) {
        throw new Error(result.error);
      }
      downloadArtworkFile(result.dataUrl, result.fileName);
      showNotification(`✓ Downloaded Transparent Logo PNG (${result.width}x${result.height}px with 32-bit alpha channel)`);
      if (onAssetGenerated) onAssetGenerated('transparent_logo', result);
    } catch (err) {
      console.error('[PrintPanel] Error processing transparent logo:', err);
      showNotification(err.message || 'Failed to isolate transparent logo.', true);
    } finally {
      setIsProcessing(false);
      setActiveTask('');
    }
  };

  // 5. Download Original Uploaded Logo
  const handleDownloadOriginalLogo = async () => {
    if (!hasLogo) return;
    setIsProcessing(true);
    setActiveTask('Preparing original logo file...');
    setErrorMessage('');

    try {
      const result = await generateIsolatedLogoAsset(order, { format: 'original' });
      if (!result.success) {
        throw new Error(result.error);
      }
      downloadArtworkFile(result.dataUrl, result.fileName);
      showNotification(`✓ Downloaded original source logo file`);
    } catch (err) {
      console.error('[PrintPanel] Error downloading original logo:', err);
      showNotification(err.message || 'Failed to download original logo.', true);
    } finally {
      setIsProcessing(false);
      setActiveTask('');
    }
  };

  // 6. Download High-Res Standalone QR Code
  const handleDownloadStandaloneQR = async () => {
    setIsProcessing(true);
    setActiveTask('Rendering high-res QR code...');
    setErrorMessage('');

    try {
      const targetUrl = config?.back?.qrUrl || 'https://flocard.in';
      const qrColor = config?.customColors?.qrColor || (edition === 'white' ? '#000000' : '#FFFFFF');
      const qrData = await QRCode.toDataURL(targetUrl, {
        width: 1024,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: qrColor,
          light: '#00000000'
        }
      });
      downloadArtworkFile(qrData, `${orderRef}_qrcode_1024px.png`);
      showNotification(`✓ Downloaded High-Res 1024px QR Code PNG`);
    } catch (err) {
      console.error('[PrintPanel] Error generating QR code:', err);
      showNotification(err.message || 'Failed to generate QR code.', true);
    } finally {
      setIsProcessing(false);
      setActiveTask('');
    }
  };

  return (
    <div
      style={{
        padding: '18px',
        borderRadius: '14px',
        backgroundColor: isLight ? '#F8F6FC' : 'rgba(255, 255, 255, 0.03)',
        border: isLight ? '1px solid #E2D9F3' : '1px solid rgba(168, 85, 247, 0.2)',
        marginBottom: '18px'
      }}
    >
      {/* Panel Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={16} color="#A855F7" />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: isLight ? '#1E1040' : '#FFFFFF' }}>
              Print-Ready Prepress & Asset Downloads
            </h4>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 7px',
                borderRadius: '6px',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: '#A855F7',
                fontWeight: 700
              }}
            >
              CR80 300 DPI
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: isLight ? '#64748B' : '#94A3B8' }}>
            ISO/IEC 7810 ID-1 standard (85.60 × 53.98 mm) with 3.0 mm bleed, crop marks, and customer-exact artwork
          </p>
        </div>

        {/* Live specs badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: isLight ? '#6B00FF' : '#D8B4FE' }}>
          <ShieldCheck size={14} />
          <span>Verified from approved design data</span>
        </div>
      </div>

      {/* Progress / Status banner */}
      {isProcessing && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: isLight ? 'rgba(107, 0, 255, 0.08)' : 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: isLight ? '#6B00FF' : '#D8B4FE',
            fontSize: '0.78rem',
            fontWeight: 600,
            marginBottom: '12px'
          }}
        >
          <RotateCw size={14} className="animate-spin" />
          <span>{activeTask}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.12)',
            border: isLight ? '1px solid #BBF7D0' : '1px solid rgba(34, 197, 94, 0.3)',
            color: '#16A34A',
            fontSize: '0.78rem',
            fontWeight: 600,
            marginBottom: '12px'
          }}
        >
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.12)',
            border: isLight ? '1px solid #FECACA' : '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            fontSize: '0.78rem',
            fontWeight: 600,
            marginBottom: '12px'
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary Actions Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '10px'
        }}
      >
        {/* Action 1: Full Card PDF with Bleed */}
        <button
          type="button"
          onClick={() => handleDownloadFullPDF(true)}
          disabled={isProcessing}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #A855F7',
            background: isLight ? 'linear-gradient(135deg, #7038F8 0%, #A855F7 100%)' : 'linear-gradient(135deg, rgba(112, 56, 248, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
            color: '#FFFFFF',
            cursor: isProcessing ? 'wait' : 'pointer',
            textAlign: 'left',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <Printer size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Download Card PDF</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.88 }}>Dual-Sided with 3mm Bleed & Crop Marks</div>
          </div>
        </button>

        {/* Action 1b: Exact Trimmed PDF (No Bleed) */}
        <button
          type="button"
          onClick={() => handleDownloadFullPDF(false)}
          disabled={isProcessing}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px',
            borderRadius: '10px',
            border: isLight ? '1px solid #D8B4FE' : '1px solid rgba(255, 255, 255, 0.15)',
            background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
            color: isLight ? '#1E1040' : '#FFFFFF',
            cursor: isProcessing ? 'wait' : 'pointer',
            textAlign: 'left'
          }}
        >
          <FileText size={18} color="#A855F7" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Download Trimmed PDF</div>
            <div style={{ fontSize: '0.7rem', color: isLight ? '#64748B' : '#94A3B8' }}>Exact 85.60 × 53.98 mm (No Margin)</div>
          </div>
        </button>

        {/* Action 2: Front Artwork */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            border: isLight ? '1px solid #E2D9F3' : '1px solid rgba(255, 255, 255, 0.1)',
            background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Layers size={16} color="#3B82F6" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#1E1040' : '#FFFFFF' }}>Side A: Front</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleDownloadFront('pdf')}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(59, 130, 246, 0.1)',
                color: isLight ? '#2563EB' : '#93C5FD',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: isProcessing ? 'wait' : 'pointer'
              }}
            >
              Front PDF
            </button>
            <button
              type="button"
              onClick={() => handleDownloadFront('png')}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: isLight ? '#475569' : '#CBD5E1',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: isProcessing ? 'wait' : 'pointer'
              }}
            >
              300 DPI PNG
            </button>
          </div>
        </div>

        {/* Action 3: Back Artwork */}
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            border: isLight ? '1px solid #E2D9F3' : '1px solid rgba(255, 255, 255, 0.1)',
            background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <QrCode size={16} color="#10B981" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#1E1040' : '#FFFFFF' }}>Side B: Back (QR/NFC)</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleDownloadBack('pdf')}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.1)',
                color: isLight ? '#059669' : '#6EE7B7',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: isProcessing ? 'wait' : 'pointer'
              }}
            >
              Back PDF
            </button>
            <button
              type="button"
              onClick={() => handleDownloadBack('png')}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: isLight ? '#475569' : '#CBD5E1',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: isProcessing ? 'wait' : 'pointer'
              }}
            >
              300 DPI PNG
            </button>
          </div>
        </div>

        {/* Action 4: Transparent Logo PNG */}
        {hasLogo && (
          <button
            type="button"
            onClick={handleDownloadTransparentLogo}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px',
              borderRadius: '10px',
              border: isLight ? '1px solid #BBF7D0' : '1px solid rgba(34, 197, 94, 0.3)',
              background: isLight ? '#F0FDF4' : 'rgba(34, 197, 94, 0.08)',
              color: isLight ? '#15803D' : '#4ADE80',
              cursor: isProcessing ? 'wait' : 'pointer',
              textAlign: 'left'
            }}
          >
            <Sparkles size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Download Transparent Logo</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Auto BG Removed • Customer Scaled</div>
            </div>
          </button>
        )}

        {/* Action 5: Original Logo Source */}
        {hasLogo && (
          <button
            type="button"
            onClick={handleDownloadOriginalLogo}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px',
              borderRadius: '10px',
              border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.1)',
              background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.04)',
              color: isLight ? '#1E1040' : '#FFFFFF',
              cursor: isProcessing ? 'wait' : 'pointer',
              textAlign: 'left'
            }}
          >
            <ImageIcon size={18} color="#6B00FF" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Download Original Logo</div>
              <div style={{ fontSize: '0.7rem', color: isLight ? '#64748B' : '#94A3B8' }}>Unmodified Uploaded File</div>
            </div>
          </button>
        )}

        {/* Action 6: Standalone QR Code */}
        <button
          type="button"
          onClick={handleDownloadStandaloneQR}
          disabled={isProcessing}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px',
            borderRadius: '10px',
            border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.1)',
            background: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.04)',
            color: isLight ? '#1E1040' : '#FFFFFF',
            cursor: isProcessing ? 'wait' : 'pointer',
            textAlign: 'left'
          }}
        >
          <QrCode size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Download QR Code PNG</div>
            <div style={{ fontSize: '0.7rem', color: isLight ? '#64748B' : '#94A3B8' }}>1024px Transparent Engraving Asset</div>
          </div>
        </button>
      </div>

      {/* Regeneration Notice / Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: isLight ? '1px solid #E2D9F3' : '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem', color: isLight ? '#64748B' : '#94A3B8' }}>
        <span>
          Destination link: <strong style={{ color: isLight ? '#6B00FF' : '#D8B4FE' }}>{config?.back?.qrUrl || 'https://flocard.in'}</strong>
        </span>
        <button
          type="button"
          onClick={() => handleDownloadFullPDF(true)}
          disabled={isProcessing}
          style={{
            background: 'none',
            border: 'none',
            color: isLight ? '#7038F8' : '#A855F7',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 600,
            padding: 0
          }}
        >
          <RotateCw size={11} />
          <span>Regenerate Prepress Package</span>
        </button>
      </div>
    </div>
  );
}

