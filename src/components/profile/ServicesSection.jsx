/* ==========================================================================
   FLOCARDS SERVICES SHOWCASE SECTION
   Features:
   - Image-led responsive layout (not constrained to generic bordered cards)
   - Price, duration badges, and direct Book / Enquire action triggers
   - Smooth anchor scroll to booking section when "Book Now" is pressed
   - Seamless dark/light theme integration
   ========================================================================== */

import React from 'react';
import { Layers, Calendar, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';

export default function ServicesSection({
  services = [],
  onSelectServiceForBooking = () => {},
  whatsapp = '',
  email = '',
  accentColor = '#A855F7',
  glowColor = '#6B00FF',
  isLight = false
}) {
  const published = Array.isArray(services)
    ? services.filter(s => s.visible !== false)
    : [];

  if (published.length === 0) {
    return null;
  }

  const sorted = [...published].sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));

  const handleAction = (service) => {
    if (service.actionType === 'contact') {
      const cleanWa = String(whatsapp).replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(`Hi, I saw your service "${service.title}" on your FLOCARD and would like to enquire.`);
      if (cleanWa) {
        window.open(`https://wa.me/${cleanWa}?text=${msg}`, '_blank', 'noopener,noreferrer');
      } else if (email) {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Enquiry: ${service.title}`)}`;
      }
    } else {
      // Default: trigger appointment booking
      onSelectServiceForBooking(service.id);
      const bookingEl = document.getElementById('booking-section');
      if (bookingEl) {
        bookingEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      className="flocard-profile-section flocard-services-section"
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
            <Layers size={20} />
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
              Services & Offerings
            </h2>
            <span style={{ fontSize: '0.78rem', color: isLight ? '#64748B' : '#94A3B8' }}>
              Professional Capabilities & Solutions
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '16px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {sorted.map((srv, idx) => {
          const hasImage = Boolean(srv.image || srv.thumbnail);
          return (
            <div
              key={srv.id || idx}
              style={{
                borderRadius: '20px',
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.035)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.07)'}`,
                boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.04)' : '0 10px 30px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
            >
              {/* Optional Service Image Header */}
              {hasImage && (
                <div style={{ width: '100%', height: '160px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={srv.image || srv.thumbnail}
                    alt={srv.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)'
                    }}
                  />
                  {srv.duration && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(10px)',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 600
                      }}
                    >
                      ⏱ {srv.duration}
                    </div>
                  )}
                </div>
              )}

              {/* Service Details */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-heading, 'Sora', sans-serif)",
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: isLight ? '#0F172A' : '#FFFFFF',
                      margin: 0,
                      lineHeight: 1.3
                    }}
                  >
                    {srv.title}
                  </h3>

                  {/* Price Tag */}
                  {srv.price && (
                    <span
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: accentColor,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        backgroundColor: `${accentColor}15`,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {srv.price}
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: '0.84rem',
                    color: isLight ? '#475569' : '#D1D5DB',
                    lineHeight: 1.55,
                    margin: '0 0 16px',
                    flex: 1
                  }}
                >
                  {srv.description || srv.desc}
                </p>

                {/* Footer Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}` }}>
                  {!hasImage && srv.duration && (
                    <span style={{ fontSize: '0.76rem', color: isLight ? '#64748B' : '#94A3B8' }}>
                      ⏱ {srv.duration}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAction(srv)}
                    style={{
                      marginLeft: 'auto',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: srv.actionType === 'contact' ? 'rgba(37, 211, 102, 0.15)' : `${accentColor}18`,
                      color: srv.actionType === 'contact' ? '#25D366' : accentColor,
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.16s ease'
                    }}
                  >
                    {srv.actionType === 'contact' ? (
                      <>
                        <MessageCircle size={14} />
                        <span>Enquire Now</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={14} />
                        <span>Book Service</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
