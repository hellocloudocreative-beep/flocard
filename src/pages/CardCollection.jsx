/* ==========================================================================
   FLOCARD CARD COLLECTION & SPECIFICATION COMPARISON
   ========================================================================== */

import React, { useState } from 'react';
import { ArrowRight, Sparkles, Check, Cpu, Shield, Zap, RefreshCw } from 'lucide-react';
import Card3DPreview from '../components/Card3DPreview';
import { EDITIONS } from '../lib/constants';

export default function CardCollection() {
  const [filter, setFilter] = useState('all');
  const [templateType, setTemplateType] = useState('standard');

  const editionKeys = filter === 'all' ? ['purple', 'gold', 'platinum'] : [filter];

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 40px)', paddingBottom: '100px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 50px' }}>
          <div className="badge-tag" style={{ marginBottom: '14px' }}>
            ENGINEERED HARDWARE
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)', textTransform: 'uppercase', marginBottom: '16px' }}>
            THE FLOCARD <span className="text-gradient-purple">COLLECTION</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            Three master-crafted editions combining aerospace-grade physical materials with secure encrypted NFC microcontrollers.
          </p>

          {/* Template & Edition Filter Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', marginTop: '28px' }}>
            {/* Template Selector */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(23, 16, 32, 0.95)',
                padding: '4px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                gap: '4px'
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
                background: 'rgba(23, 16, 32, 0.9)',
                padding: '4px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                gap: '4px'
              }}
            >
              {[
                { id: 'all', label: 'All Editions' },
                { id: 'purple', label: 'Purple (Signature)' },
                { id: 'gold', label: 'Gold Edition' },
                { id: 'platinum', label: 'Platinum Edition' }
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

        {/* Editions Grid */}
        <div className="grid-3" style={{ marginBottom: '80px', alignItems: 'stretch' }}>
          {editionKeys.map(key => {
            const item = EDITIONS[key];
            const isPurple = key === 'purple';
            return (
              <div
                key={key}
                className={`glass-panel ${isPurple ? 'glass-panel-glow' : ''}`}
                style={{
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: isPurple
                    ? 'linear-gradient(180deg, rgba(23, 16, 32, 0.95) 0%, rgba(32, 11, 59, 0.5) 100%)'
                    : 'rgba(16, 11, 25, 0.85)',
                  position: 'relative'
                }}
              >
                {item.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-purple))',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={11} />
                    <span>Most Popular</span>
                  </div>
                )}

                <div>
                  <div style={{ marginBottom: '28px', textAlign: 'center' }}>
                    <Card3DPreview edition={key} templateType={templateType} width={310} allowFlip={true} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.4rem', color: '#ffffff', textTransform: 'uppercase' }}>
                      {item.name}
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '20px' }}>
                    {item.description}
                  </p>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--light-lavender)', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Key Specifications
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={14} color="var(--accent-purple)" />
                        <span>{item.specs.material}</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={14} color="var(--accent-purple)" />
                        <span>{item.specs.chip}</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={14} color="var(--accent-purple)" />
                        <span>{item.specs.durability}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href={`/designer?edition=${key}&template=${templateType}`}
                    className={`btn ${isPurple ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%' }}
                  >
                    <span>Customize {item.name}</span>
                    <ArrowRight size={16} />
                  </a>

                  <a
                    href={key === 'purple' ? '/cards/custom-purple' : `/cards/${key}`}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.82rem',
                      color: 'var(--light-lavender)',
                      padding: '6px'
                    }}
                  >
                    View Technical Details &rarr;
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Specification Matrix */}
        <div className="glass-panel" style={{ padding: '40px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '8px' }}>
              HARDWARE & TECHNOLOGY COMPARISON
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Every FLOCARD is manufactured to international ISO/IEC 7810 ID-1 standard with integrated contactless microcircuits.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--light-lavender)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <th style={{ padding: '14px 16px' }}>Feature</th>
                  <th style={{ padding: '14px 16px' }}>Purple Edition</th>
                  <th style={{ padding: '14px 16px' }}>Gold Edition</th>
                  <th style={{ padding: '14px 16px' }}>Platinum Edition</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <tr style={{ borderBottom: '1px solid rgba(48, 36, 61, 0.4)' }}>
                  <td style={{ padding: '14px 16px', color: '#ffffff', fontWeight: 600 }}>Surface Material</td>
                  <td style={{ padding: '14px 16px', color: 'var(--accent-purple)' }}>Matte Obsidian + UV Gloss</td>
                  <td style={{ padding: '14px 16px' }}>Obsidian + 24K Gold Foil</td>
                  <td style={{ padding: '14px 16px' }}>Satin Alloy Stainless Steel</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(48, 36, 61, 0.4)' }}>
                  <td style={{ padding: '14px 16px', color: '#ffffff', fontWeight: 600 }}>NFC Microchip</td>
                  <td style={{ padding: '14px 16px' }}>NXP NTAG216 (High-Freq)</td>
                  <td style={{ padding: '14px 16px' }}>NXP NTAG216 (High-Freq)</td>
                  <td style={{ padding: '14px 16px' }}>NXP NTAG216 (High-Freq)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(48, 36, 61, 0.4)' }}>
                  <td style={{ padding: '14px 16px', color: '#ffffff', fontWeight: 600 }}>Memory Storage</td>
                  <td style={{ padding: '14px 16px' }}>888 Bytes EEPROM</td>
                  <td style={{ padding: '14px 16px' }}>888 Bytes EEPROM</td>
                  <td style={{ padding: '14px 16px' }}>888 Bytes EEPROM</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(48, 36, 61, 0.4)' }}>
                  <td style={{ padding: '14px 16px', color: '#ffffff', fontWeight: 600 }}>Operating Frequency</td>
                  <td style={{ padding: '14px 16px' }}>13.56 MHz (ISO 14443A)</td>
                  <td style={{ padding: '14px 16px' }}>13.56 MHz (ISO 14443A)</td>
                  <td style={{ padding: '14px 16px' }}>13.56 MHz (ISO 14443A)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(48, 36, 61, 0.4)' }}>
                  <td style={{ padding: '14px 16px', color: '#ffffff', fontWeight: 600 }}>Dynamic QR Code</td>
                  <td style={{ padding: '14px 16px' }}>Scannable Vector (Violet)</td>
                  <td style={{ padding: '14px 16px' }}>Scannable Vector (Gold)</td>
                  <td style={{ padding: '14px 16px' }}>Scannable Vector (Chrome)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(48, 36, 61, 0.4)' }}>
                  <td style={{ padding: '14px 16px', color: '#ffffff', fontWeight: 600 }}>Water Resistance</td>
                  <td style={{ padding: '14px 16px' }}>IP68 Submersible</td>
                  <td style={{ padding: '14px 16px' }}>IP68 Submersible</td>
                  <td style={{ padding: '14px 16px' }}>IP68 Submersible</td>
                </tr>
                <tr>
                  <td style={{ padding: '14px 16px', color: '#ffffff', fontWeight: 600 }}>App Required?</td>
                  <td style={{ padding: '14px 16px', color: 'var(--success)' }}>No App Needed</td>
                  <td style={{ padding: '14px 16px', color: 'var(--success)' }}>No App Needed</td>
                  <td style={{ padding: '14px 16px', color: 'var(--success)' }}>No App Needed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
