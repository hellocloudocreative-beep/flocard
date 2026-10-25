/* ==========================================================================
   FLOCARD CARD COLLECTION & SPECIFICATION COMPARISON
   Theme-aware product collection and hardware comparison matrix.
   ========================================================================== */

import React, { useState } from 'react';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import Card3DPreview from '../components/Card3DPreview';
import { EDITIONS } from '../lib/constants';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { formatCurrencyINR } from '../lib/storage';
import SpotlightCard from '../components/SpotlightCard/SpotlightCard';

export default function CardCollection() {
  const [filter, setFilter] = useState('all');
  const [templateType, setTemplateType] = useState('standard');
  const { isLight } = useTheme();
  const { products, getProductByEdition } = useData();

  // Active, ordered editions configured by admin (hidden if disabled)
  const activeProducts = (products || [])
    .filter(p => p.status !== 'disabled' && p.isActive !== false)
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  const activeEditionKeys = activeProducts.map(p => p.editionKey);
  const editionKeys = filter === 'all'
    ? activeEditionKeys
    : activeEditionKeys.filter(k => k === filter);

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 50px' }}>
          <div className="badge-tag" style={{ marginBottom: '14px' }}>
            ENGINEERED HARDWARE
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)', textTransform: 'uppercase', marginBottom: '16px', color: 'var(--text-primary)' }}>
            THE FLOCARD <span className="text-gradient-purple">COLLECTION</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            {activeProducts.length} master-crafted edition{activeProducts.length === 1 ? '' : 's'} combining aerospace-grade physical materials with secure encrypted NFC microcontrollers.
          </p>

          {/* Template & Edition Filter Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', marginTop: '28px' }}>
            {/* Template Selector */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--elevated-surface)',
                padding: '4px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                gap: '4px',
                boxShadow: 'var(--shadow-soft)'
              }}
            >
              <button
                type="button"
                onClick={() => setTemplateType('standard')}
                style={{
                  background: templateType === 'standard' ? 'var(--primary-purple)' : 'transparent',
                  color: templateType === 'standard' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '7px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Theme 1: Standard FLOCARD
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('customer_logo')}
                style={{
                  background: templateType === 'customer_logo' ? 'var(--primary-purple)' : 'transparent',
                  color: templateType === 'customer_logo' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '7px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Theme 2: Customer Logo Badge
              </button>
            </div>

            {/* Edition Filter Pills */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--elevated-surface)',
                padding: '4px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                gap: '4px',
                boxShadow: 'var(--shadow-soft)',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}
            >
              {[
                { id: 'all', label: 'All Editions' },
                ...activeProducts.map(p => ({
                  id: p.editionKey,
                  label: `${p.name}${p.editionKey === 'purple' ? ' (Signature)' : p.editionKey === 'white' ? ' (New)' : ''}`
                }))
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  style={{
                    background: filter === tab.id ? 'var(--primary-purple)' : 'transparent',
                    color: filter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editions Grid with React Bits <SpotlightCard /> */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px 24px', paddingTop: '18px', marginBottom: '80px', alignItems: 'stretch' }}>
          {editionKeys.map(key => {
            const fallbackItem = EDITIONS[key] || EDITIONS.gold;
            const product = getProductByEdition(key) || fallbackItem;
            const isMetal = key === 'metal';
            const isGold = key === 'gold';
            const isPlatinum = key === 'platinum';
            const isPurple = key === 'purple';
            const isWhite = key === 'white';

            const spotlightColor = isWhite
              ? 'rgba(255, 255, 255, 0.45)'
              : isGold
              ? 'rgba(233, 199, 102, 0.42)'
              : isPlatinum
                ? 'rgba(203, 213, 225, 0.42)'
                : isMetal
                  ? 'rgba(148, 163, 184, 0.42)'
                  : 'rgba(168, 85, 247, 0.52)';

            const accentColor = isGold ? '#E9C766' : isPlatinum ? '#CBD5E1' : isMetal ? '#CBD5E1' : '#A855F7';

            const formattedPrice = formatCurrencyINR(product.price);
            const formattedCompare = product.comparePrice && product.comparePrice > product.price
              ? formatCurrencyINR(product.comparePrice)
              : null;

            // Edition CTA Text
            const ctaText = isGold
              ? 'Customize Gold Card'
              : isPlatinum
                ? 'Customize Platinum Card'
                : isMetal
                  ? 'Customize Metal Card'
                  : 'Customize Purple Card';

            // Features actually included in the product configuration
            const includedFeatures = product.features || [
              'NFC-enabled card, when included in the configured product.',
              'Personalized name and professional role.',
              'Customizable card artwork.',
              'Digital profile connection, when included.',
              'QR code on the back, when included.'
            ];

            return (
              <div
                key={key}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                {/* Most Popular Badge on Purple Edition (Placed outside SpotlightCard to prevent overflow clipping) */}
                {isPurple && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-13px',
                      right: '24px',
                      background: 'linear-gradient(135deg, var(--primary-purple), var(--deep-violet))',
                      color: '#FFFFFF',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      padding: '5px 14px',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 4px 16px rgba(107, 0, 255, 0.45), 0 0 0 1px rgba(168, 85, 247, 0.4)',
                      zIndex: 30,
                      pointerEvents: 'none'
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Most Popular</span>
                  </div>
                )}

                <SpotlightCard
                  theme="dark"
                  spotlightColor={spotlightColor}
                  intensity={0.22}
                  spotlightSize={280}
                  softness={0.7}
                  borderGlow={0.65}
                  proximity={80}
                  className="flocard-edition-pricing-card"
                  style={{
                    padding: '24px 16px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '16px',
                    border: `1px solid ${accentColor}38`,
                    background: isPurple
                      ? 'linear-gradient(180deg, rgba(23, 16, 32, 0.96) 0%, rgba(32, 11, 59, 0.6) 100%)'
                      : isGold
                        ? 'linear-gradient(180deg, rgba(22, 19, 14, 0.96) 0%, rgba(32, 26, 15, 0.55) 100%)'
                        : 'linear-gradient(180deg, rgba(18, 20, 24, 0.96) 0%, rgba(26, 30, 36, 0.55) 100%)',
                    height: '100%',
                    flex: 1
                  }}
                >
                <div>
                  {/* Card 3D Preview (Front & Back interactive flip) */}
                  <div style={{ marginBottom: '24px', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Card3DPreview edition={key} templateType={templateType} width={248} allowFlip={true} />
                    <div style={{ marginTop: '20px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Click card to flip front & back &bull; Hover to tilt
                    </div>
                  </div>

                  {/* Edition Name */}
                  <div style={{ marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: accentColor,
                        display: 'inline-block',
                        marginBottom: '4px'
                      }}
                    >
                      {product.badge || key?.toUpperCase()} EDITION
                    </span>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        textTransform: 'uppercase',
                        letterSpacing: '-0.01em',
                        margin: 0
                      }}
                    >
                      {product.name || fallbackItem.name}
                    </h3>
                  </div>

                  {/* Authoritative Price Display */}
                  <div style={{ margin: '12px 0 14px', padding: '10px 12px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                      {formattedPrice ? (
                        <>
                          <span
                            style={{
                              fontSize: '1.45rem',
                              fontWeight: 800,
                              color: '#FFFFFF',
                              fontFamily: 'var(--font-heading, Sora, sans-serif)',
                              letterSpacing: '-0.02em'
                            }}
                          >
                            {formattedPrice}
                          </span>
                          {formattedCompare && (
                            <span
                              style={{
                                fontSize: '0.88rem',
                                color: 'rgba(255, 255, 255, 0.45)',
                                textDecoration: 'line-through'
                              }}
                            >
                              {formattedCompare}
                            </span>
                          )}
                        </>
                      ) : (
                        <span
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            color: '#F59E0B'
                          }}
                        >
                          Price coming soon
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '4px' }}>
                      MRP incl. of all taxes &bull; Includes dynamic NFC redirection
                    </div>
                  </div>

                  {/* Short description */}
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.45, marginBottom: '16px' }}>
                    {product.description || fallbackItem.description}
                  </p>

                  {/* Key Included Features (Strictly configured features) */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Key Included Features
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.82)' }}>
                      {includedFeatures.map((feat, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <Check size={13} color={accentColor} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ lineHeight: 1.4 }}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTAs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <a
                    href={`/designer?edition=${key}&template=${templateType}`}
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '11px 18px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      background: isGold
                        ? 'linear-gradient(135deg, #FFF0A6 0%, #E9C766 50%, #C9972C 100%)'
                        : isPlatinum
                          ? 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)'
                          : isMetal
                            ? 'linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 50%, #64748B 100%)'
                            : 'linear-gradient(135deg, #A855F7 0%, #6B00FF 100%)',
                      color: isGold || isPlatinum || isMetal ? '#0F0E13' : '#FFFFFF',
                      boxShadow: `0 4px 16px ${accentColor}40`
                    }}
                  >
                    <span>{ctaText}</span>
                    <ArrowRight size={15} />
                  </a>

                  <a
                    href={key === 'purple' ? '/cards/custom-purple' : `/cards/${key}`}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.78rem',
                      color: accentColor,
                      fontWeight: 600,
                      padding: '6px',
                      textDecoration: 'none',
                      opacity: 0.85
                    }}
                  >
                    View Technical Details &rarr;
                  </a>
                </div>
              </SpotlightCard>
            </div>
          );
        })}
        </div>

        {/* Technical Specification Matrix */}
        <div className="glass-panel" style={{ padding: '40px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>
              HARDWARE & TECHNOLOGY COMPARISON
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Every FLOCARD is manufactured to international ISO/IEC 7810 ID-1 standard with integrated contactless microcircuits.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--primary-purple)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <th style={{ padding: '14px 16px' }}>Feature</th>
                  <th style={{ padding: '14px 16px' }}>Platinum Edition</th>
                  <th style={{ padding: '14px 16px' }}>Purple Edition</th>
                  <th style={{ padding: '14px 16px' }}>Gold Edition</th>
                  <th style={{ padding: '14px 16px' }}>Metal Edition</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>Surface Material</td>
                  <td style={{ padding: '14px 16px' }}>Satin Alloy Stainless Steel</td>
                  <td style={{ padding: '14px 16px', color: 'var(--primary-purple)', fontWeight: 600 }}>Matte Obsidian + UV Gloss</td>
                  <td style={{ padding: '14px 16px' }}>Obsidian + 24K Gold Foil</td>
                  <td style={{ padding: '14px 16px', color: '#CBD5E1', fontWeight: 600 }}>Brushed Gunmetal Steel</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>NFC Microchip</td>
                  <td style={{ padding: '14px 16px' }}>NXP NTAG216 (High-Freq)</td>
                  <td style={{ padding: '14px 16px' }}>NXP NTAG216 (High-Freq)</td>
                  <td style={{ padding: '14px 16px' }}>NXP NTAG216 (High-Freq)</td>
                  <td style={{ padding: '14px 16px' }}>NXP NTAG216 (High-Freq)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>Memory Storage</td>
                  <td style={{ padding: '14px 16px' }}>888 Bytes EEPROM</td>
                  <td style={{ padding: '14px 16px' }}>888 Bytes EEPROM</td>
                  <td style={{ padding: '14px 16px' }}>888 Bytes EEPROM</td>
                  <td style={{ padding: '14px 16px' }}>888 Bytes EEPROM</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>Operating Frequency</td>
                  <td style={{ padding: '14px 16px' }}>13.56 MHz (ISO 14443A)</td>
                  <td style={{ padding: '14px 16px' }}>13.56 MHz (ISO 14443A)</td>
                  <td style={{ padding: '14px 16px' }}>13.56 MHz (ISO 14443A)</td>
                  <td style={{ padding: '14px 16px' }}>13.56 MHz (ISO 14443A)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>Dynamic QR Code</td>
                  <td style={{ padding: '14px 16px' }}>Scannable Vector (Chrome)</td>
                  <td style={{ padding: '14px 16px' }}>Scannable Vector (Violet)</td>
                  <td style={{ padding: '14px 16px' }}>Scannable Vector (Gold)</td>
                  <td style={{ padding: '14px 16px' }}>Scannable Vector (White)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>Water Resistance</td>
                  <td style={{ padding: '14px 16px' }}>IP68 Submersible</td>
                  <td style={{ padding: '14px 16px' }}>IP68 Submersible</td>
                  <td style={{ padding: '14px 16px' }}>IP68 Submersible</td>
                  <td style={{ padding: '14px 16px' }}>IP68 Submersible</td>
                </tr>
                <tr>
                  <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>App Required?</td>
                  <td style={{ padding: '14px 16px', color: 'var(--success)', fontWeight: 600 }}>No App Needed</td>
                  <td style={{ padding: '14px 16px', color: 'var(--success)', fontWeight: 600 }}>No App Needed</td>
                  <td style={{ padding: '14px 16px', color: 'var(--success)', fontWeight: 600 }}>No App Needed</td>
                  <td style={{ padding: '14px 16px', color: 'var(--success)', fontWeight: 600 }}>No App Needed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
