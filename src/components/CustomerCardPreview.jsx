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
import {
  Eye,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Type,
  Image as ImageIcon,
  Download,
  Printer,
  Edit3,
  Sparkles,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { EDITIONS } from '../lib/constants';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { exportCardPDF, downloadBothSides, generateCardPrintPDF, renderAuthoritativeCardCanvas, generateIsolatedLogoAsset, downloadArtworkFile } from '../lib/pdfExport';
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
  isAdmin: forcedIsAdmin = null,
  className = ''
}) {
  let contextDesigns = [];
  try {
    const data = useData();
    if (data && Array.isArray(data.designs)) contextDesigns = data.designs;
  } catch {
    // If rendered outside DataProvider
  }

  let authUser = null;
  let authIsAdmin = false;
  try {
    const auth = useAuth();
    authUser = auth?.user;
    authIsAdmin = Boolean(auth?.isAdmin);
  } catch {
    // If rendered outside AuthProvider
  }

  const effectiveIsAdmin = forcedIsAdmin !== null ? Boolean(forcedIsAdmin) : authIsAdmin;

  const hasEditedVersion = Boolean(order?.editedDesign);
  const isApprovedAdminEdited = Boolean(order?.approvedVersion === 'admin_edited' && order?.editedDesign);

  // Version view state:
  // Admin: 'original' | 'admin_print' | 'edited'
  // Customer: 'approved' | 'original'
  const [versionView, setVersionView] = useState(() => {
    if (effectiveIsAdmin) return 'original';
    if (isApprovedAdminEdited) return 'approved';
    return 'original';
  });

  const activeFallbackDesigns = fallbackDesigns && fallbackDesigns.length > 0 ? fallbackDesigns : contextDesigns;
  const [side, setSide] = useState('front');
  const [isExporting, setIsExporting] = useState(false);

  // Hidden 300 DPI Export Canvases
  const frontCanvasRef = useRef(null);
  const backCanvasRef = useRef(null);

  // Resolve target design based on versionView
  const targetDesignRecord = useMemo(() => {
    if (!order) return design;
    if (versionView === 'original') {
      return order.originalDesign || order.design || order;
    }
    if (versionView === 'edited' || versionView === 'approved') {
      return order.editedDesign || order.design || order;
    }
    if (versionView === 'admin_print') {
      return order.editedDesign || order.originalDesign || order.design || order;
    }
    return order.design || order;
  }, [order, design, versionView]);

  const isAdminPrintMode = versionView === 'admin_print';

  const { edition, templateType, isLegacyFallback, config } = useMemo(() => {
    return normalizeCardDesign(targetDesignRecord, activeFallbackDesigns);
  }, [targetDesignRecord, activeFallbackDesigns]);

  const editionName = EDITIONS[edition]?.name || edition.toUpperCase();
  const hasCustomLogo = Boolean(config.customerLogo?.url);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Authoritative prepress export: generates directly from design data with CR80 dimensions & bleed
      await generateCardPrintPDF(targetDesignRecord, {
        mode: 'dual',
        withBleed: true,
        download: true,
        adminPrintMode: isAdminPrintMode
      });
    } catch (e) {
      console.error('PDF export error:', e);
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
      if (!front || typeof front.toDataURL !== 'function' || isAdminPrintMode) {
        front = await renderAuthoritativeCardCanvas(targetDesignRecord, 'front', {
          withBleed: false,
          adminPrintMode: isAdminPrintMode
        });
      }
      if (!back || typeof back.toDataURL !== 'function' || isAdminPrintMode) {
        back = await renderAuthoritativeCardCanvas(targetDesignRecord, 'back', {
          withBleed: false,
          adminPrintMode: isAdminPrintMode
        });
      }

      await downloadBothSides({
        frontCanvas: front,
        backCanvas: back,
        designName: config.front?.name ? `${config.front.name}-FLOCARD` : 'FLOCARD-Card',
        editionName: isAdminPrintMode ? `${editionName} (White & Black Print)` : editionName
      });
    } catch (e) {
      console.error('Artwork download error:', e);
      alert('Unable to export artwork files.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTransparentLogo = async () => {
    try {
      const res = await generateIsolatedLogoAsset(targetDesignRecord, { format: 'transparent_png' });
      if (res.success && res.dataUrl) {
        downloadArtworkFile(res.dataUrl, res.fileName);
      }
    } catch (e) {
      console.warn('Failed to download transparent logo:', e);
    }
  };

  const handleDownloadOriginalLogo = async () => {
    try {
      const res = await generateIsolatedLogoAsset(targetDesignRecord, { format: 'original' });
      if (res.success && res.dataUrl) {
        downloadArtworkFile(res.dataUrl, res.fileName);
      }
    } catch (e) {
      console.warn('Failed to download original logo:', e);
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
          adminPrintMode={isAdminPrintMode}
        />
        <CardCanvas
          side="back"
          templateType={templateType}
          edition={edition}
          config={config}
          canvasRef={backCanvasRef}
          width={1080}
          adminPrintMode={isAdminPrintMode}
        />
      </div>

      {/* Admin Version Selector & Edit Button */}
      {effectiveIsAdmin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '10px',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '3px',
              borderRadius: '8px',
              backgroundColor: isLight ? '#E5DDF2' : 'rgba(255, 255, 255, 0.06)',
              border: isLight ? '1px solid #D8B4FE' : '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              type="button"
              onClick={() => setVersionView('original')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: versionView === 'original' ? '#7038F8' : 'transparent',
                color: versionView === 'original' ? '#FFFFFF' : (isLight ? '#4C1D95' : '#CBD5E1'),
                fontSize: '0.73rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Original Customer Design
            </button>
            <button
              type="button"
              onClick={() => setVersionView('admin_print')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: versionView === 'admin_print' ? '#7038F8' : 'transparent',
                color: versionView === 'admin_print' ? '#FFFFFF' : (isLight ? '#4C1D95' : '#CBD5E1'),
                fontSize: '0.73rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Admin Print Version (White & Black)
            </button>
            {hasEditedVersion && (
              <button
                type="button"
                onClick={() => setVersionView('edited')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: versionView === 'edited' ? '#7038F8' : 'transparent',
                  color: versionView === 'edited' ? '#FFFFFF' : (isLight ? '#4C1D95' : '#CBD5E1'),
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Admin Edited Artwork
              </button>
            )}
          </div>

          {(order?.id || order?.orderReference) && (
            <a
              href={`/designer?orderId=${order.id || order.orderReference}&mode=admin_edit`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '8px',
                backgroundColor: '#7038F8',
                color: '#FFFFFF',
                fontSize: '0.74rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(112, 56, 248, 0.3)'
              }}
            >
              <Edit3 size={13} />
              <span>Edit Design</span>
            </a>
          )}
        </div>
      )}

      {/* Customer Dashboard Update Banner */}
      {!effectiveIsAdmin && isApprovedAdminEdited && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '10px',
            backgroundColor: isLight ? 'rgba(112, 56, 248, 0.08)' : 'rgba(112, 56, 248, 0.15)',
            border: isLight ? '1px solid #D8B4FE' : '1px solid rgba(168, 85, 247, 0.3)',
            color: isLight ? '#6B00FF' : '#D8B4FE',
            fontSize: '0.76rem',
            fontWeight: 600,
            marginBottom: '10px',
            boxSizing: 'border-box',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={15} style={{ flexShrink: 0 }} />
            <span>Artwork updated by FLOCARDS design team</span>
          </div>
          <div style={{ display: 'inline-flex', padding: '2px', borderRadius: '6px', backgroundColor: isLight ? '#E5DDF2' : 'rgba(0, 0, 0, 0.25)' }}>
            <button
              type="button"
              onClick={() => setVersionView('approved')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: versionView === 'approved' ? '#7038F8' : 'transparent',
                color: versionView === 'approved' ? '#FFFFFF' : (isLight ? '#4C1D95' : '#CBD5E1'),
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Approved Version
            </button>
            <button
              type="button"
              onClick={() => setVersionView('original')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: versionView === 'original' ? '#7038F8' : 'transparent',
                color: versionView === 'original' ? '#FFFFFF' : (isLight ? '#4C1D95' : '#CBD5E1'),
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Original Submission
            </button>
          </div>
        </div>
      )}

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
                {hasCustomLogo && (
                  <button
                    type="button"
                    onClick={handleDownloadTransparentLogo}
                    disabled={isExporting}
                    title="Download Transparent Logo PNG (Alpha Channel)"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: isLight ? '1px solid #BBF7D0' : '1px solid rgba(34, 197, 94, 0.3)',
                      backgroundColor: isLight ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)',
                      color: isLight ? '#15803D' : '#4ADE80',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: isExporting ? 'wait' : 'pointer'
                    }}
                  >
                    <Sparkles size={11} />
                    <span>Logo PNG</span>
                  </button>
                )}
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
            adminPrintMode={isAdminPrintMode}
          />
        ) : (
          <CardCanvas
            side={side}
            templateType={templateType}
            edition={edition}
            config={config}
            width={width}
            adminPrintMode={isAdminPrintMode}
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
