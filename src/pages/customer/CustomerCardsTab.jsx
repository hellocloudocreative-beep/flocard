/* ==========================================================================
   FLOCARD CUSTOMER DASHBOARD — MY CARDS TAB
   Manages real cards belonging to the authenticated customer.
   Includes Active/Pending/Inactive status indicators, QR code generation & download,
   and direct profile linking.
   ========================================================================== */

import React, { useState } from 'react';
import {
  Radio,
  ExternalLink,
  QrCode,
  Download,
  Share2,
  Eye,
  Edit3,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  X,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { EDITIONS } from '../../lib/constants';

export default function CustomerCardsTab({
  cards = [],
  profiles = [],
  orders = [],
  onViewOrder = null,
  onEditProfile = null
}) {
  const [selectedCardForQr, setSelectedCardForQr] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewCard, setPreviewCard] = useState(null);

  // Generate real QR code when modal is opened
  const handleOpenQrModal = async (card) => {
    setSelectedCardForQr(card);
    const destinationUrl = card.profileSlug
      ? `https://flocard.in/p/${card.profileSlug}`
      : `https://flocard.in/t/${card.cardCode}`;

    try {
      const url = await QRCode.toDataURL(destinationUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#08060D',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate QR code', err);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !selectedCardForQr) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `FLOCARD-QR-${selectedCardForQr.cardCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyCardLink = (card) => {
    const url = card.profileSlug
      ? `https://flocard.in/p/${card.profileSlug}`
      : `https://flocard.in/t/${card.cardCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            My NFC Smart Cards
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Physical NFC business cards assigned to your account and their live digital destinations.
          </p>
        </div>

        <a href="/designer" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
          <Sparkles size={14} />
          <span>New Card Design</span>
        </a>
      </div>

      {/* Cards List or Honest Empty State */}
      {cards.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--card-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
          }}
        >
          <Radio size={42} color="var(--border-color)" style={{ margin: '0 auto 14px', display: 'block' }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 6px', fontWeight: 700 }}>
            You haven't added any cards yet.
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Personalize your card in our interactive 3D studio, submit your artwork for precision manufacturing, and your active card will appear here.
          </p>
          <a href="/designer" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', gap: '6px' }}>
            <Sparkles size={14} />
            <span>Open 3D Card Designer</span>
          </a>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {cards.map((card) => {
            const ed = EDITIONS[card.edition] || EDITIONS.purple;
            const isCardActive = card.status === 'active';
            const isCardPending = card.status === 'in_stock' || card.status === 'assigned' || card.status === 'pending';
            const statusLabel = isCardActive ? 'Active' : isCardPending ? 'Pending' : 'Inactive';
            const statusColor = isCardActive ? '#10B981' : isCardPending ? '#F59E0B' : '#6B7280';

            return (
              <div
                key={card.id || card.cardCode}
                className="glass-panel"
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--card-surface)',
                  borderRadius: '16px',
                  border: `1px solid ${ed.accentColor}33`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                {/* Top Card Badge & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: `${ed.accentColor}18`,
                      color: ed.accentColor,
                      border: `1px solid ${ed.accentColor}33`,
                      textTransform: 'capitalize'
                    }}
                  >
                    {ed.name}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: `${statusColor}18`,
                      color: statusColor,
                      border: `1px solid ${statusColor}33`
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                    <span>{statusLabel}</span>
                  </span>
                </div>

                {/* Card Code & Chip Details */}
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {card.cardCode}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Microchip: <strong>{card.chipType || 'NXP NTAG216 (888 Bytes)'}</strong>
                  </div>
                  {card.profileSlug && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--accent-purple)', marginTop: '4px' }}>
                      Profile Destination: <strong>flocard.in/p/{card.profileSlug}</strong>
                    </div>
                  )}
                </div>

                {/* NFC Tap Metrics */}
                <div
                  style={{
                    backgroundColor: 'var(--elevated-surface)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.76rem'
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Verified NFC Taps:</span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{card.tapCount || 0}</strong>
                </div>

                {/* Actions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
                  <a
                    href={`/t/${card.cardCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-xs"
                    style={{ justifyContent: 'center', gap: '4px' }}
                  >
                    <Radio size={12} />
                    <span>Test Tap</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleOpenQrModal(card)}
                    className="btn btn-outline btn-xs"
                    style={{ justifyContent: 'center', gap: '4px' }}
                  >
                    <QrCode size={12} />
                    <span>Download QR</span>
                  </button>

                  {card.profileSlug && (
                    <a
                      href={`/p/${card.profileSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-xs"
                      style={{ justifyContent: 'center', gap: '4px' }}
                    >
                      <Eye size={12} />
                      <span>View Profile</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopyCardLink(card)}
                    className="btn btn-outline btn-xs"
                    style={{ justifyContent: 'center', gap: '4px' }}
                  >
                    {copiedLink ? <Check size={12} color="#10B981" /> : <Share2 size={12} />}
                    <span>{copiedLink ? 'Copied!' : 'Share Link'}</span>
                  </button>
                </div>

                {/* Associated Order Link if available */}
                {card.orderId && onViewOrder && (
                  <button
                    type="button"
                    onClick={() => onViewOrder(card.orderId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-purple)',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                      marginTop: '2px'
                    }}
                  >
                    <Package size={12} />
                    <span>View Manufacturing Order ({card.orderId})</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Download Modal */}
      {selectedCardForQr && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '420px',
              width: '100%',
              backgroundColor: 'var(--card-surface)',
              borderRadius: '20px',
              border: '1px solid var(--border-highlight)',
              padding: '28px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Dynamic Scannable QR
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCardForQr(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 18px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Scan to open verified FLOCARD profile for <strong>{selectedCardForQr.cardCode}</strong>.
            </p>

            {/* QR Image Container */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                padding: '16px',
                borderRadius: '16px',
                display: 'inline-block',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
              }}
            >
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="FLOCARD QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
              ) : (
                <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  Generating...
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px' }}
              >
                <Download size={14} />
                <span>Download High-Res PNG</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCardForQr(null)}
                className="btn btn-outline btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
