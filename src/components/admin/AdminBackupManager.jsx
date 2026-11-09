/* ==========================================================================
   FLOCARD ENTERPRISE DEVELOPER BACKUP & RESTORE MANAGER
   - Creates full structured .ZIP archives containing Customers, Sales (Orders & Invoices),
     Customer Designs, and NFC Hardware Cards.
   - Allows Developer-side upload with mandatory pre-restore inspection & approval gate.
   - No data is overwritten or imported until explicitly approved by the developer.
   ========================================================================== */

import React, { useState, useRef } from 'react';
import {
  Archive,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  Users,
  ShoppingBag,
  Palette,
  FileText,
  Radio,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  X,
  ShieldCheck,
  Database,
  Search,
  Layers
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrencyINR } from '../../lib/storage';

export default function AdminBackupManager() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const {
    customers = [],
    orders = [],
    designs = [],
    cards = [],
    getInvoices,
    createBackupZip,
    parseBackupZip,
    restoreBackup
  } = useData();

  const invoices = getInvoices ? getInvoices() : [];

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState(null);

  // Upload & Parsing State
  const [isParsing, setIsParsing] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [parsedBackup, setParsedBackup] = useState(null);
  const [previewTab, setPreviewTab] = useState('summary'); // 'summary' | 'customers' | 'sales' | 'designs'
  const [restoreMode, setRestoreMode] = useState('merge'); // 'merge' | 'replace'
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState(null);

  // Search filter inside preview tabs
  const [previewSearch, setPreviewSearch] = useState('');

  const fileInputRef = useRef(null);

  // Styling based on dark / light theme
  const cardBg = isDark ? '#110C1D' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(139, 92, 246, 0.22)' : '#EDE6F8';
  const elevatedBg = isDark ? '#181126' : '#F7F3FD';
  const textPrimary = isDark ? '#FFFFFF' : '#181126';
  const textSecondary = isDark ? '#BCAED4' : '#6E6285';
  const textMuted = isDark ? '#887B9E' : '#988AAE';

  // 1. Handle Export
  const handleDownloadBackup = async () => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    try {
      const { blob, fileName, manifest } = await createBackupZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccessMsg(`Backup archive ${fileName} successfully generated and downloaded! (${manifest.summary.customersCount} Customers, ${manifest.summary.ordersCount} Sales Orders, ${manifest.summary.designsCount} Designs)`);
      setTimeout(() => setExportSuccessMsg(null), 8000);
    } catch (err) {
      console.error('Backup generation failed:', err);
      alert('Failed to generate backup ZIP: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Handle File Select & Preview Parsing
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setUploadError(null);
    setParsedBackup(null);
    setRestoreSuccessMsg(null);

    try {
      const parsed = await parseBackupZip(file);
      setParsedBackup(parsed);
      setPreviewTab('summary');
    } catch (err) {
      console.error('Failed to parse backup ZIP:', err);
      setUploadError(err.message || 'Failed to read backup file. Please ensure it is a valid .zip archive.');
    } finally {
      setIsParsing(false);
      // Reset input so re-selecting same file triggers change
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fakeEvent = { target: { files: [file] } };
      handleFileChange(fakeEvent);
    }
  };

  // 4. Handle Final Approval & Restore
  const handleApproveRestore = async () => {
    if (!parsedBackup) return;

    const confirmText = restoreMode === 'replace'
      ? `ATTENTION: Clean Replacement will overwrite current live records with this backup snapshot (${parsedBackup.summary.customersCount} Customers, ${parsedBackup.summary.ordersCount} Orders, ${parsedBackup.summary.designsCount} Designs). Proceed?`
      : `Approve and merge ${parsedBackup.summary.customersCount} Customers, ${parsedBackup.summary.ordersCount} Orders, and ${parsedBackup.summary.designsCount} Designs into the active system?`;

    if (!window.confirm(confirmText)) {
      return;
    }

    setIsRestoring(true);
    try {
      const result = await restoreBackup(parsedBackup, {
        mode: restoreMode,
        actorName: user?.name || user?.email || 'Developer Admin'
      });

      setRestoreSuccessMsg(`Backup approved & restored successfully! (${result.restoredCounts.customers} Customers, ${result.restoredCounts.orders} Sales Orders, ${result.restoredCounts.designs} Designs now live).`);
      setParsedBackup(null);
      setTimeout(() => setRestoreSuccessMsg(null), 10000);
    } catch (err) {
      console.error('Failed to restore backup:', err);
      alert('Restore failed: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCancelPreview = () => {
    setParsedBackup(null);
    setUploadError(null);
  };

  // Total current live revenue
  const totalLiveRevenue = orders.reduce((sum, o) => {
    const amt = Number(o.totalAmount || o.pricingBreakdown?.total || 0);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(107, 0, 255, 0.12) 0%, rgba(144, 92, 252, 0.05) 100%)',
          borderRadius: '18px',
          border: `1px solid ${cardBorder}`,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', backgroundColor: '#6B00FF', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Developer Engine
            </span>
            <span style={{ fontSize: '0.74rem', color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              Atomic ZIP Archive Protocol v1.0
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
            System Backup &amp; Disaster Recovery
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: textSecondary, maxWidth: '650px' }}>
            Export comprehensive snapshots containing customer profiles, sales orders, tax invoices, and card designs in a single ZIP archive. Restore with mandatory interactive visual inspection and developer approval before committing.
          </p>
        </div>

        {/* Live Metrics Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 14px', borderRadius: '10px', backgroundColor: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: textMuted, fontWeight: 600 }}>Live Customers</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6B00FF' }}>{customers.length}</div>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: '10px', backgroundColor: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: textMuted, fontWeight: 600 }}>Live Orders</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981' }}>{orders.length}</div>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: '10px', backgroundColor: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: textMuted, fontWeight: 600 }}>Live Designs</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3B82F6' }}>{designs.length}</div>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: '10px', backgroundColor: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: textMuted, fontWeight: 600 }}>Sales Volume</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F59E0B' }}>{formatCurrencyINR(totalLiveRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {exportSuccessMsg && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {restoreSuccessMsg && (
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10B981', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)' }}>
          <CheckCircle2 size={22} />
          <span>{restoreSuccessMsg}</span>
        </div>
      )}

      {uploadError && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* 2-Column Action Panels: Export & Import */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Panel 1: Create / Download ZIP Backup */}
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: '16px',
            border: `1px solid ${cardBorder}`,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(107, 0, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B00FF' }}>
                <FileArchive size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: textPrimary }}>
                  1. Export System Backup (.ZIP)
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: textSecondary }}>
                  Compress entire database into a secured portable archive
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: elevatedBg, borderRadius: '12px', padding: '14px', marginBottom: '18px', border: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>
                Archive Inclusions:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: textSecondary }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={14} color="#6B00FF" />
                  <span><strong>{customers.length} Customers</strong> &amp; digital profiles</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={14} color="#10B981" />
                  <span><strong>{orders.length} Sales Orders</strong> (Revenue: {formatCurrencyINR(totalLiveRevenue)})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Palette size={14} color="#3B82F6" />
                  <span><strong>{designs.length} Customer Designs</strong> (Vector artwork, logos, bleed)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} color="#F59E0B" />
                  <span><strong>{invoices.length} Tax Invoices</strong> &amp; billing ledgers</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={14} color="#EC4899" />
                  <span><strong>{cards.length} NFC Hardware Cards</strong> inventory</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadBackup}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6B00FF 0%, #905CFC 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: isExporting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(107, 0, 255, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            {isExporting ? (
              <>
                <RefreshCw size={16} className="spin-animation" />
                <span>Compressing Backup Archive...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Backup ZIP</span>
              </>
            )}
          </button>
        </div>

        {/* Panel 2: Upload Developer ZIP for Inspection */}
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: '16px',
            border: `1px solid ${cardBorder}`,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <Upload size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: textPrimary }}>
                  2. Upload &amp; Inspect Backup
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: textSecondary }}>
                  Developer-side upload with pre-restore interactive inspection
                </p>
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(107, 0, 255, 0.35)',
                borderRadius: '12px',
                padding: '28px 16px',
                textAlign: 'center',
                backgroundColor: elevatedBg,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: '14px'
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".zip,application/zip"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <Archive size={36} color="#6B00FF" style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                {isParsing ? 'Unpacking & Verifying ZIP...' : 'Click to select or drag .ZIP backup file here'}
              </div>
              <div style={{ fontSize: '0.74rem', color: textMuted }}>
                FLOCARD compressed backup archives (.zip)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: textMuted }}>
            <ShieldCheck size={14} color="#10B981" />
            <span>Guaranteed Safe: Nothing will be restored until you inspect and approve the preview.</span>
          </div>
        </div>

      </div>

      {/* ====================================================================
          MANDATORY INTERACTIVE PREVIEW & APPROVAL GATE MODAL / SECTION
          ==================================================================== */}
      {parsedBackup && (
        <div
          style={{
            backgroundColor: cardBg,
            borderRadius: '18px',
            border: '2px solid #6B00FF',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(107, 0, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Header of Preview */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', borderBottom: `1px solid ${cardBorder}`, paddingBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', textTransform: 'uppercase' }}>
                  ✓ Valid Archive Verified
                </span>
                <span style={{ fontSize: '0.75rem', color: textMuted, fontFamily: 'monospace' }}>
                  {parsedBackup.fileName} ({(parsedBackup.fileSize / 1024).toFixed(1)} KB)
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: textPrimary }}>
                Inspect Backup Contents Before Approval
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: textSecondary }}>
                Exported on: {new Date(parsedBackup.exportedAt).toLocaleString('en-IN')} &bull; Target: {parsedBackup.appName}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancelPreview}
              style={{
                background: 'transparent',
                border: `1px solid ${cardBorder}`,
                borderRadius: '8px',
                padding: '6px 12px',
                color: textSecondary,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={14} />
              <span>Cancel Preview</span>
            </button>
          </div>

          {/* Quick Metrics Comparison Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            
            {/* Customers Card */}
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: elevatedBg, border: `1px solid ${cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: textSecondary }}>Customers</span>
                <Users size={16} color="#6B00FF" />
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: textPrimary }}>
                {parsedBackup.summary.customersCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: '2px' }}>
                Current in system: {parsedBackup.currentCounts.customersCount}
              </div>
            </div>

            {/* Sales Orders Card */}
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: elevatedBg, border: `1px solid ${cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: textSecondary }}>Sales Orders</span>
                <ShoppingBag size={16} color="#10B981" />
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: textPrimary }}>
                {parsedBackup.summary.ordersCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: '2px' }}>
                Revenue: {formatCurrencyINR(parsedBackup.summary.totalSalesRevenue)}
              </div>
            </div>

            {/* Customer Designs Card */}
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: elevatedBg, border: `1px solid ${cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: textSecondary }}>Customer Designs</span>
                <Palette size={16} color="#3B82F6" />
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: textPrimary }}>
                {parsedBackup.summary.designsCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: '2px' }}>
                Current in system: {parsedBackup.currentCounts.designsCount}
              </div>
            </div>

            {/* Tax Invoices Card */}
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: elevatedBg, border: `1px solid ${cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: textSecondary }}>Tax Invoices</span>
                <FileText size={16} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: textPrimary }}>
                {parsedBackup.summary.invoicesCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: textMuted, marginTop: '2px' }}>
                Current in system: {parsedBackup.currentCounts.invoicesCount}
              </div>
            </div>

          </div>

          {/* Sub-Tabs for Detailed Inspection */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${cardBorder}`, paddingBottom: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setPreviewTab('summary')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: previewTab === 'summary' ? '#6B00FF' : 'transparent',
                color: previewTab === 'summary' ? '#FFFFFF' : textSecondary,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Overview &amp; Restore Mode
            </button>

            <button
              type="button"
              onClick={() => setPreviewTab('customers')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: previewTab === 'customers' ? '#6B00FF' : 'transparent',
                color: previewTab === 'customers' ? '#FFFFFF' : textSecondary,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Customers Preview</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '9999px', backgroundColor: previewTab === 'customers' ? 'rgba(255,255,255,0.2)' : elevatedBg }}>
                {parsedBackup.summary.customersCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewTab('sales')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: previewTab === 'sales' ? '#6B00FF' : 'transparent',
                color: previewTab === 'sales' ? '#FFFFFF' : textSecondary,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Sales &amp; Orders Preview</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '9999px', backgroundColor: previewTab === 'sales' ? 'rgba(255,255,255,0.2)' : elevatedBg }}>
                {parsedBackup.summary.ordersCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewTab('designs')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: previewTab === 'designs' ? '#6B00FF' : 'transparent',
                color: previewTab === 'designs' ? '#FFFFFF' : textSecondary,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Customer Designs Preview</span>
              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '9999px', backgroundColor: previewTab === 'designs' ? 'rgba(255,255,255,0.2)' : elevatedBg }}>
                {parsedBackup.summary.designsCount}
              </span>
            </button>
          </div>

          {/* Sub-Tab 1: Overview & Mode Selection */}
          {previewTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: textPrimary }}>
                Select How You Want to Apply This Backup:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                
                {/* Option A: Merge & Update */}
                <div
                  onClick={() => setRestoreMode('merge')}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: restoreMode === 'merge' ? '2px solid #6B00FF' : `1px solid ${cardBorder}`,
                    backgroundColor: restoreMode === 'merge' ? 'rgba(107, 0, 255, 0.08)' : elevatedBg,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #6B00FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {restoreMode === 'merge' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6B00FF' }} />}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: textPrimary }}>
                      Merge &amp; Update (Safe &amp; Recommended)
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: textSecondary, paddingLeft: '24px' }}>
                    Imports all records from the backup. Existing matching customers and orders are updated, while new ones are added. Existing records not in the backup remain intact.
                  </p>
                </div>

                {/* Option B: Clean Replacement */}
                <div
                  onClick={() => setRestoreMode('replace')}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: restoreMode === 'replace' ? '2px solid #EF4444' : `1px solid ${cardBorder}`,
                    backgroundColor: restoreMode === 'replace' ? 'rgba(239, 68, 68, 0.08)' : elevatedBg,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {restoreMode === 'replace' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: textPrimary }}>
                      Complete Snapshot Overwrite
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: textSecondary, paddingLeft: '24px' }}>
                    Wipes existing live collections and restores the system to the exact point in time when this backup was taken.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Sub-Tab 2: Customers Preview */}
          {previewTab === 'customers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ overflowX: 'auto', maxHeight: '320px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: elevatedBg, borderBottom: `1px solid ${cardBorder}`, color: textMuted }}>
                      <th style={{ padding: '8px 12px' }}>Name</th>
                      <th style={{ padding: '8px 12px' }}>Email</th>
                      <th style={{ padding: '8px 12px' }}>Phone</th>
                      <th style={{ padding: '8px 12px' }}>Company</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(parsedBackup.rawBackup.customers || []).map((cust, i) => (
                      <tr key={cust.id || i} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: textPrimary }}>{cust.name}</td>
                        <td style={{ padding: '8px 12px', color: textSecondary }}>{cust.email}</td>
                        <td style={{ padding: '8px 12px', color: textMuted }}>{cust.phone || '—'}</td>
                        <td style={{ padding: '8px 12px', color: textSecondary }}>{cust.company || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 700 }}>
                            {cust.status || 'active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Sales Orders Preview */}
          {previewTab === 'sales' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ overflowX: 'auto', maxHeight: '320px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: elevatedBg, borderBottom: `1px solid ${cardBorder}`, color: textMuted }}>
                      <th style={{ padding: '8px 12px' }}>Order Ref</th>
                      <th style={{ padding: '8px 12px' }}>Customer</th>
                      <th style={{ padding: '8px 12px' }}>Edition</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(parsedBackup.rawBackup.orders || []).map((ord, i) => (
                      <tr key={ord.id || ord.orderReference || i} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#6B00FF' }}>
                          {ord.orderReference || ord.id}
                        </td>
                        <td style={{ padding: '8px 12px', color: textPrimary, fontWeight: 600 }}>{ord.customerName}</td>
                        <td style={{ padding: '8px 12px', textTransform: 'capitalize', color: textSecondary }}>{ord.edition || 'purple'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontWeight: 700 }}>
                            {ord.status || 'approved'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: textPrimary }}>
                          {formatCurrencyINR(ord.totalAmount || ord.pricingBreakdown?.total || 1899)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-Tab 4: Customer Designs Preview */}
          {previewTab === 'designs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', maxHeight: '340px', overflowY: 'auto' }}>
              {(parsedBackup.rawBackup.designs || []).map((des, i) => (
                <div key={des.id || i} style={{ padding: '12px', borderRadius: '10px', backgroundColor: elevatedBg, border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#6B00FF', color: '#FFF', fontWeight: 700, textTransform: 'capitalize' }}>
                      {des.edition || 'purple'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: textMuted }}>
                      {des.status || 'submitted'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: textPrimary }}>
                    {des.title || 'Executive NFC Card'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: textSecondary, marginTop: '2px' }}>
                    Customer: {des.customerName || 'Client'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Approval Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: `1px solid ${cardBorder}`, paddingTop: '16px' }}>
            <button
              type="button"
              disabled={isRestoring}
              onClick={handleCancelPreview}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: `1px solid ${cardBorder}`,
                color: textSecondary,
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Discard &amp; Cancel
            </button>

            <button
              type="button"
              disabled={isRestoring}
              onClick={handleApproveRestore}
              style={{
                padding: '11px 24px',
                borderRadius: '10px',
                background: restoreMode === 'replace'
                  ? 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
                  : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: isRestoring ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: restoreMode === 'replace'
                  ? '0 4px 16px rgba(220, 38, 38, 0.4)'
                  : '0 4px 16px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isRestoring ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>Restoring &amp; Syncing Database...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Approve &amp; Restore Backup</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
