/* ==========================================================================
   FLOCARD CUSTOMER CARD DESIGN PREVIEW (SHARED COMPONENT)
   Unified source of truth for rendering customer-submitted card designs in:
   - Admin Order Manager & Details Modal
   - Admin Design Review & Proofing
   - Customer Order Tracker & Receipts
   Guarantees 100% fidelity with the customer designer.
   ========================================================================== */

import React, { useState, useMemo, useRef } from 'react';
import CardCanvas from './CardCanvas';
import Card3DPreview from './Card3DPreview';
import { Eye, RotateCw, AlertTriangle, CheckCircle2, QrCode, Type, Image as ImageIcon, Download, Printer } from 'lucide-react';
import { EDITIONS } from '../lib/constants';
import { useData } from '../context/DataContext';
import { exportCardPDF, downloadBothSides, generateCardPrintPDF, renderAuthoritativeCardCanvas } from '../lib/pdfExport';
import { normalizeCardDesign } from '../lib/cardArtworkService';

export { normalizeCardDesign };

export default function CustomerCardPreview({
  order = null,
  design = null,
  fallbackDesigns = null,
  width = 440,
  interactive = true,
  enable3D = true,
  showControls = true,
  showExport = false,
  isLight = false,
  className = ''
}) {
  let contextDesigns = [];
  try {
    const data = useData();
    if (data && Array.isArray(data.designs)) contextDesigns = data.designs;
  } catch {
    // If rendered outside DataProvider
  }

  const activeFallbackDesigns = fallbackDesigns && fallbackDesigns.length > 0 ? fallbackDesigns : contextDesigns;
  const [side, setSide] = useState('front');
  const [isExporting, setIsExporting] = useState(false);

  // Hidden 300 DPI Export Canvases
  const frontCanvasRef = useRef(null);
  const backCanvasRef = useRef(null);

  const { edition, templateType, isLegacyFallback, config } = useMemo(() => {
    return normalizeCardDesign(design || order, activeFallbackDesigns);
  }, [design, order, activeFallbackDesigns]);

  const editionName = EDITIONS[edition]?.name || edition.toUpperCase();
  const hasCustomLogo = Boolean(config.customerLogo?.url);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Authoritative prepress export: generates directly from design data with CR80 dimensions & bleed
      await generateCardPrintPDF(design || order, {
        mode: 'dual',
        withBleed: true,
        download: true
      });
    } catch (e) {
      console.error('PDF export error:', e);
      // Fallback to canvas reference if available
      try {
        await exportCardPDF({
          frontCanvas: frontCanvasRef.current,
          backCanvas: backCanvasRef.current,
          designName: config.front?.name ? `${config.front.name}-FLOCARD` : 'FLOCARD-Card',
          edition: editionName
        });
      } catch (errFallback) {
        alert('Unable to generate PDF. Please ensure all card assets are loaded.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadArtwork = async () => {
    setIsExporting(true);
    try {
      let front = frontCanvasRef.current;
      let back = backCanvasRef.current;
      if (!front || typeof front.toDataURL !== 'function') {
        front = await renderAuthoritativeCardCanvas(design || order, 'front', { withBleed: false });
      }
      if (!back || typeof back.toDataURL !== 'function') {
        back = await renderAuthoritativeCardCanvas(design || order, 'back', { withBleed: false });
      }

      await downloadBothSides({
        frontCanvas: front,
        backCanvas: back,
        designName: config.front?.name ? `${config.front.name}-FLOCARD` : 'FLOCARD-Card',
        editionName
      });
    } catch (e) {
      console.error('Artwork download error:', e);
      alert('Unable to export artwork files.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className={`customer-card-preview-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: `${width + 32}px`,
        margin: '0 auto'
      }}
    >
      {/* Hidden 300 DPI Industrial Export Canvases */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', visibility: 'hidden', pointerEvents: 'none' }}>
        <CardCanvas
          side="front"
          templateType={templateType}
          edition={edition}
          config={config}
          canvasRef={frontCanvasRef}
          width={1080}
        />
        <CardCanvas
          side="back"
          templateType={templateType}
          edition={edition}
          config={config}
          canvasRef={backCanvasRef}
          width={1080}
        />
      </div>

      {/* Legacy Order Fallback Indicator */}
      {isLegacyFallback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '10px',
            backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.12)',
            border: isLight ? '1px solid #FECACA' : '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            fontSize: '0.74rem',
            fontWeight: 600,
            marginBottom: '10px',
            boxSizing: 'border-box'
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>Legacy Order: No custom design configuration saved. Displaying standard template fallback.</span>
        </div>
      )}

      {/* Side and Finish Bar */}
      {showControls && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '12px',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          {/* Front / Back Toggle Pill */}
          <div
            style={{
              display: 'inline-flex',
              padding: '3px',
              borderRadius: '9999px',
              backgroundColor: isLight ? '#E5DDF2' : 'rgba(255, 255, 255, 0.08)',
              border: isLight ? '1px solid #D8B4FE' : '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              type="button"
              onClick={() => setSide('front')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: side === 'front' ? '#7038F8' : 'transparent',
                color: side === 'front' ? '#FFFFFF' : (isLight ? '#4C1D95' : '#CBD5E1'),
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Eye size={12} />
              <span>Front Design</span>
            </button>
            <button
              type="button"
              onClick={() => setSide('back')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: side === 'back' ? '#7038F8' : 'transparent',
                color: side === 'back' ? '#FFFFFF' : (isLight ? '#4C1D95' : '#CBD5E1'),
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <QrCode size={12} />
              <span>Back (QR & NFC)</span>
            </button>
          </div>

          {/* Quick Details Badges & Export Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: isLight ? 'rgba(107, 0, 255, 0.1)' : 'rgba(168, 85, 247, 0.18)',
                color: isLight ? '#6B00FF' : '#D8B4FE',
                border: isLight ? '1px solid rgba(107, 0, 255, 0.25)' : '1px solid rgba(168, 85, 247, 0.3)',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}
            >
              {editionName} Edition
            </span>
            {hasCustomLogo && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)',
                  color: isLight ? '#065F46' : '#4ADE80',
                  border: isLight ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ImageIcon size={11} />
                <span>Custom Logo</span>
              </span>
            )}
            {(showExport || showControls) && (
              <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '4px' }}>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  title="Export Double-Sided Print PDF (300 DPI with Bleed & Crop Marks)"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: isLight ? '1px solid #7038F8' : '1px solid #905CFC',
                    backgroundColor: isLight ? 'rgba(112, 56, 248, 0.08)' : 'rgba(112, 56, 248, 0.2)',
                    color: isLight ? '#7038F8' : '#D8B4FE',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: isExporting ? 'wait' : 'pointer'
                  }}
                >
                  <Printer size={11} />
                  <span>{isExporting ? 'Exporting...' : 'Print PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadArtwork}
                  disabled={isExporting}
                  title="Download 300 DPI PNG Artwork for Both Sides"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                    color: isLight ? '#475569' : '#CBD5E1',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: isExporting ? 'wait' : 'pointer'
                  }}
                >
                  <Download size={11} />
                  <span>300 DPI PNG</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Rendering Stage */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '14px',
          borderRadius: '16px',
          backgroundColor: isLight ? '#F1EDFA' : '#0B0814',
          border: isLight ? '1px solid #E5DDF2' : '1px solid rgba(112, 56, 248, 0.22)',
          boxShadow: isLight ? '0 4px 20px rgba(107, 0, 255, 0.08)' : '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}
      >
        {enable3D ? (
          <Card3DPreview
            edition={edition}
            templateType={templateType}
            config={config}
            width={width}
            side={side}
            onSideChange={setSide}
            enableTilt={interactive}
            allowFlip={interactive}
          />
        ) : (
          <CardCanvas
            side={side}
            templateType={templateType}
            edition={edition}
            config={config}
            width={width}
          />
        )}
      </div>

      {/* Design Meta Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginTop: '8px',
          fontSize: '0.72rem',
          color: isLight ? '#64748B' : '#94A3B8'
        }}
      >
        <span>Font: <strong style={{ color: isLight ? '#1E1040' : '#FFFFFF' }}>{config.front.fontFamily || 'Space Grotesk'}</strong></span>
        <span>Destination: <strong style={{ color: isLight ? '#6B00FF' : '#C084FC' }}>{config.back.qrUrl}</strong></span>
      </div>
    </div>
  );
}
