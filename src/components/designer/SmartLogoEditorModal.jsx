/* ==========================================================================
   FLOCARDS SMART LOGO EDITOR & AI BACKGROUND REMOVAL MODAL
   Complete interactive studio for automatic logo background removal,
   manual touch-up brushes (Erase & Restore), multi-background preview,
   geometric transforms (crop, scale, rotation, offset), and separate downloads.
   ========================================================================== */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Sparkles,
  Eraser,
  Paintbrush,
  Undo2,
  Redo2,
  Crop,
  RotateCcw,
  RotateCw,
  Sliders,
  Eye,
  Download,
  Check,
  RefreshCw,
  AlertTriangle,
  Move,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { removeLogoBackground, trimCanvasTransparentMargins } from '../../lib/cardArtworkService';
import { downloadArtworkFile } from '../../lib/pdfExport';

export default function SmartLogoEditorModal({
  isOpen,
  onClose,
  customerLogo,
  onApplyLogo,
  onDownloadCardArtwork = null,
  isLight = false,
  cardEdition = 'purple'
}) {
  if (!isOpen) return null;

  // Active Tool & Mode States
  const [activeTab, setActiveTab] = useState('auto_bg'); // 'auto_bg' | 'manual_brush' | 'transform' | 'download'
  const [viewMode, setViewMode] = useState('transparent'); // 'transparent' | 'original' | 'compare'
  const [previewBg, setPreviewBg] = useState('checkerboard'); // 'checkerboard' | '#FFFFFF' | '#000000' | '#F1F5F9' | '#6B004F' | 'custom'
  const [customBgColor, setCustomBgColor] = useState('#2A0845');

  // AI Background Removal Parameters
  const [tolerance, setTolerance] = useState(36);
  const [feather, setFeather] = useState(16);
  const [useFloodFill, setUseFloodFill] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('idle'); // 'idle' | 'processing' | 'success' | 'already_transparent' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Geometry & Transforms
  const [size, setSize] = useState(customerLogo?.size ?? 100);
  const [rotation, setRotation] = useState(customerLogo?.rotation ?? 0);
  const [posX, setPosX] = useState(customerLogo?.posX ?? 0);
  const [posY, setPosY] = useState(customerLogo?.posY ?? 0);
  const [showCircleBadge, setShowCircleBadge] = useState(customerLogo?.showCircleBadge ?? true);

  // Manual Brush Tool States
  const [activeBrush, setActiveBrush] = useState('erase'); // 'erase' | 'restore'
  const [brushSize, setBrushSize] = useState(24); // 4px to 80px
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, visible: false });

  // Canvases & History
  const editCanvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [previewDataUrl, setPreviewDataUrl] = useState(customerLogo?.url || '');
  const [originalDataUrl, setOriginalDataUrl] = useState(customerLogo?.originalUrl || customerLogo?.url || '');

  // Keep a stable ref to source image
  const originalImageObjRef = useRef(null);

  // 1. Initialize or Reload Source Images
  useEffect(() => {
    let isCancelled = false;
    const sourceUrl = customerLogo?.originalUrl || customerLogo?.url;
    if (!sourceUrl) return;

    setOriginalDataUrl(sourceUrl);
    setPreviewDataUrl(customerLogo?.transparentUrl || customerLogo?.url || sourceUrl);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sourceUrl;
    img.onload = () => {
      if (isCancelled) return;
      originalImageObjRef.current = img;

      // Draw onto hidden originalCanvas
      const origCanvas = originalCanvasRef.current;
      if (origCanvas) {
        origCanvas.width = img.naturalWidth || img.width || 400;
        origCanvas.height = img.naturalHeight || img.height || 400;
        const oCtx = origCanvas.getContext('2d');
        oCtx.clearRect(0, 0, origCanvas.width, origCanvas.height);
        oCtx.drawImage(img, 0, 0);
      }

      // If we already have a transparentUrl that differs from originalUrl, load it onto editCanvas
      if (customerLogo?.transparentUrl && customerLogo.transparentUrl !== sourceUrl) {
        const transImg = new Image();
        transImg.crossOrigin = 'anonymous';
        transImg.src = customerLogo.transparentUrl;
        transImg.onload = () => {
          if (isCancelled) return;
          loadIntoEditCanvas(transImg);
          setProcessStatus('success');
        };
      } else {
        // Run auto background removal
        runAutoBgRemoval(img, tolerance, feather, useFloodFill);
      }
    };

    return () => {
      isCancelled = true;
    };
  }, [customerLogo?.url, customerLogo?.originalUrl]);

  // Load an image onto edit canvas and initialize history
  const loadIntoEditCanvas = (imgOrCanvas) => {
    const editCanvas = editCanvasRef.current;
    if (!editCanvas) return;
    const w = imgOrCanvas.naturalWidth || imgOrCanvas.width || 400;
    const h = imgOrCanvas.naturalHeight || imgOrCanvas.height || 400;
    editCanvas.width = w;
    editCanvas.height = h;
    const ctx = editCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(imgOrCanvas, 0, 0);

    const dataUrl = editCanvas.toDataURL('image/png', 1.0);
    setPreviewDataUrl(dataUrl);
    setHistory([dataUrl]);
    setHistoryIndex(0);
  };

  // Run AI / Color-key Background Removal
  const runAutoBgRemoval = async (sourceImg = null, tol = tolerance, feath = feather, flood = useFloodFill) => {
    const img = sourceImg || originalImageObjRef.current;
    if (!img) return;

    setIsProcessing(true);
    setProcessStatus('processing');
    setErrorMessage('');

    try {
      const res = await removeLogoBackground(img, {
        tolerance: tol,
        feather: feath,
        floodFill: flood,
        forceOpaqueRemoval: true
      });

      if (!res || !res.canvas) {
        throw new Error('Background removal failed to generate canvas.');
      }

      loadIntoEditCanvas(res.canvas);
      setProcessStatus(res.alreadyTransparent ? 'already_transparent' : 'success');
    } catch (err) {
      console.error('[SmartLogoEditor] Background removal error:', err);
      setErrorMessage(err.message || 'Could not automatically isolate background.');
      setProcessStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trim empty transparent padding
  const handleAutoTrimMargins = () => {
    const editCanvas = editCanvasRef.current;
    if (!editCanvas) return;
    try {
      const trimmed = trimCanvasTransparentMargins(editCanvas);
      if (trimmed) {
        loadIntoEditCanvas(trimmed);
      }
    } catch (err) {
      console.warn('[SmartLogoEditor] Auto-trim error:', err);
    }
  };

  // Push new state to undo/redo history
  const pushHistorySnapshot = () => {
    const editCanvas = editCanvasRef.current;
    if (!editCanvas) return;
    const dataUrl = editCanvas.toDataURL('image/png', 1.0);
    setPreviewDataUrl(dataUrl);

    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      if (updated.length >= 25) updated.shift();
      return [...updated, dataUrl];
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 24));
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    const targetSnapshot = history[newIdx];
    if (!targetSnapshot) return;

    const img = new Image();
    img.onload = () => {
      const editCanvas = editCanvasRef.current;
      if (!editCanvas) return;
      const ctx = editCanvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, editCanvas.width, editCanvas.height);
      ctx.drawImage(img, 0, 0);
      setPreviewDataUrl(targetSnapshot);
      setHistoryIndex(newIdx);
    };
    img.src = targetSnapshot;
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    const targetSnapshot = history[newIdx];
    if (!targetSnapshot) return;

    const img = new Image();
    img.onload = () => {
      const editCanvas = editCanvasRef.current;
      if (!editCanvas) return;
      const ctx = editCanvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, editCanvas.width, editCanvas.height);
      ctx.drawImage(img, 0, 0);
      setPreviewDataUrl(targetSnapshot);
      setHistoryIndex(newIdx);
    };
    img.src = targetSnapshot;
  };

  // Reset to unmodified original
  const handleResetToOriginal = () => {
    const origCanvas = originalCanvasRef.current;
    if (!origCanvas) return;
    loadIntoEditCanvas(origCanvas);
    setProcessStatus('idle');
    setSize(100);
    setRotation(0);
    setPosX(0);
    setPosY(0);
  };

  // Helper to map client coordinates to canvas internal coordinates
  const getCanvasCoords = (e) => {
    const canvas = editCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      viewportX: clientX - rect.left,
      viewportY: clientY - rect.top
    };
  };

  // Draw Stroke (Erase or Restore)
  const drawStroke = (x, y) => {
    const editCanvas = editCanvasRef.current;
    const origCanvas = originalCanvasRef.current;
    if (!editCanvas || !origCanvas) return;
    const ctx = editCanvas.getContext('2d', { willReadFrequently: true });

    // Brush radius scaled to canvas dimension
    const scaleFactor = editCanvas.width / (editCanvas.clientWidth || editCanvas.width);
    const radius = Math.max(2, brushSize * 0.5 * scaleFactor);

    if (activeBrush === 'erase') {
      // Erase: clear to transparent
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (activeBrush === 'restore') {
      // Restore: copy pixels from originalCanvas
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(origCanvas, 0, 0, editCanvas.width, editCanvas.height);
      ctx.restore();
    }
  };

  const handlePointerDown = (e) => {
    if (activeTab !== 'manual_brush' || viewMode !== 'transparent') return;
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    drawStroke(coords.x, coords.y);
  };

  const handlePointerMove = (e) => {
    const coords = getCanvasCoords(e);
    setCursorPos({ x: coords.viewportX, y: coords.viewportY, visible: true });
    if (!isDrawing || activeTab !== 'manual_brush' || viewMode !== 'transparent') return;
    drawStroke(coords.x, coords.y);
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      pushHistorySnapshot();
    }
  };

  const handlePointerLeave = () => {
    setCursorPos((prev) => ({ ...prev, visible: false }));
    if (isDrawing) {
      setIsDrawing(false);
      pushHistorySnapshot();
    }
  };

  // Downloads
  const handleDownloadTransparent = () => {
    const dataUrl = previewDataUrl || customerLogo?.transparentUrl || customerLogo?.url;
    if (!dataUrl) return;
    downloadArtworkFile(dataUrl, 'FLOCARD_Logo_Transparent_300DPI.png');
  };

  const handleDownloadOriginal = () => {
    const dataUrl = originalDataUrl || customerLogo?.originalUrl || customerLogo?.url;
    if (!dataUrl) return;
    downloadArtworkFile(dataUrl, 'FLOCARD_Logo_Original_Upload.png');
  };

  // Apply to Card Designer
  const handleApply = () => {
    const finalTransparentUrl = previewDataUrl || customerLogo?.transparentUrl || customerLogo?.url;
    onApplyLogo({
      url: finalTransparentUrl,
      originalUrl: originalDataUrl,
      transparentUrl: finalTransparentUrl,
      size,
      rotation,
      posX,
      posY,
      showCircleBadge
    });
    onClose();
  };

  // Resolve background style for the preview canvas wrapper
  const resolveStageBackground = () => {
    if (previewBg === 'checkerboard') {
      return {
        backgroundImage: `
          linear-gradient(45deg, #1f182c 25%, transparent 25%),
          linear-gradient(-45deg, #1f182c 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #1f182c 75%),
          linear-gradient(-45deg, transparent 75%, #1f182c 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        backgroundColor: '#120c1d'
      };
    }
    if (previewBg === 'custom') {
      return { backgroundColor: customBgColor };
    }
    return { backgroundColor: previewBg };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 3, 10, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onMouseUp={handlePointerUp}
      onTouchEnd={handlePointerUp}
    >
      <div
        style={{
          backgroundColor: isLight ? '#FFFFFF' : '#100B1A',
          border: isLight ? '1px solid rgba(112, 56, 248, 0.25)' : '1px solid rgba(168, 85, 247, 0.28)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '1120px',
          height: '92vh',
          maxHeight: '840px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(107, 0, 255, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* =================================================================
            1. MODAL HEADER
            ================================================================= */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: isLight ? '1px solid rgba(112, 56, 248, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isLight ? '#F9F8FD' : '#140D22',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(107, 0, 255, 0.15)',
                color: '#A855F7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A855F7', fontWeight: 700 }}>
                FLOCARDS AI LOGO STUDIO
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: isLight ? '#191522' : '#FFFFFF', margin: 0 }}>
                Smart Logo Background Remover & Editor
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Switcher */}
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
                onClick={() => setViewMode('transparent')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'transparent' ? '#7038F8' : 'transparent',
                  color: viewMode === 'transparent' ? '#FFFFFF' : (isLight ? '#4C1D95' : '#CBD5E1'),
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Transparent PNG
              </button>
              <button
                type="button"
                onClick={() => setViewMode('original')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'original' ? '#7038F8' : 'transparent',
                  color: viewMode === 'original' ? '#FFFFFF' : (isLight ? '#4C1D95' : '#CBD5E1'),
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Original Upload
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compare')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'compare' ? '#7038F8' : 'transparent',
                  color: viewMode === 'compare' ? '#FFFFFF' : (isLight ? '#4C1D95' : '#CBD5E1'),
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Split Compare
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: 'none',
                border: 'none',
                color: isLight ? '#64748B' : '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* =================================================================
            2. MODAL BODY (LEFT: CANVAS STAGE, RIGHT: CONTROLS DRAWER)
            ================================================================= */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row' }}>
          {/* LEFT: INTERACTIVE CANVAS STAGE */}
          <div
            ref={containerRef}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: isLight ? '#F5F3FB' : '#0B0714',
              padding: '16px',
              borderRight: isLight ? '1px solid rgba(112, 56, 248, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Top Toolbar over Canvas: Background Swatches */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px',
                zIndex: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
                  Preview Background:
                </span>
                <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
                  {[
                    { id: 'checkerboard', label: '🏁 Alpha', bg: 'transparent' },
                    { id: '#FFFFFF', label: 'White', bg: '#FFFFFF' },
                    { id: '#000000', label: 'Black', bg: '#000000' },
                    { id: '#F1F5F9', label: 'Grey', bg: '#F1F5F9' },
                    { id: '#6B004F', label: 'Purple', bg: '#6B004F' }
                  ].map((swatch) => (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => setPreviewBg(swatch.id)}
                      title={`Preview on ${swatch.label}`}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        backgroundColor: swatch.bg,
                        border: previewBg === swatch.id ? '2px solid #A855F7' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: previewBg === swatch.id ? '0 0 8px #A855F7' : 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => {
                      setCustomBgColor(e.target.value);
                      setPreviewBg('custom');
                    }}
                    title="Custom background preview color"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      border: previewBg === 'custom' ? '2px solid #A855F7' : '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      padding: 0,
                      background: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Status Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isProcessing ? (
                  <span style={{ fontSize: '0.72rem', color: '#A855F7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={12} className="spin-animation" />
                    Removing background...
                  </span>
                ) : processStatus === 'already_transparent' ? (
                  <span style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} />
                    Authentic Alpha Preserved
                  </span>
                ) : processStatus === 'success' ? (
                  <span style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} />
                    AI Background Removed
                  </span>
                ) : processStatus === 'error' ? (
                  <span style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} />
                    Processing Error
                  </span>
                ) : null}
              </div>
            </div>

            {/* Central Canvas Viewport */}
            <div
              style={{
                flex: 1,
                borderRadius: '16px',
                border: isLight ? '1px solid rgba(112, 56, 248, 0.15)' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                ...resolveStageBackground()
              }}
            >
              {viewMode === 'compare' ? (
                /* Split Side-by-Side Compare */
                <div style={{ display: 'flex', width: '100%', height: '100%', gap: '12px', padding: '16px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '8px', fontWeight: 600 }}>Original Upload</span>
                    <img src={originalDataUrl} alt="Original" style={{ maxWidth: '90%', maxHeight: '80%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#A855F7', marginBottom: '8px', fontWeight: 600 }}>Transparent Result</span>
                    <img src={previewDataUrl} alt="Transparent" style={{ maxWidth: '90%', maxHeight: '80%', objectFit: 'contain' }} />
                  </div>
                </div>
              ) : viewMode === 'original' ? (
                /* Original Source View */
                <img
                  src={originalDataUrl}
                  alt="Original source"
                  style={{
                    maxWidth: '85%',
                    maxHeight: '85%',
                    objectFit: 'contain',
                    transform: `rotate(${rotation}deg) scale(${size / 100})`,
                    transition: 'transform 0.15s ease'
                  }}
                />
              ) : (
                /* Transparent Editable Canvas View */
                <div
                  style={{
                    position: 'relative',
                    maxWidth: '85%',
                    maxHeight: '85%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: activeTab === 'manual_brush' ? 'crosshair' : 'default'
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerLeave={handlePointerLeave}
                >
                  <canvas
                    ref={editCanvasRef}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
                      transform: `rotate(${rotation}deg) scale(${size / 100})`,
                      transition: isDrawing ? 'none' : 'transform 0.15s ease'
                    }}
                  />

                  {/* Circular Brush Cursor Indicator */}
                  {activeTab === 'manual_brush' && cursorPos.visible && (
                    <div
                      style={{
                        position: 'absolute',
                        left: cursorPos.x,
                        top: cursorPos.y,
                        width: `${brushSize}px`,
                        height: `${brushSize}px`,
                        borderRadius: '50%',
                        border: activeBrush === 'erase' ? '2px dashed #EF4444' : '2px dashed #22C55E',
                        backgroundColor: activeBrush === 'erase' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 20
                      }}
                    />
                  )}
                </div>
              )}

              {/* Hidden Original Canvas for Restore Brush sampling */}
              <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
            </div>

            {/* Bottom Caption */}
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: isLight ? '#64748B' : '#64748B' }}>
              <span>Preview background is for contrast inspection only. Exported PNG contains genuine 32-bit transparent alpha.</span>
              <span>Zoom: {size}% | Rot: {rotation}°</span>
            </div>
          </div>

          {/* RIGHT: TOOL PANELS & CONTROLS DRAWER */}
          <div
            style={{
              width: '380px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: isLight ? '#FFFFFF' : '#140D22',
              overflowY: 'auto',
              padding: '20px',
              boxSizing: 'border-box',
              gap: '20px'
            }}
          >
            {/* Tabs Selector */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                padding: '4px',
                borderRadius: '10px',
                backgroundColor: isLight ? '#F1EEF8' : 'rgba(255, 255, 255, 0.05)',
                border: isLight ? '1px solid #E8D5E5' : '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {[
                { id: 'auto_bg', label: 'AI Removal', icon: Sparkles },
                { id: 'manual_brush', label: 'Brushes', icon: Eraser },
                { id: 'transform', label: 'Fit & Position', icon: Sliders }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isActive ? '#7038F8' : 'transparent',
                      color: isActive ? '#FFFFFF' : (isLight ? '#4C1D95' : '#94A3B8'),
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: AUTOMATIC BACKGROUND REMOVAL */}
            {activeTab === 'auto_bg' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isLight ? '#191522' : '#FFFFFF', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Sensitivity / Tolerance</span>
                    <span style={{ color: '#A855F7' }}>{tolerance}</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7038F8' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#94A3B8', marginTop: '2px' }}>
                    <span>Tight (10)</span>
                    <span>Broad / Aggressive (90)</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isLight ? '#191522' : '#FFFFFF', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Edge Feathering</span>
                    <span style={{ color: '#A855F7' }}>{feather}px</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={feather}
                    onChange={(e) => setFeather(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7038F8' }}
                  />
                  <span style={{ fontSize: '0.66rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
                    Softens jagged edges and preserves delicate typography outlines.
                  </span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: isLight ? '#334155' : '#CBD5E1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useFloodFill}
                    onChange={(e) => setUseFloodFill(e.target.checked)}
                    style={{ accentColor: '#7038F8' }}
                  />
                  <span>Outer Boundary Only (Preserves white details inside logo)</span>
                </label>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => runAutoBgRemoval(null, tolerance, feather, useFloodFill)}
                    disabled={isProcessing}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: '#7038F8',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: isProcessing ? 'wait' : 'pointer',
                      boxShadow: '0 4px 14px rgba(112, 56, 248, 0.35)'
                    }}
                  >
                    <RefreshCw size={13} className={isProcessing ? 'spin-animation' : ''} />
                    <span>{isProcessing ? 'Processing...' : 'Re-run Auto Removal'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoTrimMargins}
                    title="Trim excess transparent margins to center the logo perfectly"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: isLight ? '#F1EEF8' : 'rgba(255, 255, 255, 0.08)',
                      color: isLight ? '#4C1D95' : '#CBD5E1',
                      border: isLight ? '1px solid #D8B4FE' : '1px solid rgba(255, 255, 255, 0.12)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Crop size={13} />
                    <span>Trim Padding</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL BRUSHES */}
            {activeTab === 'manual_brush' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveBrush('erase')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: activeBrush === 'erase' ? '2px solid #EF4444' : (isLight ? '1px solid #CBD5E1' : '1px solid rgba(255,255,255,0.12)'),
                      backgroundColor: activeBrush === 'erase' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      color: activeBrush === 'erase' ? '#EF4444' : (isLight ? '#475569' : '#CBD5E1'),
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Eraser size={14} />
                    <span>Erase Brush</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBrush('restore')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: activeBrush === 'restore' ? '2px solid #22C55E' : (isLight ? '1px solid #CBD5E1' : '1px solid rgba(255,255,255,0.12)'),
                      backgroundColor: activeBrush === 'restore' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                      color: activeBrush === 'restore' ? '#22C55E' : (isLight ? '#475569' : '#CBD5E1'),
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Paintbrush size={14} />
                    <span>Restore Brush</span>
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isLight ? '#191522' : '#FFFFFF', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Brush Size</span>
                    <span style={{ color: '#A855F7' }}>{brushSize}px</span>
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="80"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7038F8' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: isLight ? '#F1EEF8' : 'rgba(255, 255, 255, 0.08)',
                      color: historyIndex <= 0 ? '#64748B' : (isLight ? '#4C1D95' : '#FFFFFF'),
                      border: 'none',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Undo2 size={13} />
                    <span>Undo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: isLight ? '#F1EEF8' : 'rgba(255, 255, 255, 0.08)',
                      color: historyIndex >= history.length - 1 ? '#64748B' : (isLight ? '#4C1D95' : '#FFFFFF'),
                      border: 'none',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Redo2 size={13} />
                    <span>Redo</span>
                  </button>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.4, padding: '8px', backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  💡 <strong>Tip:</strong> Drag on the canvas with Erase Brush to clear stubborn background artifacts, or Restore Brush to paint back original letters that got clipped.
                </div>
              </div>
            )}

            {/* TAB 3: TRANSFORM & FIT */}
            {activeTab === 'transform' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isLight ? '#191522' : '#FFFFFF', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Logo Scale / Size</span>
                    <span style={{ color: '#A855F7' }}>{size}%</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7038F8' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: isLight ? '#191522' : '#FFFFFF' }}>
                      Rotation ({rotation}°)
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setRotation((prev) => (prev - 90 < -180 ? prev - 90 + 360 : prev - 90))}
                        title="Rotate -90°"
                        style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#CBD5E1', cursor: 'pointer' }}
                      >
                        <RotateCcw size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation(0)}
                        title="Reset 0°"
                        style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: '0.66rem' }}
                      >
                        0°
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation((prev) => (prev + 90 > 180 ? prev + 90 - 360 : prev + 90))}
                        title="Rotate +90°"
                        style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#CBD5E1', cursor: 'pointer' }}
                      >
                        <RotateCw size={11} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7038F8' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.76rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                      Horizontal X ({posX}px)
                    </label>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      value={posX}
                      onChange={(e) => setPosX(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#7038F8' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.76rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                      Vertical Y ({posY}px)
                    </label>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={posY}
                      onChange={(e) => setPosY(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#7038F8' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setPosX(0); setPosY(0); }}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    backgroundColor: isLight ? '#F1EEF8' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: isLight ? '#4C1D95' : '#CBD5E1',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  Center Logo Alignment (X: 0, Y: 0)
                </button>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: isLight ? '#334155' : '#CBD5E1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showCircleBadge}
                    onChange={(e) => setShowCircleBadge(e.target.checked)}
                    style={{ accentColor: '#7038F8' }}
                  />
                  <span>Show Circular Glass Badge on Card</span>
                </label>
              </div>
            )}

            {/* SEPARATE DOWNLOADS SECTION (Always accessible) */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '16px',
                borderTop: isLight ? '1px solid rgba(112, 56, 248, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A855F7', fontWeight: 700 }}>
                Separate Downloads
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleDownloadTransparent}
                  title="Download genuine 32-bit transparent PNG"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px 6px',
                    borderRadius: '6px',
                    backgroundColor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10B981',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={12} />
                  <span>Transparent PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadOriginal}
                  title="Download unmodified original source file"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px 6px',
                    borderRadius: '6px',
                    backgroundColor: isLight ? '#F1EEF8' : 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: isLight ? '#475569' : '#CBD5E1',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={12} />
                  <span>Original Logo</span>
                </button>
              </div>

              {onDownloadCardArtwork && (
                <button
                  type="button"
                  onClick={onDownloadCardArtwork}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '7px 6px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(112, 56, 248, 0.3)',
                    color: isLight ? '#7038F8' : '#D8B4FE',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={12} />
                  <span>Download Card Artwork</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =================================================================
            3. MODAL FOOTER (CANCEL, RESET, APPLY TO CARD)
            ================================================================= */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: isLight ? '1px solid rgba(112, 56, 248, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isLight ? '#F9F8FD' : '#140D22',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={handleResetToOriginal}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#EF4444',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset to Original Upload
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'transparent',
                color: isLight ? '#475569' : '#CBD5E1',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#7038F8',
                color: '#FFFFFF',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(112, 56, 248, 0.45)'
              }}
            >
              <Check size={16} />
              <span>Apply to Card Designer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
