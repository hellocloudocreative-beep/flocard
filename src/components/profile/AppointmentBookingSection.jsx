/* ==========================================================================
   FLOCARDS APPOINTMENT BOOKING SECTION
   Interactive booking engine for public digital profiles:
   - Dynamic date selection (upcoming 14-30 days)
   - Real-time time slot generation via appointmentService
   - Service selection linkage
   - Name, Phone, Email & Notes collection
   - Double-booking prevention & server-side validation
   - Unique reference code generation & confirmation
   ========================================================================== */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import {
  generateAvailableSlots,
  submitAppointmentBooking,
  getAppointments,
  DEFAULT_BOOKING_CONFIG
} from '../../lib/appointmentService';
import { getNowInTimezone } from '../../lib/businessHoursService';

export default function AppointmentBookingSection({
  profile,
  businessHours,
  bookingConfig = DEFAULT_BOOKING_CONFIG,
  preselectedServiceId = null,
  accentColor = '#A855F7',
  glowColor = '#6B00FF',
  isLight = false
}) {
  const cfg = { ...DEFAULT_BOOKING_CONFIG, ...(profile?.bookingConfig || {}), ...bookingConfig };

  if (cfg.enabled === false) {
    return null;
  }

  const timezone = businessHours?.timezone || 'Asia/Kolkata';
  const nowInfo = useMemo(() => getNowInTimezone(timezone), [timezone]);

  // Generate upcoming dates (up to maxAdvanceDays or 14 days)
  const availableDates = useMemo(() => {
    const dates = [];
    const maxDays = Math.min(cfg.maxAdvanceDays || 30, 21);
    const today = new Date();

    for (let i = 0; i < maxDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();

      dates.push({
        dateStr,
        dayName,
        monthName,
        dayNum,
        isToday: i === 0
      });
    }
    return dates;
  }, [cfg.maxAdvanceDays]);

  const [selectedDate, setSelectedDate] = useState(() => availableDates[0]?.dateStr || nowInfo.dateStr);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || '');

  // Form input states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [existingBookings, setExistingBookings] = useState([]);

  // Fetch current bookings for this profile
  useEffect(() => {
    let isMounted = true;
    if (profile?.slug) {
      getAppointments(profile.slug)
        .then((bList) => {
          if (isMounted) setExistingBookings(bList || []);
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [profile?.slug]);

  // Compute available slots for currently selected date
  const availableSlots = useMemo(() => {
    if (!selectedDate || !businessHours) return [];
    return generateAvailableSlots({
      dateStr: selectedDate,
      businessHours,
      bookingConfig: cfg,
      existingBookings
    });
  }, [selectedDate, businessHours, cfg, existingBookings]);

  // Reset selected slot if it's no longer available on date change
  useEffect(() => {
    if (selectedSlot && !availableSlots.some(s => s.time === selectedSlot.time)) {
      setSelectedSlot(null);
    }
  }, [selectedDate, availableSlots]);

  const publishedServices = useMemo(() => {
    const list = Array.isArray(profile?.services) ? profile.services : [];
    return list.filter(s => s.visible !== false);
  }, [profile?.services]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedSlot) {
      setErrorMessage('Please select a time slot for your appointment.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please provide a contact phone number or WhatsApp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedService = publishedServices.find(s => s.id === selectedServiceId);

      const res = await submitAppointmentBooking({
        profileSlug: profile.slug,
        profileId: profile.id,
        serviceId: selectedServiceId || null,
        serviceName: selectedService ? selectedService.title : '',
        customerName,
        customerEmail,
        customerPhone,
        bookingDate: selectedDate,
        startTime: selectedSlot.time,
        endTime: selectedSlot.endTime,
        notes,
        businessHours,
        bookingConfig: cfg
      });

      setBookingResult(res);
      // Refresh local existing bookings to immediately reserve slot
      if (res.appointment) {
        setExistingBookings(prev => [...prev, res.appointment]);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setBookingResult(null);
    setSelectedSlot(null);
    setNotes('');
  };

  return (
    <section
      id="booking-section"
      className="flocard-profile-section flocard-booking-section"
      style={{
        width: '100%',
        margin: '0 auto',
        padding: '36px 0',
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box'
      }}
    >
      {/* Section Header */}
      <div style={{ marginBottom: '20px' }}>
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
            <CalendarIcon size={20} />
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
              {cfg.title || 'Book an Appointment'}
            </h2>
            <span style={{ fontSize: '0.78rem', color: isLight ? '#64748B' : '#94A3B8' }}>
              {cfg.subtitle || 'Select an available time slot for an in-person or virtual consultation.'}
            </span>
          </div>
        </div>
      </div>

      {/* Event Host / Author Capsule */}
      {profile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: accentColor,
                color: '#FFFFFF',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.name?.charAt(0) || 'H'
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isLight ? '#130B22' : '#FFFFFF' }}>
                  {profile.name}
                </span>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: `${accentColor}20`, color: accentColor }}>
                  HOST / AUTHOR
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: isLight ? '#64748B' : '#94A3B8' }}>
                {profile.role ? `${profile.role}${profile.company ? ` • ${profile.company}` : ''}` : 'Verified Digital Profile'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: accentColor, fontWeight: 600 }}>
            <Clock size={13} />
            <span>{cfg.slotDurationMinutes || 30} mins</span>
          </div>
        </div>
      )}

      {/* Confirmation State */}
      {bookingResult ? (
        <div
          style={{
            padding: '28px',
            borderRadius: '20px',
            backgroundColor: isLight ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)',
            border: '1.5px solid rgba(16, 185, 129, 0.4)',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', margin: '0 0 8px' }}>
            Appointment Request Confirmed!
          </h3>

          <p style={{ fontSize: '0.9rem', color: isLight ? '#334155' : '#D1D5DB', margin: '0 0 20px', maxWidth: '480px', marginInline: 'auto' }}>
            {cfg.confirmationMessage || 'Thank you for scheduling with us! Your consultation request has been recorded.'}
          </p>

          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '16px 24px',
              borderRadius: '14px',
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(0, 0, 0, 0.4)',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
              marginBottom: '24px',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '0.74rem', color: isLight ? '#64748B' : '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              Booking Reference
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: accentColor, letterSpacing: '0.04em' }}>
              {bookingResult.referenceCode}
            </div>
            <div style={{ fontSize: '0.84rem', color: isLight ? '#334155' : '#E2D9F3', marginTop: '4px' }}>
              📅 {selectedDate} • ⏰ {selectedSlot?.displayTime} ({cfg.slotDurationMinutes || 30} mins)
            </div>
            {bookingResult.appointment?.serviceName && (
              <div style={{ fontSize: '0.82rem', color: isLight ? '#475569' : '#CBD5E1' }}>
                💼 Service: {bookingResult.appointment.serviceName}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={handleBookAnother}
              style={{
                padding: '10px 22px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: accentColor,
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${glowColor}40`
              }}
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      ) : (
        /* Booking Interface */
        <form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
          {/* Step 1: Horizontal Date Selector */}
          <div style={{ marginBottom: '22px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: isLight ? '#130B22' : '#FFFFFF',
                marginBottom: '10px'
              }}
            >
              1. Select a Date
            </label>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
                scrollbarWidth: 'thin'
              }}
            >
              {availableDates.map((item) => {
                const isSelected = selectedDate === item.dateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(item.dateStr)}
                    style={{
                      flex: '0 0 auto',
                      width: '68px',
                      padding: '12px 6px',
                      borderRadius: '14px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: isSelected
                        ? `2px solid ${accentColor}`
                        : `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                      backgroundColor: isSelected
                        ? accentColor
                        : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'),
                      color: isSelected
                        ? '#FFFFFF'
                        : (isLight ? '#334155' : '#D5C9E5'),
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600, opacity: 0.85 }}>
                      {item.dayName}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0' }}>
                      {item.dayNum}
                    </div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                      {item.monthName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Time Slot Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: isLight ? '#130B22' : '#FFFFFF',
                marginBottom: '10px'
              }}
            >
              <span>2. Select Time Slot</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: isLight ? '#64748B' : '#94A3B8' }}>
                Duration: {cfg.slotDurationMinutes || 30} mins
              </span>
            </label>

            {availableSlots.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '14px',
                  backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                  border: `1px dashed ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                  textAlign: 'center',
                  color: isLight ? '#64748B' : '#94A3B8',
                  fontSize: '0.86rem'
                }}
              >
                No consultation slots are open for this date. Please select another day.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
                  gap: '8px'
                }}
              >
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: isSelected
                          ? `1.5px solid ${accentColor}`
                          : `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                        backgroundColor: isSelected
                          ? (isLight ? `${accentColor}18` : `${accentColor}25`)
                          : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'),
                        color: isSelected
                          ? accentColor
                          : (isLight ? '#1E293B' : '#F1F5F9'),
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.16s ease'
                      }}
                    >
                      {slot.displayTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Service / Consultation Selection Cards */}
          {publishedServices.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: isLight ? '#130B22' : '#FFFFFF',
                  marginBottom: '10px'
                }}
              >
                <span>3. Select Consultation Type</span>
                <span style={{ fontSize: '0.72rem', color: isLight ? '#64748B' : '#94A3B8', fontWeight: 500 }}>
                  Optional
                </span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedServiceId('')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: selectedServiceId === ''
                      ? `2px solid ${accentColor}`
                      : `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                    backgroundColor: selectedServiceId === ''
                      ? (isLight ? `${accentColor}12` : `${accentColor}20`)
                      : (isLight ? '#FFFFFF' : 'rgba(255,255,255,0.03)'),
                    color: selectedServiceId === '' ? accentColor : (isLight ? '#1E293B' : '#E2E8F0'),
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: selectedServiceId === '' ? `0 0 12px ${accentColor}25` : 'none',
                    transition: 'all 0.16s ease'
                  }}
                >
                  <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>General Consultation</div>
                  <div style={{ fontSize: '0.72rem', color: isLight ? '#64748B' : '#94A3B8', marginTop: '2px' }}>
                    Discussion &amp; networking
                  </div>
                </button>

                {publishedServices.map((srv) => {
                  const isSelected = selectedServiceId === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServiceId(srv.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSelected
                          ? `2px solid ${accentColor}`
                          : `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                        backgroundColor: isSelected
                          ? (isLight ? `${accentColor}12` : `${accentColor}20`)
                          : (isLight ? '#FFFFFF' : 'rgba(255,255,255,0.03)'),
                        color: isSelected ? accentColor : (isLight ? '#1E293B' : '#E2E8F0'),
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: isSelected ? `0 0 12px ${accentColor}25` : 'none',
                        transition: 'all 0.16s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>{srv.title}</div>
                      <div style={{ fontSize: '0.72rem', color: isLight ? '#64748B' : '#94A3B8', marginTop: '2px' }}>
                        {srv.price ? srv.price : 'Scheduled Session'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Visitor Contact Details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              marginBottom: '16px'
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isLight ? '#475569' : '#CBD5E1',
                  marginBottom: '6px'
                }}
              >
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Maya Sharma"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                  backgroundColor: isLight ? '#FFFFFF' : '#130B22',
                  color: isLight ? '#0F172A' : '#FFFFFF',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isLight ? '#475569' : '#CBD5E1',
                  marginBottom: '6px'
                }}
              >
                Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                  backgroundColor: isLight ? '#FFFFFF' : '#130B22',
                  color: isLight ? '#0F172A' : '#FFFFFF',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isLight ? '#475569' : '#CBD5E1',
                  marginBottom: '6px'
                }}
              >
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="maya@example.com"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                  backgroundColor: isLight ? '#FFFFFF' : '#130B22',
                  color: isLight ? '#0F172A' : '#FFFFFF',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: isLight ? '#475569' : '#CBD5E1',
                  marginBottom: '6px'
                }}
              >
                Meeting Notes / Agenda (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly describe what you would like to discuss..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                  backgroundColor: isLight ? '#FFFFFF' : '#130B22',
                  color: isLight ? '#0F172A' : '#FFFFFF',
                  fontSize: '0.86rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#F87171',
                fontSize: '0.84rem',
                marginBottom: '16px'
              }}
            >
              <AlertCircle size={16} flexShrink={0} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSlot}
              style={{
                width: '100%',
                padding: '13px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: selectedSlot ? accentColor : (isLight ? '#CBD5E1' : '#334155'),
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.94rem',
                cursor: selectedSlot && !isSubmitting ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: selectedSlot ? `0 6px 20px ${glowColor}40` : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              {isSubmitting ? (
                <span>Confirming Booking...</span>
              ) : selectedSlot ? (
                <>
                  <span>Confirm Booking for {selectedSlot.displayTime}</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <span>Select a time slot above</span>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
