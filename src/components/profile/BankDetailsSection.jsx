/* ==========================================================================
   FLOCARDS BANK ACCOUNT DETAILS SECTION
   Privacy & Security:
   - PRIVATE BY DEFAULT!
   - Renders ONLY when owner has explicitly consented (enabled: true && isPublic: true)
   - Supports individual field visibility toggles
   - Copyable Account Number & IFSC
   ========================================================================== */

import React, { useState } from 'react';
import { Landmark, Copy, Check, ShieldCheck, Lock } from 'lucide-react';

export default function BankDetailsSection({
  bankDetails = {},
  accentColor = '#A855F7',
  glowColor = '#6B00FF',
  isLight = false
}) {
  const [copiedField, setCopiedField] = useState(null);

  // STRICT PRIVACY GATE: If not enabled, or not marked explicitly public, DO NOT RENDER!
  if (!bankDetails || bankDetails.enabled !== true || bankDetails.isPublic !== true) {
    return null;
  }

  const vf = bankDetails.visibleFields || {
    accountHolder: true,
    bankName: true,
    branch: true,
    accountNumber: true,
    ifsc: true
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <section
      className="flocard-profile-section flocard-bank-section"
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
            <Landmark size={20} />
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
              Bank Settlement Details
            </h2>
            <span style={{ fontSize: '0.78rem', color: isLight ? '#64748B' : '#94A3B8' }}>
              Direct Wire & NEFT/RTGS/IMPS Transfers
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
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          boxSizing: 'border-box'
        }}
      >
        {vf.accountHolder && bankDetails.accountHolder && (
          <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
              Account Holder Name
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF', marginTop: '2px' }}>
              {bankDetails.accountHolder}
            </div>
          </div>
        )}

        {vf.bankName && bankDetails.bankName && (
          <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
              Bank Name
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF', marginTop: '2px' }}>
              {bankDetails.bankName}
            </div>
          </div>
        )}

        {vf.branch && bankDetails.branch && (
          <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
              Branch
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF', marginTop: '2px' }}>
              {bankDetails.branch}
            </div>
          </div>
        )}

        {vf.accountNumber && bankDetails.accountNumber && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
                Account Number
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: accentColor, marginTop: '2px', letterSpacing: '0.04em' }}>
                {bankDetails.accountNumber}
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(bankDetails.accountNumber, 'acc')}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                color: copiedField === 'acc' ? '#10B981' : (isLight ? '#475569' : '#CBD5E1'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.76rem',
                fontWeight: 600
              }}
            >
              {copiedField === 'acc' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedField === 'acc' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {vf.ifsc && bankDetails.ifsc && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
                IFSC Code
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: accentColor, marginTop: '2px', letterSpacing: '0.06em' }}>
                {bankDetails.ifsc}
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(bankDetails.ifsc, 'ifsc')}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                color: copiedField === 'ifsc' ? '#10B981' : (isLight ? '#475569' : '#CBD5E1'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.76rem',
                fontWeight: 600
              }}
            >
              {copiedField === 'ifsc' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedField === 'ifsc' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: isLight ? '#64748B' : '#82758F', padding: '0 4px' }}>
        <ShieldCheck size={14} color="#10B981" />
        <span>Published with verified owner consent. For business payment settlements only.</span>
      </div>
    </section>
  );
}
