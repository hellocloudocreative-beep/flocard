/* ==========================================================================
   FLOCARDS PORTFOLIO & WORK GALLERY SECTION
   Features:
   - Responsive grid/masonry display with hover micro-animations
   - Full-screen lightbox viewer with zoom, title, category, and external link
   - Lazy-loaded permanent image assets
   - Hides naturally when empty
   ========================================================================== */

import React, { useState } from 'react';
import { Briefcase, ExternalLink, X, Maximize2, Sparkles, FileText, Download } from 'lucide-react';

export default function PortfolioSection({
  portfolio = [],
  accentColor = '#A855F7',
  glowColor = '#6B00FF',
  isLight = false
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  const published = Array.isArray(portfolio)
    ? portfolio.filter(item => Boolean(item && (item.image || item.pdfUrl)))
    : [];

  if (published.length === 0) {
    return null;
  }

  return (
    <section
      className="flocard-profile-section flocard-portfolio-section"
      style={{
        width: '100%',
        margin: '0 auto',
        padding: '36px 0',
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ marginBottom: '24px' }}>
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
            <Briefcase size={20} />
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
              Featured Portfolio & Projects
            </h2>
            <span style={{ fontSize: '0.78rem', color: isLight ? '#64748B' : '#94A3B8' }}>
              Selected Works & Case Studies
            </span>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {published.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => setSelectedItem(item)}
            style={{
              borderRadius: '18px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              aspectRatio: '16/10',
              backgroundColor: isLight ? '#E2E8F0' : '#130B22',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.04)' : '0 8px 24px rgba(0,0,0,0.3)',
              transition: 'transform 0.22s ease, box-shadow 0.22s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 12px 30px ${glowColor}25`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isLight ? '0 4px 16px rgba(0,0,0,0.04)' : '0 8px 24px rgba(0,0,0,0.3)';
            }}
          >
            {/* PDF Indicator Badge */}
            {item.pdfUrl && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  zIndex: 3,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(239, 68, 68, 0.92)',
                  color: '#FFFFFF',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <FileText size={11} />
                <span>PDF</span>
              </div>
            )}

            {item.image ? (
              <img
                src={item.image}
                alt={item.title || 'Portfolio work'}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1E1238 0%, #0F091C 100%)',
                  color: '#EF4444'
                }}
              >
                <FileText size={36} />
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#FFFFFF' }}>PDF Document</span>
              </div>
            )}

            {/* Dark overlay with metadata */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(8,6,13,0.92) 0%, rgba(8,6,13,0.3) 50%, transparent 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '16px',
                boxSizing: 'border-box'
              }}
            >
              {item.category && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: accentColor,
                    marginBottom: '4px'
                  }}
                >
                  {item.category}
                </span>
              )}
              <h3
                style={{
                  fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: 0,
                  lineHeight: 1.3
                }}
              >
                {item.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(5, 3, 10, 0.92)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            boxSizing: 'border-box'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '840px',
              width: '100%',
              backgroundColor: '#0F091C',
              borderRadius: '24px',
              border: `1.5px solid ${accentColor}40`,
              overflow: 'hidden',
              boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 30px ${glowColor}25`,
              position: 'relative'
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={18} />
            </button>

            {/* Image or PDF Document Cover */}
            <div style={{ width: '100%', maxHeight: '480px', minHeight: selectedItem.image ? 'auto' : '220px', overflow: 'hidden', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedItem.image ? (
                <img
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  style={{
                    width: '100%',
                    maxHeight: '480px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                    <FileText size={32} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 700 }}>
                      {selectedItem.pdfName || 'Project PDF Document'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>
                      Click below to view or download the attached document
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ padding: '24px' }}>
              {selectedItem.category && (
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: accentColor, marginBottom: '4px' }}>
                  {selectedItem.category}
                </div>
              )}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
                {selectedItem.title}
              </h3>
              {selectedItem.description && (
                <p style={{ fontSize: '0.88rem', color: '#D5C9E5', lineHeight: 1.6, margin: '0 0 16px' }}>
                  {selectedItem.description}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                {selectedItem.pdfUrl && (
                  <a
                    href={selectedItem.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 18px',
                      borderRadius: '9999px',
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <FileText size={15} />
                    <span>{selectedItem.pdfName ? `Open PDF (${selectedItem.pdfName})` : 'Open PDF Document'}</span>
                    <ExternalLink size={13} />
                  </a>
                )}

                {selectedItem.link && (
                  <a
                    href={selectedItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 18px',
                      borderRadius: '9999px',
                      backgroundColor: accentColor,
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      fontSize: '0.84rem',
                      fontWeight: 700
                    }}
                  >
                    <span>View Project</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
