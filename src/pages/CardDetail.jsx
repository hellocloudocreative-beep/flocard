import React from 'react';
import { ArrowRight, Cpu, Droplets, ShieldCheck, ArrowLeft, Check, Sparkles } from 'lucide-react';
import Card3DPreview from '../components/Card3DPreview';
import { EDITIONS } from '../lib/constants';
import { useData } from '../context/DataContext';
import { formatCurrencyINR } from '../lib/storage';

export default function CardDetail({ editionKey = 'purple' }) {
  const fallbackEdition = EDITIONS[editionKey] || EDITIONS.purple;
  const { getProductByEdition } = useData();
  const product = getProductByEdition(editionKey) || fallbackEdition;

  const isMetal = editionKey === 'metal';
  const isGold = editionKey === 'gold';
  const isPlatinum = editionKey === 'platinum';
  const isPurple = editionKey === 'purple';

  const accentColor = isGold ? '#E9C766' : isPlatinum ? '#CBD5E1' : isMetal ? '#CBD5E1' : '#A855F7';

  const formattedPrice = formatCurrencyINR(product.price);
  const formattedCompare = product.comparePrice && product.comparePrice > product.price
    ? formatCurrencyINR(product.comparePrice)
    : null;

  const ctaText = isGold
    ? 'Customize Gold Card'
    : isPlatinum
      ? 'Customize Platinum Card'
      : isMetal
        ? 'Customize Metal Card'
        : 'Customize Purple Card';

  const includedFeatures = product.features || [
    'NFC-enabled card, when included in configured product.',
    'Personalized name and professional role.',
    'Customizable card artwork.',
    'Digital profile connection, when included.',
    'QR code on the back, when included.'
  ];

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: '32px' }}>
          <a
            href="/cards"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem',
              color: 'var(--text-secondary)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Collection</span>
          </a>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 'clamp(24px, 5vw, 60px)',
            alignItems: 'center',
            marginBottom: '80px'
          }}
        >
          {/* Left: 3D Interactive Card Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Card3DPreview edition={editionKey} width={420} allowFlip={true} />
            <p style={{ marginTop: '24px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Hover to tilt &bull; Click card to flip front & back
            </p>
          </div>

          {/* Right: Edition Details & CTAs */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div
                className="badge-tag"
                style={{
                  backgroundColor: `${accentColor}22`,
                  color: isPlatinum ? '#E2E8F0' : accentColor,
                  border: `1px solid ${accentColor}44`,
                  borderRadius: '10px'
                }}
              >
                {product.badge || editionKey.toUpperCase()} EDITION
              </div>

              {product.featured && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '10px',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #FDE68A',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Sparkles size={11} />
                  <span>Featured</span>
                </span>
              )}

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '10px',
                  backgroundColor: product.availability === 'in_stock' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: product.availability === 'in_stock' ? '#10B981' : '#EF4444',
                  border: `1px solid ${product.availability === 'in_stock' ? '#10B98144' : '#EF444444'}`
                }}
              >
                {product.availability === 'in_stock' ? 'In Stock • Ready to Print' : product.availability === 'low_stock' ? 'Low Stock' : product.availability === 'pre_order' ? 'Pre-Order' : 'Unavailable'}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.4rem)', textTransform: 'uppercase', marginBottom: '14px', color: 'var(--text-primary)' }}>
              {product.name || fallbackEdition.name}
            </h1>

            <p style={{ fontSize: '1.15rem', color: accentColor, fontWeight: 600, marginBottom: '20px' }}>
              {product.tagline || fallbackEdition.tagline}
            </p>

            {/* Authoritative Price Block */}
            <div
              style={{
                background: 'var(--elevated-surface)',
                border: `1px solid ${accentColor}44`,
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '26px',
                boxShadow: 'var(--shadow-soft)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                {formattedPrice ? (
                  <>
                    <span style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      {formattedPrice}
                    </span>
                    {formattedCompare && (
                      <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {formattedCompare}
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>
                    Price coming soon
                  </span>
                )}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                MRP inclusive of custom UV/foil printing, encoded NXP NTAG216 chip & digital profile setup.
              </p>
            </div>

            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
              {product.description || fallbackEdition.description}
            </p>

            {/* Included Features List */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Included With Product
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                {includedFeatures.map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Check size={16} color={accentColor} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hardware highlights */}
            <div
              style={{
                background: 'var(--elevated-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '36px',
                boxShadow: 'var(--shadow-soft)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Surface Finish</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>{fallbackEdition.specs.finish}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>NFC Chip</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>{fallbackEdition.specs.chip}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Durability</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>{fallbackEdition.specs.durability}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Storage</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>{fallbackEdition.specs.capacity}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a
                href={`/designer?edition=${editionKey}`}
                className="btn btn-lg"
                style={{
                  padding: '14px 28px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  textDecoration: 'none',
                  background: isGold
                    ? 'linear-gradient(135deg, #FFF0A6 0%, #E9C766 50%, #C9972C 100%)'
                    : isPlatinum
                      ? 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)'
                      : isMetal
                        ? 'linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 50%, #64748B 100%)'
                        : 'linear-gradient(135deg, #A855F7 0%, #6B00FF 100%)',
                  color: isGold || isPlatinum || isMetal ? '#0F0E13' : '#FFFFFF',
                  boxShadow: `0 4px 18px ${accentColor}40`
                }}
              >
                <span>{ctaText}</span>
                <ArrowRight size={18} />
              </a>

              <a href="/how-it-works" className="btn btn-secondary btn-lg" style={{ borderRadius: '10px' }}>
                <span>How Tap Works</span>
              </a>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid-3">
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(107, 0, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-purple)', marginBottom: '16px' }}>
              <Cpu size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>High-Speed Contactless</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              13.56 MHz frequency protocol with instantaneous NFC coupling on all iOS 13+ and Android devices.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '16px' }}>
              <Droplets size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>IP68 Weatherproof</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Hermetically sealed internal antenna protects against water submersion, sweat, friction, and humidity.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-primary)', marginBottom: '16px' }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Permanent Dynamic URL</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Reprogram destination links anytime in the cloud without ever replacing or reprinting your physical card.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
