/* ==========================================================================
   FLOCARDS BUSINESS HOURS SECTION
   Displays:
   - Real-time status badge: Open now / Closed now / Opens at [time]
   - Comprehensive weekly schedule (Monday through Sunday)
   - Multiple time slots per day support
   - Business timezone indicator
   - Special closures notice
   ========================================================================== */

import React, { useMemo } from 'react';
import { Clock, Calendar, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import {
  DAYS_OF_WEEK,
  DAY_LABELS,
  formatTime12h,
  calculateBusinessStatus,
  getNowInTimezone
} from '../../lib/businessHoursService';

export default function BusinessHoursSection({
  businessHours,
  accentColor = '#A855F7',
  glowColor = '#6B00FF',
  isLight = false
}) {
  if (!businessHours || businessHours.enabled === false) {
    return null;
  }

  const schedule = businessHours.schedule || {};
  const timezone = businessHours.timezone || 'Asia/Kolkata';
  const specialClosures = Array.isArray(businessHours.specialClosures) ? businessHours.specialClosures : [];

  // Live status
  const status = useMemo(() => {
    return calculateBusinessStatus(businessHours);
  }, [businessHours]);

  const nowInfo = useMemo(() => {
    return getNowInTimezone(timezone);
  }, [timezone]);

  return (
    <section
      className="flocard-profile-section flocard-hours-section"
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
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
              <Clock size={20} />
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
                Business Hours
              </h2>
              <span style={{ fontSize: '0.78rem', color: isLight ? '#64748B' : '#94A3B8' }}>
                Schedule & Consultation Availability
              </span>
            </div>
          </div>

          {/* Live Status Badge */}
          {status && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: status.isOpen
                  ? (isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.18)')
                  : (isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.15)'),
                border: `1px solid ${status.isOpen ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.3)'}`,
                boxShadow: status.isOpen ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: status.isOpen ? '#10B981' : '#EF4444',
                  boxShadow: status.isOpen ? '0 0 8px #10B981' : 'none',
                  display: 'inline-block'
                }}
              />
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: status.isOpen ? '#10B981' : '#F87171'
                }}
              >
                {status.badge}
              </span>
              <span
                style={{
                  fontSize: '0.78rem',
                  color: isLight ? '#475569' : '#D1D5DB'
                }}
              >
                • {status.detail}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '10px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {DAYS_OF_WEEK.map((dayKey) => {
          const dayConfig = schedule[dayKey] || { isOpen: false, slots: [] };
          const isToday = nowInfo.dayKey === dayKey;

          return (
            <div
              key={dayKey}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: '14px',
                backgroundColor: isToday
                  ? (isLight ? `${accentColor}12` : 'rgba(168, 85, 247, 0.12)')
                  : (isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)'),
                border: isToday
                  ? `1.5px solid ${accentColor}60`
                  : `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)'}`,
                boxSizing: 'border-box',
                transition: 'background-color 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday
                      ? (isLight ? '#130B22' : '#FFFFFF')
                      : (isLight ? '#334155' : '#D5C9E5')
                  }}
                >
                  {DAY_LABELS[dayKey]}
                </span>
                {isToday && (
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: accentColor,
                      color: '#FFFFFF'
                    }}
                  >
                    Today
                  </span>
                )}
              </div>

              <div>
                {dayConfig.isOpen && Array.isArray(dayConfig.slots) && dayConfig.slots.length > 0 ? (
                  <div style={{ textAlign: 'right' }}>
                    {dayConfig.slots.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          color: isToday ? (isLight ? '#0F172A' : '#FFFFFF') : (isLight ? '#475569' : '#E2D9F3')
                        }}
                      >
                        {formatTime12h(slot.open)} – {formatTime12h(slot.close)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: isLight ? '#94A3B8' : '#64748B'
                    }}
                  >
                    Closed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timezone & Special Closures Footer Note */}
      <div
        style={{
          marginTop: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.74rem',
          color: isLight ? '#64748B' : '#82758F',
          padding: '0 4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={13} color={accentColor} />
          <span>Business Timezone: {timezone}</span>
        </div>
        {businessHours.notes && (
          <div style={{ fontStyle: 'italic' }}>
            {businessHours.notes}
          </div>
        )}
      </div>
    </section>
  );
}
