/* ==========================================================================
   FLOCARD CUSTOMER DASHBOARD — APPOINTMENTS TAB
   Allows customers and profile owners to:
   - View all client appointments booked through their digital profiles
   - View appointments booked by the customer
   - Confirm pending booking requests
   - Reschedule dates and times
   - Cancel appointments
   - Display customer's contact email for notification delivery
   ========================================================================== */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  User,
  ExternalLink,
  Copy,
  Check,
  CalendarCheck,
  X,
  Share2
} from 'lucide-react';
import { StorageEngine } from '../../lib/storage';
import { appointmentService } from '../../lib/appointmentService';

export default function CustomerAppointmentsTab({ customer, profiles = [] }) {
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const primaryProfile = profiles[0] || null;
  const userEmail = customer?.email || '';

  const loadAppointments = () => {
    setIsRefreshing(true);
    try {
      const all = StorageEngine.getAppointments();
      const userSlugs = profiles.map(p => (p.slug || '').toLowerCase().trim());
      const cleanEmail = (userEmail || '').toLowerCase().trim();

      // Filter appointments that either belong to user's profiles OR where user is the customer
      const relevant = all.filter(a => {
        const slugMatch = a.profileSlug && userSlugs.includes(a.profileSlug.toLowerCase().trim());
        const emailMatch = a.customerEmail && a.customerEmail.toLowerCase().trim() === cleanEmail;
        return slugMatch || emailMatch;
      });

      // Sort by booking date descending
      relevant.sort((a, b) => new Date(b.bookingDate || b.date) - new Date(a.bookingDate || a.date));
      setAppointments(relevant);
    } catch (e) {
      console.error('Failed to load user appointments:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 200);
    }
  };

  useEffect(() => {
    loadAppointments();

    const handleUpdate = () => loadAppointments();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('flocard_appointment_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('flocard_appointment_updated', handleUpdate);
    };
  }, [customer, profiles]);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopyCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Status updates
  const handleStatusChange = async (appointmentId, newStatus) => {
    const updated = await appointmentService.updateStatus(appointmentId, newStatus, customer);
    if (updated) {
      showToast(`Appointment status changed to ${newStatus}`);
      StorageEngine.addAuditLog(
        'Appointment',
        `Customer updated appointment ${updated.referenceCode} to ${newStatus}`,
        customer?.name || 'Customer',
        null,
        {
          action: 'customer_appointment.status_update',
          entityId: appointmentId,
          afterValues: { status: newStatus }
        }
      );
      loadAppointments();
    } else {
      showToast('Failed to update status', 'error');
    }
  };

  // Reschedule submit
  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!rescheduleModal || !newDate || !newTime) return;

    const [hours, minutes] = newTime.split(':').map(Number);
    const endH = (hours + 1).toString().padStart(2, '0');
    const endM = (minutes || 0).toString().padStart(2, '0');
    const endTimeStr = `${endH}:${endM}`;

    const all = StorageEngine.getAppointments();
    const updated = all.map(a => {
      if (a.id === rescheduleModal.id) {
        return {
          ...a,
          date: newDate,
          bookingDate: newDate,
          time: newTime,
          startTime: newTime,
          endTime: endTimeStr,
          status: 'confirmed',
          rescheduledAt: new Date().toISOString()
        };
      }
      return a;
    });

    localStorage.setItem('flocard_appointments', JSON.stringify(updated));
    window.dispatchEvent(new Event('flocard_appointment_updated'));

    StorageEngine.addAuditLog(
      'Appointment',
      `Customer rescheduled appointment ${rescheduleModal.referenceCode} to ${newDate} at ${newTime}`,
      customer?.name || 'Customer'
    );

    showToast(`Appointment rescheduled to ${newDate} at ${newTime}`);
    setRescheduleModal(null);
    loadAppointments();
  };

  // Filtered list
  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (statusFilter !== 'ALL' && (a.status || 'pending').toUpperCase() !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (a.customerName || '').toLowerCase().includes(q) ||
          (a.customerPhone || '').toLowerCase().includes(q) ||
          (a.customerEmail || '').toLowerCase().includes(q) ||
          (a.referenceCode || '').toLowerCase().includes(q) ||
          (a.serviceName || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      pending: appointments.filter(a => a.status === 'pending').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length
    };
  }, [appointments]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: notification.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.85rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header Banner with User Email Indicator */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          backgroundColor: 'var(--card-surface)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarCheck size={26} color="var(--accent-purple)" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Appointments & Bookings
            </h1>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Review consultation requests and visitor bookings submitted via your digital profile.
          </p>

          {/* User Email Indicator */}
          {userEmail && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '10px',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(107, 0, 255, 0.1)',
                border: '1px solid rgba(107, 0, 255, 0.25)',
                fontSize: '0.76rem',
                color: 'var(--text-primary)',
                fontWeight: 600
              }}
            >
              <Mail size={13} color="var(--accent-purple)" />
              <span>Notification Email:</span>
              <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>{userEmail}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {primaryProfile && (
            <a
              href={`/p/${primaryProfile.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>View Profile</span>
              <ExternalLink size={13} />
            </a>
          )}
          <button
            type="button"
            onClick={loadAppointments}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div style={{ padding: '18px 20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Appointments</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.total}</div>
        </div>
        <div style={{ padding: '18px 20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600, textTransform: 'uppercase' }}>Confirmed</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>{stats.confirmed}</div>
        </div>
        <div style={{ padding: '18px 20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: '#F59E0B', fontWeight: 600, textTransform: 'uppercase' }}>Pending Review</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>{stats.pending}</div>
        </div>
        <div style={{ padding: '18px 20px', borderRadius: '14px', backgroundColor: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.74rem', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase' }}>Cancelled</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>{stats.cancelled}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '14px',
          backgroundColor: 'var(--card-surface)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by client, email, phone, reference..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--elevated-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--elevated-surface)', padding: '3px', borderRadius: '8px' }}>
          {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: statusFilter === st ? 'var(--primary-purple)' : 'transparent',
                color: statusFilter === st ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {st.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div
        style={{
          borderRadius: '16px',
          backgroundColor: 'var(--card-surface)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Calendar size={42} color="var(--accent-purple)" style={{ opacity: 0.6, margin: '0 auto 12px', display: 'block' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No Appointments Found
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.84rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or filter.'
                : 'When clients visit your digital profile and book an appointment, their schedule requests will appear here.'}
            </p>
            {primaryProfile && (
              <a
                href={`/p/${primaryProfile.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Share Profile Link</span>
                <Share2 size={13} />
              </a>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--elevated-surface)', color: 'var(--text-secondary)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Reference</th>
                  <th style={{ padding: '12px 16px' }}>Client</th>
                  <th style={{ padding: '12px 16px' }}>Service</th>
                  <th style={{ padding: '12px 16px' }}>Date & Time</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt) => {
                  const statusColors = {
                    pending: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
                    confirmed: { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' },
                    cancelled: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
                    completed: { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' }
                  };
                  const colors = statusColors[appt.status] || statusColors.pending;

                  return (
                    <tr key={appt.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(appt.referenceCode)}
                          title="Click to copy reference code"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: 'var(--accent-purple)',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{appt.referenceCode}</span>
                          {copiedCode === appt.referenceCode ? (
                            <Check size={12} color="#10B981" />
                          ) : (
                            <Copy size={11} style={{ opacity: 0.6 }} />
                          )}
                        </button>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(appt.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {appt.customerName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', flexWrap: 'wrap' }}>
                          <a
                            href={`tel:${appt.customerPhone}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'inherit', textDecoration: 'none' }}
                          >
                            <Phone size={11} /> {appt.customerPhone}
                          </a>
                          {appt.customerEmail && (
                            <a
                              href={`mailto:${appt.customerEmail}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'inherit', textDecoration: 'none' }}
                            >
                              <Mail size={11} /> {appt.customerEmail}
                            </a>
                          )}
                        </div>
                        {appt.notes && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                            &ldquo;{appt.notes}&rdquo;
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {appt.serviceName || 'Consultation'}
                        </div>
                        {appt.profileSlug && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', marginTop: '2px' }}>
                            /p/{appt.profileSlug}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <Calendar size={13} color="var(--accent-purple)" />
                          <span>{appt.bookingDate || appt.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          <Clock size={12} />
                          <span>{appt.startTime || appt.time}</span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            textTransform: 'capitalize'
                          }}
                        >
                          ● {appt.status || 'pending'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {appt.status !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(appt.id, 'confirmed')}
                              title="Confirm / Accept Request"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#10B981',
                                color: '#FFFFFF',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Check size={12} />
                              <span>Confirm</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleModal(appt);
                              setNewDate(appt.bookingDate || appt.date);
                              setNewTime(appt.startTime || appt.time);
                            }}
                            title="Reschedule Appointment"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--elevated-surface)',
                              color: 'var(--text-primary)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Calendar size={12} />
                            <span>Reschedule</span>
                          </button>
                          {appt.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(appt.id, 'cancelled')}
                              title="Cancel Appointment"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #FECACA',
                                backgroundColor: '#FEF2F2',
                                color: '#EF4444',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--card-surface)',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Reschedule Booking
              </h3>
              <button
                type="button"
                onClick={() => setRescheduleModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Select a new date and time for <strong>{rescheduleModal.customerName}</strong> ({rescheduleModal.referenceCode}).
            </p>

            <form onSubmit={handleRescheduleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  New Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setNewDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--elevated-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  New Time
                </label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--elevated-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRescheduleModal(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
