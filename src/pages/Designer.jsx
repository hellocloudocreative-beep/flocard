/* ==========================================================================
   FLOCARD INTERACTIVE CARD DESIGNER STUDIO
   Supports Theme 1 (Pages 1–3) & Theme 2 (Pages 4–6), Logo Scaling,
   Color Customization, Admin-Only Studio Background, and 300 DPI Export.
   ========================================================================== */

import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  Eye,
  Download,
  FileCheck,
  Check,
  Sparkles,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Layers,
  QrCode,
  Radio,
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
  ArrowRight,
  ExternalLink,
  Palette,
  Image as ImageIcon,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Lock,
  Plus,
  Minus,
  Type
} from 'lucide-react';
import CardCanvas from '../components/CardCanvas';
import Card3DPreview from '../components/Card3DPreview';
import { EDITIONS, TEMPLATES } from '../lib/constants';
import { exportCardPDF, downloadCanvasPNG } from '../lib/pdfExport';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const FONT_OPTIONS = [
  { id: 'Space Grotesk', name: 'Space Grotesk', style: 'Modern Tech & Bold' },
  { id: 'Sora', name: 'Sora', style: 'Geometric Luxury' },
  { id: 'Inter', name: 'Inter', style: 'Ultra Clean & Minimal' },
  { id: 'Outfit', name: 'Outfit', style: 'Contemporary Editorial' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', style: 'Sleek Corporate' },
  { id: 'Cinzel', name: 'Cinzel', style: 'Regal Roman Classical' },
  { id: 'Playfair Display', name: 'Playfair Display', style: 'Luxury Serif' },
  { id: 'Montserrat', name: 'Montserrat', style: 'Geometric Bold' }
];

export default function Designer() {
  const { user, isAdmin } = useAuth();
  const { saveDesign, designs, studioBackground, updateStudioBackground, resetStudioBg } = useData();

  // URL query params support (e.g. /designer?edition=gold&template=customer_logo)
  const urlParams = new URLSearchParams(window.location.search);
  const initialEdition = urlParams.get('edition') || 'purple';
  const initialTemplate = urlParams.get('template') || 'standard';
  const initialDesignId = urlParams.get('id');

  const existingDesign = initialDesignId ? designs.find(d => d.id === initialDesignId) : null;

  // Active template: 'standard' (Pages 1-3) or 'customer_logo' (Pages 4-6)
  const [templateType, setTemplateType] = useState(
    existingDesign?.templateType || initialTemplate
  );

  // Active color edition: 'purple' | 'gold' | 'platinum'
  const [edition, setEdition] = useState(
    existingDesign?.edition || initialEdition
  );

  const [side, setSide] = useState('front'); // 'front' | 'back'
  const [zoom, setZoom] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [showBleed, setShowBleed] = useState(false);
  const [activeTab, setActiveTab] = useState('fonts'); // 'fonts' | 'identity' | 'logos' | 'nfc' | 'qr'
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [logoWarning, setLogoWarning] = useState(false);
  const [adminBgMessage, setAdminBgMessage] = useState('');

  // Responsive mobile scaling
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const BASE_CARD_WIDTH = 520;
  const BASE_CARD_HEIGHT = Math.round(520 / 1.585); // 328px
  const maxAvailableCardWidth = Math.max(260, Math.min(BASE_CARD_WIDTH, viewportWidth - (viewportWidth < 640 ? 56 : 96)));
  const fitScale = Math.min(1, maxAvailableCardWidth / BASE_CARD_WIDTH);

  // Default color palette for current edition
  const currentEditionDefaults = EDITIONS[edition]?.defaults || {};

  // Custom Colors configuration
  const [customColors, setCustomColors] = useState({
    primaryAccent: existingDesign?.customColors?.primaryAccent || currentEditionDefaults.primaryAccent,
    secondaryAccent: existingDesign?.customColors?.secondaryAccent || currentEditionDefaults.secondaryAccent,
    nameColor: existingDesign?.customColors?.nameColor || currentEditionDefaults.nameColor,
    roleColor: existingDesign?.customColors?.roleColor || currentEditionDefaults.roleColor,
    taglineColor: existingDesign?.customColors?.taglineColor || currentEditionDefaults.taglineColor,
    nfcColor: existingDesign?.customColors?.nfcColor || currentEditionDefaults.nfcColor,
    qrColor: existingDesign?.customColors?.qrColor || currentEditionDefaults.qrColor
  });

  // Customer Logo state (with scale, offset, and badge)
  const [customerLogo, setCustomerLogo] = useState({
    url: existingDesign?.customerLogo?.url || existingDesign?.front?.customLogo || null,
    size: existingDesign?.customerLogo?.size ?? 100, // 50 to 180%
    posX: existingDesign?.customerLogo?.posX ?? 0,
    posY: existingDesign?.customerLogo?.posY ?? 0,
    showCircleBadge: existingDesign?.customerLogo?.showCircleBadge ?? true
  });

  // FLOCARD Logo state (independent scale & position presets)
  const [flocardLogo, setFlocardLogo] = useState({
    size: existingDesign?.flocardLogo?.size ?? 100, // 60 to 150%
    position: existingDesign?.flocardLogo?.position || (templateType === 'customer_logo' ? 'bottom-right' : 'top-left')
  });

  // Front side configuration
  const [frontConfig, setFrontConfig] = useState({
    name: existingDesign?.front?.name || (user?.name || 'AKHIL ANVAR'),
    role: existingDesign?.front?.role || 'CEO & FOUNDER',
    tagline: existingDesign?.front?.tagline || 'One Tap Every Connection',
    showTagline: existingDesign?.front?.showTagline ?? true,
    showNfc: true,
    nfcPosition: existingDesign?.front?.nfcPosition || 'top-right',
    showSubtext: false,
    subtext: 'TAP TO CONNECT',
    fontSize: existingDesign?.front?.fontSize || 'medium',
    alignment: existingDesign?.front?.alignment || 'left',
    fontFamily: existingDesign?.front?.fontFamily || 'Space Grotesk',
    roleFontFamily: existingDesign?.front?.roleFontFamily || 'Inter',
    taglineFontFamily: existingDesign?.front?.taglineFontFamily || 'Inter'
  });

  // Back side configuration
  const [backConfig, setBackConfig] = useState({
    qrUrl: existingDesign?.back?.qrUrl || `https://flocard.in/p/${user?.profileSlug || 'akhil'}`,
    subtext: existingDesign?.back?.subtext || 'SCAN ME',
    showNfcSpecs: existingDesign?.back?.showNfcSpecs ?? true,
    specsText: existingDesign?.back?.specsText || 'NFC | PORTFOLIO | CONTACT | CONNECT',
    brandUrl: existingDesign?.back?.brandUrl || `flocard.in/${user?.profileSlug || 'akhil'}`
  });

  const [designTitle, setDesignTitle] = useState(
    existingDesign?.title || `${TEMPLATES[templateType]?.name} (${EDITIONS[edition]?.name})`
  );
  const [designStatus, setDesignStatus] = useState(existingDesign?.status || 'draft');

  // Hidden export canvases for 300 DPI exports
  const frontExportCanvasRef = useRef(null);
  const backExportCanvasRef = useRef(null);

  // Switch edition: preserves template, logos, text, and updates colors to edition defaults
  const handleEditionChange = (newEdition) => {
    setEdition(newEdition);
    const def = EDITIONS[newEdition]?.defaults || {};
    setCustomColors({
      primaryAccent: def.primaryAccent,
      secondaryAccent: def.secondaryAccent,
      nameColor: def.nameColor,
      roleColor: def.roleColor,
      taglineColor: def.taglineColor,
      nfcColor: def.nfcColor,
      qrColor: def.qrColor
    });
  };

  // Reset colors to active edition defaults
  const handleResetColors = () => {
    const def = EDITIONS[edition]?.defaults || {};
    setCustomColors({
      primaryAccent: def.primaryAccent,
      secondaryAccent: def.secondaryAccent,
      nameColor: def.nameColor,
      roleColor: def.roleColor,
      taglineColor: def.taglineColor,
      nfcColor: def.nfcColor,
      qrColor: def.qrColor
    });
  };

  // Switch template (Standard vs Customer Logo) while preserving all customer info
  const handleTemplateChange = (newTemplate) => {
    setTemplateType(newTemplate);
    if (newTemplate === 'customer_logo') {
      setFlocardLogo(prev => ({ ...prev, position: 'bottom-right' }));
    } else {
      setFlocardLogo(prev => ({ ...prev, position: 'top-left' }));
    }
  };

  // Customer Logo upload with robust validation
  const handleCustomerLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type - support all image MIME types or file extensions
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|svg|webp|gif|bmp|avif)$/i.test(file.name);
    if (!isImage) {
      alert('Please upload a valid image file (PNG, SVG, JPG, or WEBP). Transparent PNG is recommended.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setCustomerLogo(prev => ({ ...prev, url: dataUrl }));
      setFrontConfig(prev => ({ ...prev, customLogo: dataUrl }));
      // Automatically switch to customer logo template and front face so the logo is immediately visible
      setTemplateType('customer_logo');
      setSide('front');
    };
    reader.readAsDataURL(file);
    // Reset file input so re-uploading the same file works
    e.target.value = '';
  };

  // Admin-only studio background upload
  const handleStudioBgUpload = (e) => {
    if (!isAdmin) {
      setAdminBgMessage('Unauthorized: Only administrators can modify the studio environment.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const res = updateStudioBackground(reader.result, user?.role);
      if (res.success) {
        setAdminBgMessage('Studio background updated successfully!');
        setTimeout(() => setAdminBgMessage(''), 3000);
      } else {
        setAdminBgMessage(res.error);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save design to account / data context
  const handleSaveDesign = (submit = false) => {
    const newStatus = submit ? 'submitted' : designStatus;
    const clientName = user?.name || frontConfig.name || 'Valued Client';
    const clientSlug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
    const designObj = {
      id: existingDesign?.id || `des_${Date.now()}`,
      customerId: user?.id || (user?.email ? `cust_${user.email}` : `cust_${Date.now()}`),
      customerName: clientName,
      customerEmail: user?.email || `${clientSlug}@example.com`,
      customerPhone: user?.phone || '+91 98460 12345',
      company: user?.company || frontConfig.company || 'FLOCARD Enterprise',
      title: designTitle,
      templateType,
      edition,
      customColors,
      customerLogo,
      flocardLogo,
      front: frontConfig,
      back: backConfig,
      status: newStatus
    };

    saveDesign(designObj);
    setDesignStatus(newStatus);
    setSaveSuccess(submit ? 'Design submitted for print review!' : 'Design saved to account!');
    setTimeout(() => setSaveSuccess(''), 3500);
  };

  // Export high-res PNG
  const handleExportPNG = (exportSide) => {
    const canvas = exportSide === 'front' ? frontExportCanvasRef.current : backExportCanvasRef.current;
    if (canvas) {
      downloadCanvasPNG(canvas, `${designTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${exportSide}_300dpi.png`);
    }
  };

  // Export print-ready double-sided PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportCardPDF({
        frontCanvas: frontExportCanvasRef.current,
        backCanvas: backExportCanvasRef.current,
        designName: designTitle,
        edition: EDITIONS[edition]?.name
      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Pack combined config for CardCanvas
  const combinedConfig = {
    front: frontConfig,
    back: backConfig,
    customColors,
    customerLogo,
    flocardLogo,
    templateType
  };

  return (
    <div
      className="designer-studio-page"
      style={{
        paddingTop: 'calc(var(--header-height) + 16px)',
        paddingBottom: '80px',
        minHeight: '100vh',
        background: 'var(--bg-main)'
      }}
    >
      <div className="container" style={{ maxWidth: '1440px' }}>
        {/* Top Control Header */}
        <div
          className="designer-top-bar glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
            padding: '16px 20px',
            background: 'rgba(23, 16, 32, 0.85)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="designer-title-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <span className="badge-tag" style={{ flexShrink: 0 }}>
              {TEMPLATES[templateType]?.badge}
            </span>
            <input
              type="text"
              value={designTitle}
              onChange={(e) => setDesignTitle(e.target.value)}
              className="designer-title-input"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border-color)',
                color: '#ffffff',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.1rem',
                outline: 'none',
                padding: '4px 8px',
                flex: 1,
                minWidth: 0,
                width: '100%'
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="designer-action-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {saveSuccess && (
              <span className="designer-save-msg" style={{ fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} /> {saveSuccess}
              </span>
            )}

            <button
              type="button"
              onClick={() => handleSaveDesign(false)}
              className="btn btn-secondary btn-sm designer-btn"
            >
              <Save size={15} />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveDesign(true)}
              className="btn btn-primary btn-sm designer-btn"
            >
              <FileCheck size={15} />
              <span>Submit for Print</span>
            </button>
          </div>
        </div>

        {/* 3-Column Layout: Left Controls | Center Canvas | Right Properties & Export */}
        <div
          className="designer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '350px 1fr 310px',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {/* ==================================================================
              LEFT SIDEBAR: CUSTOMIZATION PANELS
              ================================================================== */}
          <div
            className="designer-left-panel glass-panel"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Template Selector (Theme 1 vs Theme 2) */}
            <div>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                Design Template Layout
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {Object.values(TEMPLATES).map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleTemplateChange(tmpl.id)}
                    style={{
                      background: templateType === tmpl.id ? 'rgba(107, 0, 255, 0.35)' : 'rgba(23, 16, 32, 0.7)',
                      border: templateType === tmpl.id ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 8px',
                      color: templateType === tmpl.id ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>{tmpl.name}</div>
                    <div style={{ fontSize: '0.68rem', color: templateType === tmpl.id ? 'var(--light-lavender)' : 'var(--text-muted)' }}>
                      {tmpl.pdfPages}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Edition Preset Selector (Purple, Gold, Platinum) */}
            <div>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                Color Edition Preset
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {Object.entries(EDITIONS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleEditionChange(key)}
                    style={{
                      background: edition === key ? 'rgba(107, 0, 255, 0.3)' : 'rgba(23, 16, 32, 0.7)',
                      border: edition === key ? `2px solid ${item.accentColor}` : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 4px',
                      color: edition === key ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: item.accentColor,
                        margin: '0 auto 4px',
                        boxShadow: `0 0 8px ${item.accentColor}`
                      }}
                    />
                    {item.name.replace(' Edition', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                background: 'rgba(23, 16, 32, 0.9)',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid var(--border-color)',
                gap: '2px'
              }}
            >
              {[
                { id: 'fonts', label: 'Fonts', icon: Type },
                { id: 'identity', label: 'Text', icon: FileText },
                { id: 'logos', label: 'Logos', icon: ImageIcon },
                { id: 'nfc', label: 'NFC', icon: Radio },
                { id: 'qr', label: 'QR', icon: QrCode }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'qr') setSide('back');
                      else if (tab.id === 'logos' && templateType === 'customer_logo') setSide('front');
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 2px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: active ? 'var(--primary-purple)' : 'transparent',
                      color: active ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: TYPOGRAPHY & FONT SELECTION */}
            {activeTab === 'fonts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                      Name Font Style
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                      {frontConfig.fontFamily}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {FONT_OPTIONS.map(font => {
                      const selected = (frontConfig.fontFamily || 'Space Grotesk') === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setFrontConfig({ ...frontConfig, fontFamily: font.id })}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: selected ? '1.5px solid var(--accent-purple)' : '1px solid var(--border-color)',
                            background: selected ? 'rgba(107, 0, 255, 0.22)' : 'rgba(23, 16, 32, 0.8)',
                            color: '#ffffff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontFamily: `"${font.id}", sans-serif`, fontSize: '0.95rem', fontWeight: 700 }}>
                            {font.name}
                          </span>
                          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                            {font.style}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role / Subtitle Font Selection */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                      Role & Title Font
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                      {frontConfig.roleFontFamily || 'Inter'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {FONT_OPTIONS.map(font => {
                      const selected = (frontConfig.roleFontFamily || 'Inter') === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setFrontConfig({ ...frontConfig, roleFontFamily: font.id })}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: selected ? '1.5px solid var(--accent-purple)' : '1px solid var(--border-color)',
                            background: selected ? 'rgba(107, 0, 255, 0.22)' : 'rgba(23, 16, 32, 0.8)',
                            color: '#ffffff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontFamily: `"${font.id}", sans-serif`, fontSize: '0.86rem', fontWeight: 600 }}>
                            {font.name}
                          </span>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                            {font.style}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tagline Font Selection */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ marginBottom: 0, fontWeight: 700 }}>
                      Tagline / Statement Font
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                      {frontConfig.taglineFontFamily || frontConfig.roleFontFamily || 'Inter'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {FONT_OPTIONS.slice(0, 6).map(font => {
                      const selected = (frontConfig.taglineFontFamily || 'Inter') === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setFrontConfig({ ...frontConfig, taglineFontFamily: font.id })}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: selected ? '1.5px solid var(--accent-purple)' : '1px solid var(--border-color)',
                            background: selected ? 'rgba(107, 0, 255, 0.22)' : 'rgba(23, 16, 32, 0.8)',
                            color: '#ffffff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontFamily: `"${font.id}", sans-serif`, fontSize: '0.82rem', fontWeight: 500 }}>
                            {font.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name Font Size */}
                <div style={{ marginTop: '4px' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Name Size Scale</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['small', 'medium', 'large'].map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFrontConfig({ ...frontConfig, fontSize: size })}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: frontConfig.fontSize === size ? '1.5px solid var(--accent-purple)' : '1px solid var(--border-color)',
                          background: frontConfig.fontSize === size ? 'rgba(107, 0, 255, 0.25)' : 'rgba(23, 16, 32, 0.8)',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          cursor: 'pointer'
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TWO INDEPENDENT LOGOS & SCALING */}
            {activeTab === 'logos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Customer Logo Section */}
                <div style={{ background: 'rgba(23, 16, 32, 0.7)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>Customer Logo (Front)</div>
                    <span style={{ fontSize: '0.68rem', color: templateType === 'customer_logo' ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                      {templateType === 'customer_logo' ? 'Theme 2 Center Badge' : 'Theme 1 Header Logo'}
                    </span>
                  </div>

                  {/* Logo thumbnail preview if uploaded */}
                  {customerLogo.url && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: customerLogo.showCircleBadge ? '50%' : '6px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          background: 'rgba(0, 0, 0, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        <img
                          src={customerLogo.url}
                          alt="Customer logo preview"
                          style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 600 }}>Active Logo</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Displayed on card front</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerLogo(prev => ({ ...prev, url: null }));
                          setFrontConfig(prev => ({ ...prev, customLogo: null }));
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <label className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.75rem', cursor: 'pointer', justifyContent: 'center' }}>
                      <Upload size={13} />
                      <span>{customerLogo.url ? 'Replace Logo' : 'Upload Customer Logo'}</span>
                      <input type="file" accept="image/*" onChange={handleCustomerLogoUpload} style={{ display: 'none' }} />
                    </label>
                  </div>

                  {/* Template Style Switcher */}
                  <div style={{ marginBottom: '14px', background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Display Layout:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateType('customer_logo');
                          setSide('front');
                        }}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: templateType === 'customer_logo' ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                          background: templateType === 'customer_logo' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                          color: templateType === 'customer_logo' ? '#ffffff' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Center Badge (Theme 2)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateType('standard');
                          setSide('front');
                        }}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: templateType === 'standard' ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                          background: templateType === 'standard' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                          color: templateType === 'standard' ? '#ffffff' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Top-Left (Theme 1)
                      </button>
                    </div>
                  </div>

                  {/* Size slider & buttons */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>Logo Scale:</span>
                      <strong>{customerLogo.size}%</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setCustomerLogo(p => ({ ...p, size: Math.max(40, p.size - 5) }))}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '26px', height: '26px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        type="range"
                        min="40"
                        max="180"
                        value={customerLogo.size}
                        onChange={(e) => setCustomerLogo(p => ({ ...p, size: Number(e.target.value) }))}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => setCustomerLogo(p => ({ ...p, size: Math.min(180, p.size + 5) }))}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '26px', height: '26px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerLogo(p => ({ ...p, size: 100, posX: 0, posY: 0 }))}
                        title="Reset size to 100%"
                        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--light-lavender)', fontSize: '0.7rem', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        100%
                      </button>
                    </div>
                  </div>

                  {/* Position offset controls */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Offset X ({customerLogo.posX}px)</div>
                      <input
                        type="range"
                        min="-60"
                        max="60"
                        value={customerLogo.posX}
                        onChange={(e) => setCustomerLogo(p => ({ ...p, posX: Number(e.target.value) }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Offset Y ({customerLogo.posY}px)</div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        value={customerLogo.posY}
                        onChange={(e) => setCustomerLogo(p => ({ ...p, posY: Number(e.target.value) }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Circular badge toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Circular Badge Outline</span>
                    <input
                      type="checkbox"
                      checked={customerLogo.showCircleBadge}
                      onChange={(e) => setCustomerLogo(p => ({ ...p, showCircleBadge: e.target.checked }))}
                    />
                  </div>
                </div>

                {/* 2. Official FLOCARD Logo Section - NON-EDITABLE */}
                <div style={{ background: 'rgba(23, 16, 32, 0.7)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={12} style={{ color: 'var(--accent-purple)' }} />
                      <span>Official FLOCARD Logo</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                      Non-Editable
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    The FLOCARD brand emblem is a protected trademark. Canonical dimensions and positioning are locked on the card back according to brand design specifications.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: IDENTITY & TYPOGRAPHY */}
            {activeTab === 'identity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Full Name</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Font: <strong style={{ color: 'var(--accent-purple)' }}>{frontConfig.fontFamily}</strong></span>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={frontConfig.name}
                    onChange={(e) => setFrontConfig({ ...frontConfig, name: e.target.value })}
                    placeholder="e.g. AKHIL ANVAR"
                    style={{ marginBottom: '6px' }}
                  />
                  <select
                    className="form-input"
                    value={frontConfig.fontFamily || 'Space Grotesk'}
                    onChange={(e) => setFrontConfig({ ...frontConfig, fontFamily: e.target.value })}
                    style={{ fontSize: '0.78rem', padding: '6px 10px', height: 'auto', background: 'rgba(23, 16, 32, 0.9)' }}
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.style})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Title / Role</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Font: <strong style={{ color: 'var(--accent-purple)' }}>{frontConfig.roleFontFamily || 'Inter'}</strong></span>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={frontConfig.role}
                    onChange={(e) => setFrontConfig({ ...frontConfig, role: e.target.value })}
                    placeholder="e.g. CEO & FOUNDER"
                    style={{ marginBottom: '6px' }}
                  />
                  <select
                    className="form-input"
                    value={frontConfig.roleFontFamily || 'Inter'}
                    onChange={(e) => setFrontConfig({ ...frontConfig, roleFontFamily: e.target.value })}
                    style={{ fontSize: '0.78rem', padding: '6px 10px', height: 'auto', background: 'rgba(23, 16, 32, 0.9)' }}
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.style})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Tagline</label>
                    <input
                      type="checkbox"
                      checked={frontConfig.showTagline}
                      onChange={(e) => setFrontConfig({ ...frontConfig, showTagline: e.target.checked })}
                    />
                  </div>
                  {frontConfig.showTagline && (
                    <>
                      <input
                        type="text"
                        className="form-input"
                        value={frontConfig.tagline}
                        onChange={(e) => setFrontConfig({ ...frontConfig, tagline: e.target.value })}
                        placeholder="One Tap Every Connection"
                        style={{ marginBottom: '6px' }}
                      />
                      <select
                        className="form-input"
                        value={frontConfig.taglineFontFamily || 'Inter'}
                        onChange={(e) => setFrontConfig({ ...frontConfig, taglineFontFamily: e.target.value })}
                        style={{ fontSize: '0.78rem', padding: '6px 10px', height: 'auto', background: 'rgba(23, 16, 32, 0.9)' }}
                      >
                        {FONT_OPTIONS.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.style})</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                {/* Typography Size */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Name Font Size</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['small', 'medium', 'large'].map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFrontConfig({ ...frontConfig, fontSize: size })}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '6px',
                          border: frontConfig.fontSize === size ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                          background: frontConfig.fontSize === size ? 'rgba(107, 0, 255, 0.25)' : 'rgba(23, 16, 32, 0.8)',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          textTransform: 'capitalize',
                          cursor: 'pointer'
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: NFC CONTROLS */}
            {activeTab === 'nfc' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(107, 0, 255, 0.1)',
                    border: '1px solid rgba(107, 0, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: 'rgba(107, 0, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-purple)'
                    }}
                  >
                    <Radio size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                      NFC Antenna Hardware
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      High-Capacity NTAG216 Chip &bull; 13.56 MHz ISO 14443A
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  The authentic <strong style={{ color: '#fff' }}>FLOCARD NFC Wave symbol</strong> is permanently embedded at standard card tap coordinates for instant recognition and 100% reliable contactless scanning.
                </div>

                <div
                  style={{
                    background: 'rgba(23, 16, 32, 0.7)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.74rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Antenna Status</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>Active & Encoded</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Target URL</span>
                    <span style={{ color: 'var(--accent-purple)', fontWeight: 500 }}>{backConfig.qrUrl}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Compatibility</span>
                    <span style={{ color: '#ffffff' }}>iOS 13+ & Android (No App Required)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BACK & QR CODE CONTROLS */}
            {activeTab === 'qr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Destination Profile URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={backConfig.qrUrl}
                    onChange={(e) => setBackConfig({ ...backConfig, qrUrl: e.target.value })}
                    placeholder="https://flocard.in/p/akhil"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Display Brand URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={backConfig.brandUrl}
                    onChange={(e) => setBackConfig({ ...backConfig, brandUrl: e.target.value })}
                    placeholder="flocard.in/akhil"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ==================================================================
              CENTER CANVAS: REAL-TIME INTERACTIVE VIEW
              ================================================================== */}
          <div
            className="designer-canvas-center glass-panel"
            style={{
              padding: '36px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '540px',
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(8, 6, 13, 0.45), #08060d), url(${studioBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* View Controls Toolbar */}
            <div
              className="canvas-view-toolbar"
              style={{
                position: 'absolute',
                top: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(23, 16, 32, 0.95)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 14px',
                zIndex: 20
              }}
            >
              {/* Flip Switch */}
              <button
                type="button"
                onClick={() => setSide(side === 'front' ? 'back' : 'front')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--light-lavender)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                <RotateCw size={14} />
                <span>Showing: {side.toUpperCase()}</span>
              </button>

              <div className="toolbar-divider" style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />

              {/* Safe Area Guides Toggle */}
              <button
                type="button"
                onClick={() => setShowGuides(!showGuides)}
                style={{
                  background: showGuides ? 'rgba(107, 0, 255, 0.3)' : 'transparent',
                  border: 'none',
                  color: showGuides ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Safe Area Guides
              </button>

              {/* Trim Bleed Toggle */}
              <button
                type="button"
                onClick={() => setShowBleed(!showBleed)}
                style={{
                  background: showBleed ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                  border: 'none',
                  color: showBleed ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Bleed Trim (3mm)
              </button>
            </div>

            {/* Logo Exceeding Safe Area Warning Banner */}
            {logoWarning && (
              <div
                style={{
                  position: 'absolute',
                  top: '64px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 20,
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                <AlertTriangle size={14} />
                <span>Logo extends beyond the 3mm safe printable area. Adjust size or offset.</span>
              </div>
            )}

            {/* The Live Interactive Card Canvas - Responsively Scaled */}
            <div
              className="designer-canvas-viewport-box"
              style={{
                width: `${Math.round(BASE_CARD_WIDTH * fitScale)}px`,
                height: `${Math.round(BASE_CARD_HEIGHT * fitScale)}px`,
                position: 'relative',
                margin: viewportWidth < 640 ? '24px auto 28px' : '40px auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '100%'
              }}
            >
              <div
                style={{
                  width: `${BASE_CARD_WIDTH}px`,
                  height: `${BASE_CARD_HEIGHT}px`,
                  transform: `scale(${fitScale * zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0
                }}
              >
                <Card3DPreview
                  side={side}
                  onSideChange={setSide}
                  templateType={templateType}
                  edition={edition}
                  config={combinedConfig}
                  showGuides={showGuides}
                  showBleed={showBleed}
                  width={BASE_CARD_WIDTH}
                  onLogoWarningChange={setLogoWarning}
                />
              </div>
            </div>

            {/* Bottom Dimensions & Aspect Ratio Spec Indicator */}
            <div
              className="canvas-spec-bar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '10px'
              }}
            >
              <span>{TEMPLATES[templateType]?.name}</span>
              <span className="spec-dot">&bull;</span>
              <span>CR80 ISO/IEC 7810 ID-1 (85.60 &times; 53.98 mm)</span>
              <span className="spec-dot">&bull;</span>
              <span>Corner Radius: 3.18mm</span>
            </div>
          </div>

          {/* ==================================================================
              RIGHT SIDEBAR: EXPORTS, STATUS & ADMIN STUDIO BG
              ================================================================== */}
          <div
            className="designer-right-panel glass-panel"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            {/* Status Card */}
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
                Design Status
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: designStatus === 'approved'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : designStatus === 'submitted' || designStatus === 'in_review'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(23, 16, 32, 0.8)',
                  border: '1px solid var(--border-color)',
                  color: designStatus === 'approved' ? '#34d399' : designStatus === 'submitted' ? '#fbbf24' : '#ffffff'
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: designStatus === 'approved' ? '#10b981' : designStatus === 'submitted' ? '#f59e0b' : '#94a3b8'
                  }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {designStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* High-Resolution Artwork Exports - ADMIN ONLY */}
            {isAdmin && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Industrial Artwork Export
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-purple)', fontWeight: 700 }}>Admin Only</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleExportPNG('front')}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <Download size={14} />
                    <span>Download Front (300 DPI PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportPNG('back')}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <Download size={14} />
                    <span>Download Back (300 DPI PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <FileCheck size={14} />
                    <span>{isExporting ? 'Generating PDF...' : 'Export Print-Ready PDF'}</span>
                  </button>
                </div>

                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                  Generates vector double-sided PDF with standard 3mm bleed margin and trim crop marks suitable for industrial printers.
                </p>
              </div>
            )}

            {/* Admin-Only Studio Background Control */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Studio Environment
                </div>
                {isAdmin ? (
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-purple)', fontWeight: 700 }}>Admin Access</span>
                ) : (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Lock size={10} /> Locked
                  </span>
                )}
              </div>

              {isAdmin ? (
                <div>
                  <label className="btn btn-secondary btn-sm" style={{ width: '100%', cursor: 'pointer', fontSize: '0.75rem', justifyContent: 'center' }}>
                    <Upload size={13} />
                    <span>Upload Global Studio BG</span>
                    <input type="file" accept="image/*" onChange={handleStudioBgUpload} style={{ display: 'none' }} />
                  </label>

                  <button
                    type="button"
                    onClick={() => resetStudioBg(user?.role)}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', marginTop: '6px', fontSize: '0.72rem' }}
                  >
                    Reset Studio Background
                  </button>

                  {adminBgMessage && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: '6px' }}>
                      {adminBgMessage}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Permanent studio ambiance is configured globally by platform administrators.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Master Renderers for Front & Back 300 DPI Generation */}
        <div style={{ display: 'none' }}>
          <CardCanvas
            side="front"
            templateType={templateType}
            edition={edition}
            config={combinedConfig}
            canvasRef={frontExportCanvasRef}
          />
          <CardCanvas
            side="back"
            templateType={templateType}
            edition={edition}
            config={combinedConfig}
            canvasRef={backExportCanvasRef}
          />
        </div>
      </div>

      {/* Responsive layout styles for mobile/tablet */}
      <style>{`
        @media (max-width: 1080px) {
          .designer-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .designer-canvas-center {
            order: -1;
          }
        }
        @media (max-width: 640px) {
          .designer-studio-page {
            padding-top: calc(var(--header-height) + 8px) !important;
            padding-bottom: 40px !important;
          }
          .designer-studio-page .container {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          .designer-top-bar {
            padding: 12px 14px !important;
            gap: 12px !important;
          }
          .designer-title-row {
            width: 100% !important;
            gap: 8px !important;
          }
          .badge-tag {
            font-size: 0.65rem !important;
            padding: 2px 8px !important;
          }
          .designer-title-input {
            font-size: 0.95rem !important;
            min-width: 0 !important;
          }
          .designer-action-group {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .designer-save-msg {
            grid-column: span 2;
            text-align: center;
            justify-content: center;
          }
          .designer-btn {
            width: 100% !important;
            min-height: 40px !important;
            padding: 8px 10px !important;
            font-size: 0.78rem !important;
            justify-content: center !important;
          }
          .canvas-view-toolbar {
            position: relative !important;
            top: auto !important;
            margin: 0 auto 10px auto !important;
            padding: 4px 8px !important;
            gap: 6px !important;
            max-width: 100% !important;
            width: auto !important;
            justify-content: center !important;
          }
          .canvas-view-toolbar button {
            font-size: 0.7rem !important;
            padding: 4px 6px !important;
          }
          .designer-canvas-center {
            padding: 16px 8px 24px !important;
            min-height: auto !important;
          }
          .canvas-spec-bar {
            flex-direction: column !important;
            gap: 4px !important;
            font-size: 0.68rem !important;
            text-align: center !important;
            margin-top: 6px !important;
          }
          .canvas-spec-bar .spec-dot {
            display: none !important;
          }
          .designer-left-panel,
          .designer-right-panel {
            padding: 16px 12px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
