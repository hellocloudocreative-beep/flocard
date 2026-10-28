/* ==========================================================================
   FLOCARDS UPI PAYMENTS SECTION
   Features:
   - Copyable UPI ID with feedback
   - Dynamic QR code generation with download option
   - Direct UPI payment deep-links for Google Pay, PhonePe, Paytm, BHIM
   - Recipient name and owner payment instructions
   - Security adherence: does not mark payment completed merely on scan
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Copy, Check, Download, ArrowUpRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { generateQrDataUrl } from '../../lib/qr';
import { generateUpiPayUrl, validateUpiId } from '../../lib/paymentValidator';

export default function PaymentSection({
  paymentConfig = {},
  accentColor = '#A855F7',
  glowColor = '#6B00FF',
  isLight = false
}) {
  const [copied, setCopied] = useState(false);
  const [generatedQr, setGeneratedQr] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  if (paymentConfig?.enabled === false) {
    return null;
  }

  const upiId = paymentConfig?.upiId || '';
  const recipientName = paymentConfig?.recipientName || 'FLOCARDS Merchant';
  const instructions = paymentConfig?.instructions || '';
  const customQrUrl = paymentConfig?.qrUrl || '';

  const validation = validateUpiId(upiId);
  const upiPayUrl = validation.valid ? generateUpiPayUrl({ upiId, recipientName }) : '';

  // Generate QR if no custom QR image was uploaded
  useEffect(() => {
    if (customQrUrl) {
      setGeneratedQr(customQrUrl);
    } else if (upiPayUrl) {
      setIsGeneratingQr(true);
      generateQrDataUrl(upiPayUrl, { width: 380, margin: 2 })
        .then((url) => {
          setGeneratedQr(url);
          setIsGeneratingQr(false);
        })
        .catch(() => {
          setIsGeneratingQr(false);
        });
    }
  }, [customQrUrl, upiPayUrl]);

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!generatedQr) return;
    const a = document.createElement('a');
    a.href = generatedQr;
    a.download = `FLOCARD-Payment-QR-${(upiId || 'merchant').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <section
      className="flocard-profile-section flocard-payment-section"
      style={{
        width: '100%',
        margin: '0 auto',
        padding: '36px 0',
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: `${accentColor}20`,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CreditCard size={20} />
          </div>
          <div>
            <h2
              style={{
                fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                fontSize: 'clamp(1.15rem, 3.2vw, 1.4rem)',
                fontWeight: 700,
                color: isLight ? '#130B22' : '#FFFFFF',
                margin: 0,
                lineHeight: 1.2
              }}
            >
              Payment Options
            </h2>
            <span style={{ fontSize: '0.78rem', color: isLight ? '#64748B' : '#94A3B8' }}>
              Instant UPI Transfers & QR Payments
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: '24px',
          backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
          boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.05)' : '0 12px 36px rgba(0,0,0,0.3)',
          padding: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '28px',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Left: QR Code Card */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              padding: '14px',
              borderRadius: '18px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              marginBottom: '14px',
              display: 'inline-block'
            }}
          >
            {generatedQr ? (
              <img
                src={generatedQr}
                alt="Payment QR"
                style={{ width: '180px', height: '180px', display: 'block', objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8'
                }}
              >
                <QrCode size={48} opacity={0.4} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {generatedQr && (
              <button
                type="button"
                onClick={handleDownloadQr}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}`,
                  backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                  color: isLight ? '#334155' : '#E2D9F3',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={13} />
                <span>Save QR</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Payment Details & UPI App Trigger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 700 }}>
              Payee Recipient
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', marginTop: '2px' }}>
              {recipientName}
            </div>
          </div>

          {/* Copyable UPI ID Box */}
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 700, marginBottom: '6px' }}>
              Virtual Payment Address (UPI ID)
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                boxSizing: 'border-box'
              }}
            >
              <code style={{ fontSize: '0.94rem', fontWeight: 700, color: accentColor, wordBreak: 'break-all' }}>
                {upiId || 'No UPI ID configured'}
              </code>
              {upiId && (
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: copied ? '#10B981' : (isLight ? '#475569' : '#CBD5E1'),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Direct UPI Payment App CTA */}
          {upiPayUrl && (
            <div>
              <a
                href={upiPayUrl}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  backgroundColor: accentColor,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  boxShadow: `0 4px 18px ${glowColor}40`,
                  boxSizing: 'border-box',
                  textAlign: 'center'
                }}
              >
                <span>Pay via UPI App</span>
                <ArrowUpRight size={16} />
              </a>
              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: isLight ? '#64748B' : '#94A3B8', marginTop: '6px' }}>
                Compatible with Google Pay, PhonePe, Paytm & BHIM
              </div>
            </div>
          )}

          {/* Owner Instructions */}
          {instructions && (
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                fontSize: '0.82rem',
                color: isLight ? '#475569' : '#CBD5E1',
                lineHeight: 1.5
              }}
            >
              ℹ️ {instructions}
            </div>
          )}

          {/* Security Assurance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: isLight ? '#64748B' : '#82758F' }}>
            <ShieldCheck size={14} color="#10B981" />
            <span>Direct peer-to-peer verified bank settlement. Never enter your UPI PIN on external websites.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
