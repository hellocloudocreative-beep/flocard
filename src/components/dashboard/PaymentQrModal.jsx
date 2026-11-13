import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, MessageCircle, ExternalLink, Download, Printer, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { generateQrDataUrl } from '../../lib/qr';
import { getOrderUpiPaymentUrl, getOrderWhatsAppPaymentDetailsUrl, getOrderWhatsAppPaymentMessage } from '../../lib/whatsapp';

export default function PaymentQrModal({
  isOpen,
  onClose,
  order,
  isLight = false
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [customUpiId, setCustomUpiId] = useState('');
  const [isEditingUpi, setIsEditingUpi] = useState(false);

  // Fallback defaults
  const orderRef = order?.orderReference || order?.id || 'FLOCARD-ORDER';
  const customerName = order?.customerName || order?.name || order?.customerDetails?.name || 'Customer';
  const customerPhone = order?.customerPhone || order?.phone || order?.customerDetails?.phone || '';
  const rawAmount = Number(order?.totalAmount || order?.total_amount || order?.pricing?.totalPayable || order?.pricing?.total || order?.unitPrice || 2000);
  const amount = isNaN(rawAmount) || rawAmount <= 0 ? 2000 : rawAmount;
  const formattedAmount = amount.toLocaleString('en-IN');
  const edition = order?.edition ? `${String(order.edition).toUpperCase()} Edition` : (order?.productName || 'FLOCARD NFC Smart Card');

  // Determine active UPI ID
  const activeUpiId = customUpiId || order?.upiId || order?.paymentConfig?.upiId || (() => {
    try {
      const stored = localStorage.getItem('flocard_invoice_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.upiId) return parsed.upiId;
      }
    } catch (_) {}
    return 'flocard@hdfcbank';
  })();

  const upiPayUrl = order ? getOrderUpiPaymentUrl(order, activeUpiId) : '';
  const waUrl = order ? getOrderWhatsAppPaymentDetailsUrl(order, activeUpiId) : null;

  // Generate QR code whenever UPI URL changes
  useEffect(() => {
    if (!isOpen || !upiPayUrl) return;

    let isCurrent = true;
    setLoading(true);

    generateQrDataUrl(upiPayUrl, {
      width: 420,
      margin: 2,
      errorCorrectionLevel: 'H',
      darkColor: '#110C1D',
      lightColor: '#FFFFFF'
    })
      .then((url) => {
        if (isCurrent) {
          setQrDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate UPI QR code:', err);
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, upiPayUrl]);

  if (!isOpen || !order) return null;

  const handleCopyLink = () => {
    if (!upiPayUrl) return;
    navigator.clipboard.writeText(upiPayUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyUpiId = () => {
    if (!activeUpiId) return;
    navigator.clipboard.writeText(activeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2200);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `FLOCARD-Payment-QR-${orderRef}-INR-${amount}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment QR - ${orderRef}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px; color: #111; }
            .card { max-width: 420px; margin: 0 auto; border: 2px solid #6B00FF; border-radius: 16px; padding: 24px; }
            h2 { color: #6B00FF; margin: 0 0 4px 0; }
            .amount { font-size: 32px; font-weight: 800; color: #111; margin: 12px 0; }
            img { width: 280px; height: 280px; margin: 12px 0; border: 1px solid #ddd; border-radius: 12px; }
            .note { font-size: 13px; color: #666; margin-top: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>FLOCARDS OFFICIAL PAYMENT</h2>
            <p style="margin: 4px 0; font-size: 14px; color: #555;">Order: <strong>${orderRef}</strong></p>
            <p style="margin: 2px 0; font-size: 14px; color: #555;">Customer: <strong>${customerName}</strong></p>
            <div class="amount">₹${formattedAmount}</div>
            <img src="${qrDataUrl}" alt="Payment QR" />
            <p style="font-size: 14px; font-weight: 600; margin: 6px 0;">UPI ID: ${activeUpiId}</p>
            <div class="note">Scan with Google Pay, PhonePe, Paytm, or BHIM. Amount ₹${formattedAmount} is pre-filled.</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const bgModal = isLight ? '#FFFFFF' : '#110C1D';
  const borderModal = isLight ? '#E5E7EB' : 'rgba(139, 92, 246, 0.25)';
  const textPrimary = isLight ? '#111827' : '#F9FAFB';
  const textSecondary = isLight ? '#4B5563' : '#9CA3AF';
  const textMuted = isLight ? '#9CA3AF' : '#6B7280';
  const elevatedBg = isLight ? '#F9FAFB' : '#1A132B';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          backgroundColor: bgModal,
          borderRadius: '20px',
          border: `1px solid ${borderModal}`,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${borderModal}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isLight
              ? 'linear-gradient(135deg, rgba(107, 0, 255, 0.05) 0%, rgba(147, 51, 234, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(107, 0, 255, 0.15) 0%, rgba(17, 12, 29, 0.8) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6B00FF 0%, #905cfc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(107, 0, 255, 0.35)'
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: textPrimary }}>
                  Dynamic Payment QR Code
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#10B98122',
                    color: '#10B981',
                    border: '1px solid #10B98144'
                  }}
                >
                  Amount Auto-Filled
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: textSecondary }}>
                Scannable with Google Pay, PhonePe, Paytm, BHIM & CRED
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: textMuted,
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

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Order & Amount Highlight Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              backgroundColor: elevatedBg,
              border: `1px solid ${borderModal}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: '#6B00FF', letterSpacing: '0.05em' }}>
                Order #{orderRef} • {edition}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: textPrimary, marginTop: '2px' }}>
                {customerName}
                {customerPhone && <span style={{ fontSize: '0.8rem', color: textMuted, fontWeight: 500, marginLeft: '6px' }}>({customerPhone})</span>}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: textMuted, fontWeight: 600 }}>Exact Payable Amount</div>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: isLight ? '#6B00FF' : '#A855F7',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em'
                }}
              >
                ₹{formattedAmount}
              </div>
            </div>
          </div>

          {/* QR Code Presentation Canvas */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              backgroundColor: isLight ? '#F3F4F6' : '#0B0714',
              borderRadius: '16px',
              border: `1px solid ${borderModal}`,
              position: 'relative'
            }}
          >
            {/* White QR container for flawless scanning */}
            <div
              style={{
                width: '260px',
                height: '260px',
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '12px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#6B00FF' }}>
                  <RefreshCw size={28} className="animate-spin" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Generating QR...</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`UPI Payment QR for ₹${formattedAmount}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ color: '#EF4444', fontSize: '0.8rem' }}>Failed to generate QR</div>
              )}
            </div>

            {/* Scan Prompt Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '14px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(107, 0, 255, 0.15)',
                border: isLight ? '1px solid #E5E7EB' : '1px solid rgba(107, 0, 255, 0.3)',
                color: isLight ? '#374151' : '#E9D5FF',
                fontSize: '0.76rem',
                fontWeight: 600
              }}
            >
              <ShieldCheck size={14} color="#10B981" />
              <span>Scanning automatically fills <strong>₹{formattedAmount}</strong> in Google Pay</span>
            </div>
          </div>

          {/* Payee UPI ID Bar */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: elevatedBg,
              border: `1px solid ${borderModal}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: textMuted, fontWeight: 600, marginBottom: '2px' }}>
                Payee UPI ID:
              </div>
              {isEditingUpi ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={customUpiId}
                    onChange={(e) => setCustomUpiId(e.target.value.trim())}
                    placeholder="merchant@okhdfcbank"
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: '1px solid #6B00FF',
                      backgroundColor: isLight ? '#FFFFFF' : '#110C1D',
                      color: textPrimary,
                      fontSize: '0.8rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingUpi(false)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#6B00FF',
                      color: '#FFF',
                      border: 'none',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: textPrimary, fontSize: '0.88rem' }}>
                    {activeUpiId}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomUpiId(activeUpiId);
                      setIsEditingUpi(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6B00FF',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      textDecoration: 'underline'
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopyUpiId}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: isLight ? '#EDE9FE' : 'rgba(107, 0, 255, 0.2)',
                border: '1px solid rgba(107, 0, 255, 0.3)',
                color: '#6B00FF',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copiedUpi ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
              <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: waUrl ? '1fr 1fr' : '1fr', gap: '10px' }}>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <MessageCircle size={16} />
                <span>Send via WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#6B00FF',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(107, 0, 255, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy GPay Link'}</span>
            </button>
          </div>

          {/* Secondary Utilities: Download & Print */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={handleDownloadQr}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: `1px solid ${borderModal}`,
                color: textSecondary,
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
              <span>Download PNG</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: `1px solid ${borderModal}`,
                color: textSecondary,
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={13} />
              <span>Print Slip</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
